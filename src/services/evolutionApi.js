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
        options: {
          delay: 1200,
          presence: "composing"
        },
        textMessage: {
          text: message
        }
      };

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
      const url = `${this.baseUrl}/message/sendMedia/${instanceId}`;
      const data = {
        number: to,
        options: {
          delay: 1200,
          presence: "composing"
        },
        mediaMessage: {
          mediatype: this.determineMediaType(mediaUrl),
          media: mediaUrl
        }
      };

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
      const url = `${this.baseUrl}/message/sendTemplate/${instanceId}`;
      const data = {
        number: to,
        options: {
          delay: 1200,
          presence: "composing"
        },
        template: {
          name: template,
          language: {
            code: language
          }
        }
      };

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
      const url = `${this.baseUrl}/message/sendButtons/${instanceId}`;
      const data = {
        number: to,
        options: {
          delay: 1200,
          presence: "composing"
        },
        buttonMessage: {
          title: "Opções disponíveis",
          description: message,
          buttons: buttons.map(button => ({
            buttonId: button.id,
            buttonText: button.text
          }))
        }
      };

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
      const url = `${this.baseUrl}/message/sendList/${instanceId}`;
      const data = {
        number: to,
        options: {
          delay: 1200,
          presence: "composing"
        },
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
