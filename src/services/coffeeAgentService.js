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

  async handleInitialEngagement(context) {
    const messages = context?.messages || [];
    const isFirstInteraction = messages.length <= 2; // System message + user message

    if (isFirstInteraction) {
      return {
        message: '*Oi, tudo bem?* Somos do Grupo Souza Café, e oferecemos máquinas de café ideais para empresas de todos os tamanhos. Para qual CEP você deseja receber uma cotação?',
        requiresCEP: true
      };
    }

    // If not first interaction, generate a contextual response
    const prompt = `
      Com base no histórico da conversa, gere uma resposta personalizada para retomar o atendimento.
      Mantenha um tom profissional mas amigável, e use informações do histórico para personalizar a resposta.
      Não repita informações já fornecidas anteriormente.
    `;

    const response = await openaiService.generateResponse(prompt, context);
    return { message: response };
  }

  async getMachineRecommendation(requirements, context) {
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
        const prompt = `
          O cliente procura uma máquina com os seguintes requisitos: ${JSON.stringify(requirements)}.
          Infelizmente não temos máquinas disponíveis com essas características específicas.
          Gere uma resposta educada sugerindo alternativas com base no histórico da conversa.
        `;
        const response = await openaiService.generateResponse(prompt, context);
        return { message: response };
      }

      const recommendedMachine = machines[0];
      const previousMessages = context?.messages || [];
      const hasSeenMachine = previousMessages.some(msg => 
        msg.content.includes(recommendedMachine.name)
      );

      if (hasSeenMachine) {
        const prompt = `
          O cliente já viu informações sobre a máquina ${recommendedMachine.name}.
          Gere uma resposta que destaque outros aspectos ou benefícios desta máquina
          que ainda não foram mencionados no histórico da conversa.
        `;
        const response = await openaiService.generateResponse(prompt, context);
        return {
          message: response,
          mediaUrls: [recommendedMachine.image]
        };
      }

      return this.formatMachineRecommendation(recommendedMachine);
    } catch (error) {
      console.error('Error in getMachineRecommendation:', error);
      throw error;
    }
  }

  async getProductsForMachine(machineName, context) {
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

      const previousMessages = context?.messages || [];
      const hasSeenProducts = previousMessages.some(msg => 
        msg.role === 'assistant' && msg.content.includes('Produtos compatíveis')
      );

      if (hasSeenProducts) {
        const prompt = `
          O cliente já viu a lista de produtos compatíveis com a máquina ${machineName}.
          Gere uma resposta que destaque outros aspectos dos produtos ou sugira
          combinações interessantes com base no histórico da conversa.
        `;
        const response = await openaiService.generateResponse(prompt, context);
        return { message: response };
      }

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
    const previousMessages = context?.messages || [];
    const hasSeenContractInfo = previousMessages.some(msg => 
      msg.role === 'assistant' && msg.content.includes('Contrato de Locação')
    );

    if (hasSeenContractInfo) {
      const prompt = `
        O cliente já viu as informações básicas do contrato.
        Gere uma resposta que esclareça outros aspectos do contrato ou
        foque em resolver dúvidas específicas mencionadas no histórico da conversa.
      `;
      const response = await openaiService.generateResponse(prompt, context);
      return { message: response };
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
