const Conversation = require('../models/Conversation');

class ConversationService {
  async getOrCreateConversation(userId) {
    try {
      let conversation = await Conversation.findOne({ userId });
      
      if (!conversation) {
        conversation = new Conversation({ userId });
        await conversation.save();
      }

      return conversation;
    } catch (error) {
      console.error('Error in getOrCreateConversation:', error);
      throw error;
    }
  }

  async addUserMessage(userId, content, mediaType = 'text', mediaUrl = null) {
    try {
      const conversation = await this.getOrCreateConversation(userId);
      await conversation.addMessage('user', content, mediaType, mediaUrl);
      return conversation;
    } catch (error) {
      console.error('Error in addUserMessage:', error);
      throw error;
    }
  }

  async addAssistantMessage(userId, content, mediaType = 'text', mediaUrl = null) {
    try {
      const conversation = await this.getOrCreateConversation(userId);
      await conversation.addMessage('assistant', content, mediaType, mediaUrl);
      return conversation;
    } catch (error) {
      console.error('Error in addAssistantMessage:', error);
      throw error;
    }
  }

  async getConversationContext(userId, messageLimit = 10) {
    try {
      const conversation = await this.getOrCreateConversation(userId);
      const recentMessages = conversation.getRecentMessages(messageLimit);
      
      // Format messages for OpenAI context
      const formattedMessages = recentMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        ...(msg.mediaType !== 'text' && {
          media: {
            type: msg.mediaType,
            url: msg.mediaUrl
          }
        })
      }));

      // Add system message at the start
      formattedMessages.unshift({
        role: "system",
        content: `Você é a Júlia, assistente digital do Grupo Souza Café, especializada em qualificação de leads e vendas de máquinas de café. Mantenha um tom profissional mas amigável, e use as informações do histórico da conversa para personalizar suas respostas.`
      });

      return {
        messages: formattedMessages,
        context: conversation.context.toObject()
      };
    } catch (error) {
      console.error('Error in getConversationContext:', error);
      throw error;
    }
  }

  async updateContext(userId, key, value) {
    try {
      const conversation = await this.getOrCreateConversation(userId);
      await conversation.updateContext(key, value);
      return conversation;
    } catch (error) {
      console.error('Error in updateContext:', error);
      throw error;
    }
  }

  async clearOldConversations(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await Conversation.deleteMany({
        lastInteraction: { $lt: cutoffDate }
      });

      console.log(`Cleared ${result.deletedCount} old conversations`);
      return result;
    } catch (error) {
      console.error('Error in clearOldConversations:', error);
      throw error;
    }
  }

  async getConversationSummary(userId) {
    try {
      const conversation = await this.getOrCreateConversation(userId);
      const context = conversation.context.toObject();
      const lastMessage = conversation.messages[conversation.messages.length - 1];

      return {
        userId,
        messageCount: conversation.messages.length,
        lastInteraction: conversation.lastInteraction,
        lastMessage: lastMessage ? {
          role: lastMessage.role,
          content: lastMessage.content,
          timestamp: lastMessage.timestamp
        } : null,
        context
      };
    } catch (error) {
      console.error('Error in getConversationSummary:', error);
      throw error;
    }
  }
}

module.exports = new ConversationService();
