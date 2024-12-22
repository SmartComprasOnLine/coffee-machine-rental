const axios = require('axios');

async function testAgentInteraction() {
  try {
    const userMessage = "Oi, estou procurando uma máquina prática que ofereça várias opções de bebidas.";
    
    const response = await axios.post(
      'http://app:3000/api/webhook/coffee',
      {
        data: {
          message: {
            conversation: userMessage,
            messageType: 'conversation',
            key: {
              remoteJid: '558199725668@s.whatsapp.net',
              fromMe: false,
              id: '3AAD465AC6792528B175'
            },
            pushName: 'Diêgo Santana' // Adding pushName to simulate a real user
          }
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Agent response:', response.data);
  } catch (error) {
    console.error('Error during agent interaction test:', error.response?.data || error);
    if (error.response) {
      console.error('Response error details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    }
  }
}

testAgentInteraction();
