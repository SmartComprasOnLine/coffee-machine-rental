const axios = require('axios');
require('dotenv').config();

class EvolutionAPI {
    constructor() {
        this.baseURL = process.env.EVOLUTION_API_URL;
        this.apiKey = process.env.EVOLUTION_API_KEY;
        this.instance = process.env.INSTANCE_NAME;
    }

    async sendText(to, text) {
        try {
            const response = await axios.post(
                `${this.baseURL}/message/sendText/${this.instance}`,
                {
                    number: to,
                    text: text
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': this.apiKey
                    }
                }
            );

            console.log('Message sent:', {
                to,
                status: response.status,
                data: response.data
            });

            return response.data;
        } catch (error) {
            console.error('Error sending message:', error.message);
            throw error;
        }
    }

    async sendImage(to, imageUrl, caption = '') {
        try {
            const response = await axios.post(
                `${this.baseURL}/message/sendImage/${this.instance}`,
                {
                    number: to,
                    imageUrl: imageUrl,
                    caption: caption
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': this.apiKey
                    }
                }
            );

            console.log('Image sent:', {
                to,
                status: response.status,
                data: response.data
            });

            return response.data;
        } catch (error) {
            console.error('Error sending image:', error.message);
            throw error;
        }
    }

    async sendVideo(to, videoUrl, caption = '') {
        try {
            const response = await axios.post(
                `${this.baseURL}/message/sendVideo/${this.instance}`,
                {
                    number: to,
                    videoUrl: videoUrl,
                    caption: caption
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': this.apiKey
                    }
                }
            );

            console.log('Video sent:', {
                to,
                status: response.status,
                data: response.data
            });

            return response.data;
        } catch (error) {
            console.error('Error sending video:', error.message);
            throw error;
        }
    }

    async sendLocation(to, latitude, longitude, name = '', address = '') {
        try {
            const response = await axios.post(
                `${this.baseURL}/message/sendLocation/${this.instance}`,
                {
                    number: to,
                    latitude: latitude,
                    longitude: longitude,
                    name: name,
                    address: address
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': this.apiKey
                    }
                }
            );

            console.log('Location sent:', {
                to,
                status: response.status,
                data: response.data
            });

            return response.data;
        } catch (error) {
            console.error('Error sending location:', error.message);
            throw error;
        }
    }

    async sendButtons(to, text, buttons) {
        try {
            const response = await axios.post(
                `${this.baseURL}/message/sendButtons/${this.instance}`,
                {
                    number: to,
                    text: text,
                    buttons: buttons
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': this.apiKey
                    }
                }
            );

            console.log('Buttons sent:', {
                to,
                status: response.status,
                data: response.data
            });

            return response.data;
        } catch (error) {
            console.error('Error sending buttons:', error.message);
            throw error;
        }
    }
}

module.exports = new EvolutionAPI();
