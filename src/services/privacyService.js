const Conversation = require('../models/Conversation');
const Customer = require('../models/Customer');

class PrivacyService {
  async deleteUserData(userId) {
    try {
      console.log(`Starting data deletion for user ${userId}`);

      // Delete conversation history
      const deleteConversationResult = await Conversation.deleteMany({ userId });
      console.log('Conversation deletion result:', {
        userId,
        deletedCount: deleteConversationResult.deletedCount
      });

      // Delete customer data
      const deleteCustomerResult = await Customer.deleteMany({ userId });
      console.log('Customer deletion result:', {
        userId,
        deletedCount: deleteCustomerResult.deletedCount
      });

      return {
        success: true,
        message: 'Todos os seus dados foram apagados com sucesso.',
        deletedData: {
          conversations: deleteConversationResult.deletedCount,
          customerRecords: deleteCustomerResult.deletedCount
        }
      };
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw new Error('Não foi possível apagar os dados. Por favor, tente novamente mais tarde.');
    }
  }

  async confirmDeletion(userId) {
    return {
      message: '*Confirmação de Exclusão de Dados*\n\n' +
        'Seus dados foram completamente apagados do nosso sistema, incluindo:\n\n' +
        '• Histórico de conversas\n' +
        '• Informações de contato\n' +
        '• Preferências salvas\n\n' +
        '_Se desejar utilizar nossos serviços novamente no futuro, será necessário fornecer suas informações novamente._\n\n' +
        '*Agradecemos a confiança!*'
    };
  }
}

module.exports = new PrivacyService();
