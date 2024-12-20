const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const os = require('os');

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-4';
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
        model: "whisper-1", // Whisper model is fixed as it's specifically for audio
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
}

module.exports = new OpenAIService();
