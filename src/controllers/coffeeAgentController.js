const coffeeAgentService = require('../services/coffeeAgentService');
const intentService = require('../services/intentService');
const evolutionApi = require('../services/evolutionApi');
const openaiService = require('../services/openaiService');
const spreadsheetService = require('../services/spreadsheetService');
const Machine = require('../models/Machine');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

class CoffeeAgentController {
  constructor() {
    this.instanceId = process.env.EVOLUTION_INSTANCE;
  }

  async handleWebhook(req, res) {
    try {
      const webhookData = Array.isArray(req.body) ? req.body[0] : req.body;
      console.log('Received webhook data:', webhookData);

      // Extract message details from Evolution API webhook format
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
      const pushName = messageData.pushName;

      console.log('Extracted message details:', { 
        text, 
        from, 
        instanceId: this.instanceId,
        pushName,
        messageType,
        hasMediaBase64: !!mediaBase64
      });

      if (!text) {
        return res.status(200).json({ message: 'No text message received' });
      }

      const intent = intentService.analyzeIntent(text);
      console.log('Detected intent:', intent);

      let response = await this.generateResponse(intent, text);
      console.log('Generated response:', response);

      // Send response using Evolution API
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

  async generateResponse(intent, text) {
    try {
      switch (intent) {
        case 'GREETING':
          return await coffeeAgentService.handleInitialEngagement();

        case 'MACHINE_PRICE_INQUIRY': {
          const requirements = this.extractRequirements(text);
          return await coffeeAgentService.getMachineRecommendation(requirements);
        }

        case 'PRODUCT_INQUIRY': {
          const machineName = this.extractMachineName(text);
          if (machineName) {
            return await coffeeAgentService.getProductsForMachine(machineName);
          }
          return {
            message: 'Para qual máquina você gostaria de saber sobre os produtos? Temos várias opções disponíveis.'
          };
        }

        case 'CONTRACT_GENERAL_INQUIRY':
        case 'CONTRACT_DOCUMENTS':
        case 'CLOSING_INTENT':
          return await coffeeAgentService.handleContractInquiry();

        case 'SUPPORT_GENERAL_INQUIRY':
        case 'SUPPORT_RESPONSE_TIME':
          return {
            message: '*Nosso suporte técnico é rápido e eficiente!* 🚀\n\n' +
              '• Atendimento em até 24 horas\n' +
              '• Suporte remoto imediato\n' +
              '• Manutenção preventiva trimestral\n' +
              '• Troca de máquina se necessário\n\n' +
              'Tudo isso já está incluído no valor da locação! 😊'
          };

        case 'PAYMENT_GENERAL_INQUIRY':
          return {
            message: '*Sobre os pagamentos:*\n\n' +
              '• Locação: Boleto mensal com 7 dias para pagamento\n' +
              '• Produtos: Boleto com prazo de 15 dias (pedidos acima de R$180)\n' +
              '• Entrega em até 3 dias úteis\n\n' +
              'Quer saber mais algum detalhe específico?'
          };

        default: {
          const template = intentService.getResponseTemplate(intent);
          return {
            message: template.message,
            requiresFollowUp: template.requiresFollowUp
          };
        }
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

  async handleSpreadsheetUpdate(req, res) {
    try {
      const data = req.body;
      console.log('Received spreadsheet data:', data);

      if (data.Planilha === 'MÁQUINAS ALUGAR') {
        await this.updateMachineData(data);
      }
      else if (data.Planilha === 'PRODUTOS') {
        await this.updateProductData(data);
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error in handleSpreadsheetUpdate:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  async updateMachineData(data) {
    try {
      const machineData = {
        name: data.MÁQUINA,
        availableForRent: data['DISPONÍVEL PARA ALUGUEL'] === 'SIM',
        stock: parseInt(data.ESTOQUE) || 0,
        acceptsPixPayment: data['ACEITA PIX COM QR CODE PARA LIBERAR AS BEBIDAS'] === 'SIM',
        image: data['IMAGEM / FOTO'],
        supportedProducts: data['PRODUTOS SUPORTADOS'],
        videos: data.VIDEOS,
        photoGallery: data['CATALOGO DE FOTOS'],
        installationVideos: data['VIDEOS DE INSTALAÇÕES'],
        customerFeedbackVideo: data['VIDEO DE FEEDBACK DO CLIENTE'],
        rentalPrice: parseFloat(data.LOCAÇÃO) || 0,
        paymentMethod: data['FORMA DE PAGAMENTO'],
        rentalDiscount: parseFloat(data['DESCONTO LOCAÇÃO']) || 0,
        description: data.DESCRICAO,
        dimensions: {
          height: data.ALTURA,
          width: data.LARGURA,
          depth: data.PROFUNDIDADE,
          weight: data.PESO
        },
        unsupportedProducts: data['INSUMOS NÃO SUPORTADOS'],
        contractDuration: data['CONTRATO FIDELIDADE'],
        cancellationFee: data['MULTA CANCELAMENTO DE CONTRATO']
      };

      await Machine.findOneAndUpdate(
        { name: data.MÁQUINA },
        machineData,
        { upsert: true, new: true }
      );

      console.log(`Updated/created machine: ${data.MÁQUINA}`);
    } catch (error) {
      console.error('Error updating machine data:', error);
      throw error;
    }
  }

  async updateProductData(data) {
    try {
      const productData = {
        name: data.NOME,
        price: parseFloat(data.PREÇO) || 0,
        compatibleMachines: data['MAQUINAS COMPATIVEIS'],
        dosage: {
          ml50: {
            grams: parseFloat(data['GRAMATURA 50ML']) || 0,
            doses: parseInt(data['DOSE 50 ML']) || 0,
            pricePerDose: parseFloat(data['PREÇO DOSE/50ML']) || 0
          },
          ml80: {
            grams: parseFloat(data['GRAMATURA 80ML']) || 0,
            doses: parseInt(data['DOSE 80ML']) || 0,
            pricePerDose: parseFloat(data['PREÇO DOSE/80ML']) || 0
          },
          ml120: {
            grams: parseFloat(data['GRAMATURA 120ML']) || 0,
            doses: parseInt(data['DOSE 120ML']) || 0,
            pricePerDose: parseFloat(data['PREÇO DOSE/ 120ML']) || 0
          }
        },
        description: data.DESCRIÇÃO,
        image: data.IMAGEM,
        availableForSale: data['DISPONÍVEL PARA VENDA'] === 'SIM',
        stock: parseInt(data.ESTOQUE) || 0,
        category: this.determineProductCategory(data.NOME)
      };

      await Product.findOneAndUpdate(
        { name: data.NOME },
        productData,
        { upsert: true, new: true }
      );

      console.log(`Updated/created product: ${data.NOME}`);
    } catch (error) {
      console.error('Error updating product data:', error);
      throw error;
    }
  }

  determineProductCategory(name) {
    name = name.toLowerCase();
    if (name.includes('café')) return 'COFFEE';
    if (name.includes('chocolate')) return 'CHOCOLATE';
    if (name.includes('cappuccino')) return 'CAPPUCCINO';
    if (name.includes('chá')) return 'TEA';
    if (name.includes('leite')) return 'MILK';
    return 'SUPPLIES';
  }
}

module.exports = new CoffeeAgentController();
