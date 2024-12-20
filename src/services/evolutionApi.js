const axios = require('axios');

class EvolutionApiService {
  constructor() {
    this.baseUrl = process.env.EVOLUTION_API_URL;
    this.apiKey = process.env.EVOLUTION_API_KEY;
  }

  async sendMessage(instanceId, to, message) {
    try {
      const url = `${this.baseUrl}/message/sendText/${instanceId}`;
      const data = {
        number: to,
        text: message,
        delay: 1200,
        linkPreview: true
      };

      console.log('Sending message:', {
        url,
        number: to,
        message,
        data: JSON.stringify(data, null, 2)
      });

      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        }
      });

      console.log('Message sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
      throw error.response?.data || error;
    }
  }

  async sendMedia(instanceId, to, mediaUrl) {
    try {
      const url = `${this.baseUrl}/message/sendMedia/${instanceId}`;
      const data = {
        media: mediaUrl,
        number: to,
        mediatype: "image"
      };

      console.log('Sending media:', {
        url,
        number: to,
        mediaUrl,
        data: JSON.stringify(data, null, 2)
      });

      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        }
      });

      console.log('Media sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending media:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
      throw error.response?.data || error;
    }
  }
}

module.exports = new EvolutionApiService();
