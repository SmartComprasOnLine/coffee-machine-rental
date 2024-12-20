const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async transcribeAudio(audioBase64) {
    try {
      // Create temporary file
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'audio-'));
      const tempFilePath = path.join(tempDir, 'audio.ogg');
      
      // Write base64 to temporary file
      await fs.writeFile(tempFilePath, Buffer.from(audioBase64, 'base64'));

      // Create a ReadStream for the file
      const file = await fs.readFile(tempFilePath);

      // Transcribe audio
      const transcription = await this.openai.audio.transcriptions.create({
        file: file,
        model: "whisper-1",
        language: "pt"
      });

      // Clean up temporary file
      await fs.unlink(tempFilePath);
      await fs.rmdir(tempDir);

      return transcription.text;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }

  async analyzeImage(imageBase64) {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-vision-preview",
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

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
  }
}

module.exports = new OpenAIService();
