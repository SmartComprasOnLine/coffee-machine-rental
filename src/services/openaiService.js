const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const os = require('os');
const Machine = require('../models/Machine');
const Product = require('../models/Product');

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.model = process.env.OPENAI_MODEL;
    if (!this.model) {
      throw new Error('OPENAI_MODEL environment variable is required');
    }
  }

  async transcribeAudio(audioBase64) {
    try {
      console.log('Starting audio transcription...');
      
      // Create temporary file
      const tempDir = path.join(os.tmpdir(), 'audio-' + Date.now());
      fs.mkdirSync(tempDir, { recursive: true });
      const tempFilePath = path.join(tempDir, 'audio.ogg');
      
      // Write base64 to file
      fs.writeFileSync(tempFilePath, Buffer.from(audioBase64, 'base64'));
      console.log('Audio file created at:', tempFilePath);

      // Create read stream and transcribe
      const transcription = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: "whisper-1",
        language: "pt"
      });

      console.log('Transcription received:', transcription.text);

      // Clean up
      fs.unlinkSync(tempFilePath);
      fs.rmdirSync(tempDir);

      return transcription.text;
    } catch (error) {
      console.error('Error details:', error);
      throw new Error(`Failed to transcribe audio: ${error.message}`);
    }
  }

  async analyzeImage(imageBase64) {
    try {
      console.log('Starting image analysis...');
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: "Descreva esta imagem em detalhes, focando em aspectos relevantes para uma máquina de café ou produtos relacionados. Se não houver relação com café ou máquinas, apenas descreva o conteúdo principal da imagem." 
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      });

      console.log('Image analysis completed');
      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw new Error(`Failed to analyze image: ${error.message}`);
    }
  }

  async generateResponse(prompt, context) {
    try {
      console.log('Generating response with context using model:', this.model);

      // Get available machines and products from database
      const machines = await Machine.find({ availableForRent: true, stock: { $gt: 0 } });
      const products = await Product.find({ availableForSale: true, stock: { $gt: 0 } });

      // Format database information
      const databaseContext = {
        machines: machines.map(m => ({
          name: m.name,
          price: m.rentalPrice,
          description: m.description,
          supportedProducts: m.supportedProducts,
          dimensions: m.dimensions,
          paymentMethod: m.paymentMethod,
          contractDuration: m.contractDuration
        })),
        products: products.map(p => ({
          name: p.name,
          price: p.price,
          category: p.category,
          compatibleMachines: p.compatibleMachines,
          description: p.description,
          dosage: p.dosage
        }))
      };

      // Prepare messages array with context and database information
      const messages = [
        {
          role: "system",
          content: `Você é a Júlia, assistente digital do Grupo Souza Café. Use estas informações atualizadas do banco de dados para suas respostas:\n${JSON.stringify(databaseContext, null, 2)}`
        },
        ...(context.messages || []),
        {
          role: "user",
          content: prompt
        }
      ];

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
        frequency_penalty: 0.5,
        presence_penalty: 0.3
      });

      console.log('Response generated successfully');
      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating response:', error);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }

  async generatePrompt(intent, context) {
    try {
      // Get available machines and products from database
      const machines = await Machine.find({ availableForRent: true, stock: { $gt: 0 } });
      const products = await Product.find({ availableForSale: true, stock: { $gt: 0 } });

      const basePrompt = `
        Você é a Júlia, assistente digital do Grupo Souza Café.
        
        Máquinas disponíveis:
        ${machines.map(m => `- ${m.name}: R$ ${m.rentalPrice}/mês - ${m.description}`).join('\n')}
        
        Produtos disponíveis:
        ${products.map(p => `- ${p.name}: R$ ${p.price} - ${p.description}`).join('\n')}
      `;

      let specificPrompt = "";
      switch (intent) {
        case 'GREETING':
          specificPrompt = "Gere uma saudação amigável e profissional, mencionando nossa variedade de máquinas disponíveis.";
          break;
        case 'MACHINE_PRICE_INQUIRY':
          specificPrompt = "Explique os benefícios e características das máquinas disponíveis, focando nos preços e condições atuais.";
          break;
        case 'PRODUCT_INQUIRY':
          specificPrompt = "Apresente os produtos compatíveis disponíveis em estoque, destacando preços e benefícios.";
          break;
        case 'CONTRACT_INQUIRY':
          specificPrompt = "Explique os termos do contrato, usando as informações das máquinas disponíveis como referência.";
          break;
        default:
          specificPrompt = "Mantenha a conversa focada em ajudar o cliente a encontrar a melhor solução com nossas máquinas e produtos disponíveis.";
      }

      const response = await this.generateResponse(basePrompt + "\n" + specificPrompt, context);
      return response;
    } catch (error) {
      console.error('Error generating prompt:', error);
      throw new Error(`Failed to generate prompt: ${error.message}`);
    }
  }
}

module.exports = new OpenAIService();
