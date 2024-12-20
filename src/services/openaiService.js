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
      console.log('Starting audio transcription...');
      
      // Create temporary file
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'audio-'));
      const tempFilePath = path.join(tempDir, 'audio.ogg');
      
      // Convert base64 to buffer and write to file
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      await fs.writeFile(tempFilePath, audioBuffer);
      
      console.log('Audio file created at:', tempFilePath);

      // Create a File object from the temporary file
      const file = await fs.readFile(tempFilePath);
      const blob = new Blob([file], { type: 'audio/ogg' });
      const formData = new FormData();
      formData.append('file', blob, 'audio.ogg');
      formData.append('model', 'whisper-1');
      formData.append('language', 'pt');

      console.log('Sending request to OpenAI...');

      // Transcribe audio
      const transcription = await this.openai.audio.transcriptions.create({
        file: formData.get('file'),
        model: "whisper-1",
        language: "pt",
        response_format: "text"
      });

      console.log('Transcription received:', transcription);

      // Clean up temporary files
      await fs.unlink(tempFilePath);
      await fs.rmdir(tempDir);

      return transcription;
    } catch (error) {
      console.error('Error details:', error);
      throw new Error(`Failed to transcribe audio: ${error.message}`);
    }
  }

  async analyzeImage(imageBase64) {
    try {
      console.log('Starting image analysis...');
      
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

      console.log('Image analysis completed');
      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw new Error(`Failed to analyze image: ${error.message}`);
    }
  }
}

module.exports = new OpenAIService();
