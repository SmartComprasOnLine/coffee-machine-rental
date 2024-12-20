const axios = require('axios');

class EvolutionApiService {
  constructor() {
    this.baseUrl = process.env.EVOLUTION_API_URL;
    this.apiKey = process.env.EVOLUTION_API_KEY;
  }

  async sendMessage(instanceId, to, message) {
    try {
      const url = `${this.baseUrl}/message/text/${instanceId}`;
      const data = {
        number: to,
        textMessage: message
      };

      console.log('Sending message:', {
        url,
        number: to,
        message
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
      console.error('Error sending message:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendMedia(instanceId, to, mediaUrl) {
    try {
      const url = `${this.baseUrl}/message/media/${instanceId}`;
      const data = {
        number: to,
        mediaMessage: {
          mediatype: this.determineMediaType(mediaUrl),
          media: mediaUrl
        }
      };

      console.log('Sending media:', {
        url,
        number: to,
        mediatype: this.determineMediaType(mediaUrl)
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
      console.error('Error sending media:', error.response?.data || error.message);
      throw error;
    }
  }

  determineMediaType(url) {
    const extension = url.split('.').pop().toLowerCase();
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const videoExtensions = ['mp4', 'mov', 'avi', 'webm'];
    const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
    
    if (imageExtensions.includes(extension)) return 'image';
    if (videoExtensions.includes(extension)) return 'video';
    if (documentExtensions.includes(extension)) return 'document';
    
    return 'image';
  }

  async sendTemplate(instanceId, to, template, language = 'pt_BR') {
    try {
      const url = `${this.baseUrl}/message/template/${instanceId}`;
      const data = {
        number: to,
        template: {
          name: template,
          language: {
            code: language
          }
        }
      };

      console.log('Sending template:', {
        url,
        number: to,
        template
      });

      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        }
      });

      console.log('Template sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending template:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendButtons(instanceId, to, message, buttons) {
    try {
      const url = `${this.baseUrl}/message/buttons/${instanceId}`;
      const data = {
        number: to,
        buttonMessage: {
          title: "Opções disponíveis",
          description: message,
          buttons: buttons.map(button => ({
            buttonId: button.id,
            buttonText: button.text
          }))
        }
      };

      console.log('Sending buttons:', {
        url,
        number: to,
        message,
        buttons: buttons.length
      });

      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        }
      });

      console.log('Buttons sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending buttons:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendList(instanceId, to, message, sections) {
    try {
      const url = `${this.baseUrl}/message/list/${instanceId}`;
      const data = {
        number: to,
        listMessage: {
          title: "Menu de opções",
          description: message,
          buttonText: "Ver opções",
          sections: sections.map(section => ({
            title: section.title,
            rows: section.items.map(item => ({
              title: item.title,
              description: item.description,
              rowId: item.id
            }))
          }))
        }
      };

      console.log('Sending list:', {
        url,
        number: to,
        message,
        sections: sections.length
      });

      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        }
      });

      console.log('List sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending list:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new EvolutionApiService();
