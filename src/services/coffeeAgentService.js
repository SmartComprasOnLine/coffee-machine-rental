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
      const machines = await Machine.find({
        $or: keywords.map(keyword => ({
          $or: [
            { description: { $regex: keyword, $options: 'i' } },
            { supportedProducts: { $regex: keyword, $options: 'i' } },
            { name: { $regex: keyword, $options: 'i' } }
          ]
        }))
      }).lean();

      console.log('Machines found for keywords:', keywords, machines);
      return machines;
    } catch (error) {
      console.error('Error searching machines by keywords:', error);
      throw error;
    }
  }

  // ... (rest of the class remains unchanged)
}

module.exports = new CoffeeAgentService();
