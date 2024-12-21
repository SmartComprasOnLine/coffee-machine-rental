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

  async handleInitialEngagement(context) {
    const machines = await this.getAvailableMachines();
    
    if (machines.length === 0) {
      return {
        message: '*Oi, tudo bem?* No momento estamos com todas as nossas máquinas alocadas. Posso anotar seu contato para avisá-lo assim que tivermos disponibilidade?'
      };
    }

    return {
      message: '*Oi, tudo bem?* Somos do Grupo Souza Café, e oferecemos máquinas de café ideais para empresas de todos os tamanhos. Para qual CEP você deseja receber uma cotação?',
      requiresCEP: true
    };
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
      return this.formatMachineRecommendation(recommendedMachine);
    } catch (error) {
      console.error('Error in getMachineRecommendation:', error);
      throw error;
    }
  }

  async getProductsForMachine(machineName, context) {
    try {
      const machine = await Machine.findOne({
        name: machineName,
        availableForRent: true,
        stock: { $gt: 0 }
      });

      if (!machine) {
        const availableMachines = await this.getAvailableMachines();
        if (availableMachines.length === 0) {
          return {
            message: 'Desculpe, no momento não temos máquinas disponíveis para aluguel.'
          };
        }

        return {
          message: `A máquina ${machineName} não está disponível no momento. Que tal conhecer nossa *${availableMachines[0].name}*? ${availableMachines[0].description}`
        };
      }

      const products = await Product.find({
        compatibleMachines: { $regex: machineName, $options: 'i' },
        availableForSale: true,
        stock: { $gt: 0 }
      });

      return this.formatProductRecommendation(machine, products);
    } catch (error) {
      console.error('Error in getProductsForMachine:', error);
      throw error;
    }
  }

  formatMachineRecommendation(machine) {
    return {
      message: `*${machine.name}* - R$ ${machine.rentalPrice}/mês\n\n` +
        `${machine.description}\n\n` +
        `*Dimensões:*\n` +
        `Altura: ${machine.dimensions.height}\n` +
        `Largura: ${machine.dimensions.width}\n` +
        `Profundidade: ${machine.dimensions.depth}\n` +
        `Peso: ${machine.dimensions.weight}\n\n` +
        `*Produtos suportados:*\n${machine.supportedProducts}\n\n` +
        `*Forma de pagamento:* ${machine.paymentMethod}\n` +
        `*Contrato:* ${machine.contractDuration}\n\n` +
        `Gostaria de ver mais detalhes ou agendar uma visita?`,
      mediaUrls: machine.image ? [machine.image] : []
    };
  }

  formatProductRecommendation(machine, products) {
    let message = `*Produtos compatíveis com ${machine.name}:*\n\n`;
    
    const categories = {
      COFFEE: 'Cafés',
      CHOCOLATE: 'Chocolates',
      CAPPUCCINO: 'Cappuccinos',
      TEA: 'Chás',
      MILK: 'Leites',
      SUPPLIES: 'Suprimentos'
    };

    for (const category in categories) {
      const categoryProducts = products.filter(p => p.category === category);
      if (categoryProducts.length) {
        message += `*${categories[category]}:*\n`;
        categoryProducts.forEach(product => {
          message += `• ${product.name} - R$ ${product.price.toFixed(2)}\n`;
          if (product.dosage?.ml80) {
            message += `  (Rende aproximadamente ${product.dosage.ml80.doses} doses)\n`;
          }
        });
        message += '\n';
      }
    }

    return { message };
  }

  async handleContractInquiry(context) {
    const machines = await this.getAvailableMachines();
    
    if (machines.length === 0) {
      return {
        message: 'No momento estamos com todas as nossas máquinas alocadas. Posso anotar seu contato para avisá-lo assim que tivermos disponibilidade?'
      };
    }

    return {
      message: '*Contrato de Locação:*\n\n' +
        '• Duração: 12 meses\n' +
        '• Pagamento: Mensal por boleto\n' +
        '• Multa por cancelamento: 3 meses do valor do aluguel\n' +
        '• Suporte técnico incluso\n' +
        '• Manutenção preventiva trimestral\n\n' +
        '*Documentos necessários:*\n' +
        '• Contrato Social\n' +
        '• CNPJ\n' +
        '• Cartão CNPJ\n' +
        '• RG ou CNH do sócio-proprietário\n' +
        '• Comprovante de endereço do estabelecimento\n\n' +
        'Posso te ajudar a iniciar o processo agora mesmo!'
    };
  }
}

module.exports = new CoffeeAgentService();
