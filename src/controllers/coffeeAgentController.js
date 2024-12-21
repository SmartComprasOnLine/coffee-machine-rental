const coffeeAgentService = require('../services/coffeeAgentService');
const intentService = require('../services/intentService');
const evolutionApi = require('../services/evolutionApi');
const openaiService = require('../services/openaiService');
const conversationService = require('../services/conversationService');
const privacyService = require('../services/privacyService');
const Machine = require('../models/Machine');
const Product = require('../models/Product');

class CoffeeAgentController {
  constructor() {
    this.instanceId = process.env.EVOLUTION_INSTANCE;
  }

  async handleWebhook(req, res) {
    try {
      const webhookData = Array.isArray(req.body) ? req.body[0] : req.body;
      console.log('Received webhook data:', webhookData);

      const messageData = webhookData?.data;
      if (!messageData) {
        return res.status(200).json({ message: 'No message data received' });
      }

      const messageType = messageData.messageType;
      let text;
      let mediaUrl;
      let mediaBase64;

      if (messageType === 'conversation') {
        text = messageData.message?.conversation;
        console.log('Received text message:', text);
      } else if (messageType === 'audioMessage') {
        console.log('Processing audio message...');
        mediaBase64 = messageData.message?.base64;
        
        if (mediaBase64) {
          try {
            console.log('Attempting to transcribe audio...');
            text = await openaiService.transcribeAudio(mediaBase64);
            console.log('Audio transcription result:', text);
          } catch (error) {
            console.error('Error transcribing audio:', error);
            text = "Desculpe, não consegui processar o áudio. Poderia enviar sua mensagem em texto?";
          }
        } else {
          console.log('No base64 audio data found in message');
          text = "Por favor, envie sua mensagem em texto para que eu possa ajudá-lo melhor.";
        }
      } else if (messageType === 'imageMessage') {
        console.log('Processing image message...');
        mediaBase64 = messageData.message?.base64;
        const caption = messageData.message?.imageMessage?.caption;
        
        if (mediaBase64) {
          try {
            console.log('Attempting to analyze image...');
            const imageDescription = await openaiService.analyzeImage(mediaBase64);
            console.log('Image analysis result:', imageDescription);
            text = caption ? 
              `${caption}\n\nSobre a imagem que você enviou: ${imageDescription}` :
              `Sobre a imagem que você enviou: ${imageDescription}`;
          } catch (error) {
            console.error('Error analyzing image:', error);
            text = caption || "Desculpe, não consegui analisar a imagem. Como posso ajudar?";
          }
        } else {
          console.log('No base64 image data found in message');
          text = caption || "Recebi sua imagem. Como posso ajudar?";
        }
      }

      const from = messageData.key?.remoteJid;
      const userId = from.split('@')[0];
      const pushName = messageData.pushName;

      console.log('Extracted message details:', { 
        text, 
        from, 
        userId,
        instanceId: this.instanceId,
        pushName,
        messageType,
        hasMediaBase64: !!mediaBase64
      });

      if (!text) {
        return res.status(200).json({ message: 'No text message received' });
      }

      // Check for data deletion request
      if (text.toLowerCase() === 'apagar meus dados') {
        try {
          await privacyService.deleteUserData(userId);
          const response = await privacyService.confirmDeletion(userId);
          await evolutionApi.sendMessage(this.instanceId, from, response.message);
          return res.status(200).json({ success: true });
        } catch (error) {
          console.error('Error handling data deletion:', error);
          await evolutionApi.sendMessage(
            this.instanceId, 
            from, 
            '*Erro ao apagar dados*\n\nDesculpe, ocorreu um erro ao tentar apagar seus dados. Por favor, tente novamente mais tarde.'
          );
          return res.status(500).json({ error: error.message });
        }
      }

      // Get conversation context
      const context = await conversationService.getConversationContext(userId);
      console.log('Conversation context:', context);

      // Add user message to conversation history
      await conversationService.addUserMessage(
        userId,
        text,
        messageType === 'imageMessage' ? 'image' : 'text',
        mediaUrl
      );

      // Detect intent using AI
      const intent = await intentService.analyzeIntent(text, context);
      console.log('Detected intent:', intent);

      // Generate contextual response
      let response;
      if (intent === 'UNKNOWN') {
        response = await intentService.generateContextualResponse(intent, text, context);
      } else {
        response = await this.generateResponse(intent, text, context);
      }
      console.log('Generated response:', response);

      // Add assistant response to conversation history
      await conversationService.addAssistantMessage(
        userId,
        response.message,
        response.mediaUrls ? 'image' : 'text',
        response.mediaUrls ? response.mediaUrls[0] : null
      );

      // Send response
      await evolutionApi.sendMessage(this.instanceId, from, response.message);

      if (response.mediaUrls && response.mediaUrls.length > 0) {
        for (const mediaUrl of response.mediaUrls) {
          await evolutionApi.sendMedia(this.instanceId, from, mediaUrl);
        }
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error in handleWebhook:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  async generateResponse(intent, text, context) {
    try {
      switch (intent) {
        case 'GREETING':
          return await coffeeAgentService.handleInitialEngagement(context);

        case 'MACHINE_PRICE_INQUIRY': {
          const requirements = this.extractRequirements(text);
          return await coffeeAgentService.getMachineRecommendation(requirements, context);
        }

        case 'PRODUCT_INQUIRY': {
          const machineName = this.extractMachineName(text);
          if (machineName) {
            return await coffeeAgentService.getProductsForMachine(machineName, context);
          }
          return await intentService.generateContextualResponse(intent, text, context);
        }

        case 'CONTRACT_INQUIRY':
        case 'CONTRACT_DOCUMENTS':
        case 'CLOSING_INTENT':
          return await coffeeAgentService.handleContractInquiry(context);

        case 'SUPPORT_INQUIRY':
        case 'PAYMENT_INQUIRY':
        case 'PERSONAL_QUESTION':
        case 'CEP_INFO':
          return await intentService.generateContextualResponse(intent, text, context);

        default:
          return await intentService.generateContextualResponse('UNKNOWN', text, context);
      }
    } catch (error) {
      console.error('Error in generateResponse:', error);
      throw error;
    }
  }

  extractRequirements(text) {
    const requirements = {
      beverageTypes: [],
      maxPrice: null
    };

    if (text.includes('café')) requirements.beverageTypes.push('café');
    if (text.includes('chocolate')) requirements.beverageTypes.push('chocolate');
    if (text.includes('cappuccino')) requirements.beverageTypes.push('cappuccino');
    if (text.includes('chá')) requirements.beverageTypes.push('chá');

    const priceMatch = text.match(/R?\$?\s*(\d+)/);
    if (priceMatch) {
      requirements.maxPrice = parseInt(priceMatch[1]);
    }

    return requirements;
  }

  extractMachineName(text) {
    const machineNames = ['Rubi', 'Onix', 'Jade'];
    for (const name of machineNames) {
      if (text.toLowerCase().includes(name.toLowerCase())) {
        return name;
      }
    }
    return null;
  }
}

module.exports = new CoffeeAgentController();
