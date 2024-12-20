const Machine = require('../models/Machine');
const Product = require('../models/Product');

class CoffeeAgentService {
  constructor() {
    this.persona = {
      name: 'Júlia',
      role: 'Assistente digital do Mateus do Grupo Souza Café',
      specialization: 'Qualificação de leads, captação de informações e geração de interesse em máquinas de café'
    };
  }

  async handleInitialEngagement() {
    return {
      message: '*Oi, tudo bem?* Somos do Grupo Souza Café, e oferecemos máquinas de café ideais para empresas de todos os tamanhos. Para qual CEP você deseja receber uma cotação?',
      requiresCEP: true
    };
  }

  async getMachineRecommendation(requirements) {
    try {
      const query = { availableForRent: true, stock: { $gt: 0 } };
      
      if (requirements.maxPrice) {
        query.rentalPrice = { $lte: requirements.maxPrice };
      }
      
      if (requirements.beverageTypes) {
        query.supportedProducts = { 
          $regex: requirements.beverageTypes.join('|'), 
          $options: 'i' 
        };
      }

      const machines = await Machine.find(query).sort({ rentalPrice: 1 });
      
      if (!machines.length) {
        return {
          message: 'No momento não temos máquinas disponíveis com essas características específicas. Posso te apresentar outras opções?'
        };
      }

      const recommendedMachine = machines[0];
      return this.formatMachineRecommendation(recommendedMachine);
    } catch (error) {
      console.error('Error in getMachineRecommendation:', error);
      throw error;
    }
  }

  async getProductsForMachine(machineName) {
    try {
      const machine = await Machine.findOne({ name: machineName });
      if (!machine) {
        return {
          message: 'Desculpe, não encontrei informações sobre esta máquina.'
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
        (machine.image ? `${machine.image}\n\n` : '') +
        (machine.videos ? `Veja o vídeo da máquina: ${machine.videos}\n\n` : '') +
        `*Forma de pagamento:* ${machine.paymentMethod}\n` +
        `*Contrato:* ${machine.contractDuration}\n\n` +
        `Gostaria de ver mais detalhes ou agendar uma visita?`
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

  async handleContractInquiry() {
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
