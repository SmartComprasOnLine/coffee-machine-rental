require('dotenv').config();
const evolutionApi = require('../services/evolutionApi');

async function testMessageSending() {
    const instanceId = process.env.EVOLUTION_INSTANCE;
    const testNumber = '5581999725668';
    
    try {
        console.log('Environment variables:', {
            baseUrl: process.env.EVOLUTION_API_URL,
            apiKey: process.env.EVOLUTION_API_KEY ? '***' : undefined,
            instanceId: process.env.EVOLUTION_INSTANCE
        });

        console.log('\nTesting text message...');
        try {
            await evolutionApi.sendMessage(
                instanceId,
                testNumber,
                '*Teste de Mensagem*\nOlá! Esta é uma mensagem de teste do sistema.'
            );
            console.log('Text message sent successfully');
        } catch (error) {
            console.error('Error sending text message:', {
                status: error.status,
                error: error.error,
                response: error.response,
                fullError: JSON.stringify(error, null, 2)
            });
        }

        console.log('\nTesting media message...');
        try {
            await evolutionApi.sendMedia(
                instanceId,
                testNumber,
                'https://thumbcdn-4.hotelurbano.net/JflmVs-D7vNRMWKR_Ptdjf1VPFk=/1240x0/center/middle/filters:format(webp):strip_icc():quality(80)/https://s3.amazonaws.com/legado-prod/prod/ofertas/imagens/2022/11/17/10/08/1200x0.jpg'
            );
            console.log('Media message sent successfully');
        } catch (error) {
            console.error('Error sending media message:', {
                status: error.status,
                error: error.error,
                response: error.response,
                fullError: JSON.stringify(error, null, 2)
            });
        }

        console.log('\nAll tests completed!');
    } catch (error) {
        console.error('Error during test:', error);
        if (error.response) {
            console.error('\nResponse error details:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data,
                headers: error.response.headers
            });
        }
        if (error.config) {
            console.error('\nRequest details:', {
                url: error.config.url,
                method: error.config.method,
                headers: error.config.headers,
                data: error.config.data
            });
        }
    }
}

testMessageSending();
