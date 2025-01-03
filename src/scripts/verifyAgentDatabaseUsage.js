const axios = require('axios');

async function verifyAgentDatabaseUsage() {
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
              remoteJid: 'user@example.com'
            }
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
    console.error('Error during agent database usage verification:', error.response?.data || error);
  }
}

verifyAgentDatabaseUsage();
