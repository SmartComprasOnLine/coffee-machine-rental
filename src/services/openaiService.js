const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const os = require('os');

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
        model: "whisper-1", // Whisper is the only model for audio transcription
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

      // Prepare messages array with context
      const messages = context.messages || [];

      // Add the new prompt
      messages.push({
        role: "user",
        content: prompt
      });

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
    const basePrompt = "Você é a Júlia, assistente digital do Grupo Souza Café. ";
    let specificPrompt = "";

    switch (intent) {
      case 'GREETING':
        specificPrompt = "Gere uma saudação amigável e profissional, adaptada ao histórico da conversa.";
        break;
      case 'MACHINE_PRICE_INQUIRY':
        specificPrompt = "Explique os benefícios e características da máquina recomendada, focando em resolver as necessidades específicas mencionadas no histórico.";
        break;
      case 'PRODUCT_INQUIRY':
        specificPrompt = "Apresente os produtos compatíveis, destacando combinações populares e benefícios baseados no histórico da conversa.";
        break;
      case 'CONTRACT_INQUIRY':
        specificPrompt = "Explique os termos do contrato de forma clara e amigável, abordando preocupações específicas mencionadas no histórico.";
        break;
      default:
        specificPrompt = "Mantenha a conversa focada em ajudar o cliente a encontrar a melhor solução para suas necessidades.";
    }

    const response = await this.generateResponse(basePrompt + specificPrompt, context);
    return response;
  }
}

module.exports = new OpenAIService();
