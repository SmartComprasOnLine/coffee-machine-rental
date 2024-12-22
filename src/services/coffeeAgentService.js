const natural = require('natural');
const Machine = require('../models/Machine');
const Product = require('../models/Product');
const openaiService = require('./openaiService');

class CoffeeAgentService {
  constructor() {
    this.persona = {
      name: 'Júlia',
      role: 'Assistente digital do Mateus do Grupo Souza Café',
      specialization: 'Qualificação de leads, captação de informações e geração de interesse em máquinas de café'
    };
  }

  async getAvailableMachines() {
    try {
      const machines = await Machine.find({
        availableForRent: true,
        stock: { $gt: 0 }
      }).lean();

      console.log('Available machines:', {
        count: machines.length,
        machines: machines.map(m => ({
          name: m.name,
          stock: m.stock,
          price: m.rentalPrice
        }))
      });

      return machines;
    } catch (error) {
      console.error('Error getting available machines:', error);
      throw error;
    }
  }

  async searchMachinesByKeywords(keywords) {
    try {
      const machines = await this.getAvailableMachines();
      const tokenizer = new natural.WordTokenizer();
      const stemmer = natural.PorterStemmer;

      const stemmedKeywords = keywords.map(keyword => stemmer.stem(keyword.toLowerCase()));
      const filteredMachines = machines.filter(machine => {
        const machineDescription = machine.description.toLowerCase();
        return stemmedKeywords.some(stemmedKeyword => machineDescription.includes(stemmedKeyword));
      });

      console.log('Machines found for keywords:', keywords, filteredMachines);
      return filteredMachines;
    } catch (error) {
      console.error('Error searching machines by keywords:', error);
      throw error;
    }
  }

  async getMachineRecommendation(requirements, context) {
    try {
      const machines = await this.getAvailableMachines();
      
      if (machines.length === 0) {
        return {
          message: '*Desculpe!* No momento estamos com todas as nossas máquinas alocadas. Posso anotar seu contato para avisá-lo assim que tivermos disponibilidade?'
        };
      }

      let filteredMachines = [...machines];
      
      if (requirements.maxPrice) {
        filteredMachines = filteredMachines.filter(m => m.rentalPrice <= requirements.maxPrice);
      }
      
      if (requirements.beverageTypes && requirements.beverageTypes.length > 0) {
        filteredMachines = filteredMachines.filter(m => 
          requirements.beverageTypes.every(type => 
            m.supportedProducts.toLowerCase().includes(type.toLowerCase())
          )
        );
      }

      if (filteredMachines.length === 0) {
        // If no machines match the filters, suggest available alternatives
        const suggestion = machines[0];
        return {
          message: `No momento não temos máquinas disponíveis com essas características específicas. Mas que tal conhecer nossa *${suggestion.name}*? ${suggestion.description}\n\n` +
                  `Ela oferece:\n` +
                  `• ${suggestion.supportedProducts}\n` +
                  `• Aluguel: R$ ${suggestion.rentalPrice}/mês\n` +
                  `• ${suggestion.paymentMethod}\n\n` +
                  `Posso te mostrar mais detalhes?`,
          mediaUrls: suggestion.image ? [suggestion.image] : []
        };
      }

      const recommendedMachine = filteredMachines[0];
      return {
        message: `A máquina *${recommendedMachine.name}* está disponível!\n` +
                 `Ela oferece as seguintes bebidas: ${recommendedMachine.supportedProducts}.\n` +
                 `Aluguel: R$ ${recommendedMachine.rentalPrice}/mês.\n` +
                 `Posso te ajudar com mais informações?`,
        mediaUrls: recommendedMachine.image ? [recommendedMachine.image] : []
      };
    } catch (error) {
      console.error('Error in getMachineRecommendation:', error);
      throw error;
    }
  }

  // Additional methods can be added here as needed
}

module.exports = new CoffeeAgentService();
