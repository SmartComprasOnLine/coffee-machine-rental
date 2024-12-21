const openaiService = require('./openaiService');
const Machine = require('../models/Machine');
const Product = require('../models/Product');

class IntentService {
  constructor() {
    this.intents = {
      GREETING: 'Saudação inicial ou resposta a saudação',
      PERSONAL_QUESTION: 'Perguntas sobre a identidade ou características do assistente',
      CEP_INFO: 'Informação sobre CEP ou localização',
      MACHINE_PRICE_INQUIRY: 'Perguntas sobre preços, valores ou custos de máquinas',
      PRODUCT_INQUIRY: 'Perguntas sobre produtos, insumos ou bebidas',
      CONTRACT_INQUIRY: 'Perguntas sobre contratos, documentação ou requisitos',
      SUPPORT_INQUIRY: 'Perguntas sobre suporte técnico, manutenção ou problemas',
      PAYMENT_INQUIRY: 'Perguntas sobre pagamentos, formas de pagamento ou prazos',
      UNKNOWN: 'Intenção não identificada'
    };
  }

  async analyzeIntent(text, context = null) {
    try {
      // Get available machines and products from database
      const machines = await Machine.find({ availableForRent: true, stock: { $gt: 0 } });
      const products = await Product.find({ availableForSale: true, stock: { $gt: 0 } });

      const prompt = `
        Analise a seguinte mensagem e determine a intenção do usuário.
        Mensagem: "${text}"

        Contexto do negócio:
        Máquinas disponíveis:
        ${machines.map(m => `- ${m.name}: R$ ${m.rentalPrice}/mês - ${m.description}`).join('\n')}
        
        Produtos disponíveis:
        ${products.map(p => `- ${p.name}: R$ ${p.price} - ${p.description}`).join('\n')}

        Possíveis intenções:
        ${Object.entries(this.intents).map(([intent, desc]) => `- ${intent}: ${desc}`).join('\n')}

        Responda apenas com o código da intenção (ex: GREETING, PERSONAL_QUESTION, etc).
        Se houver dúvida, use UNKNOWN.
        ${context ? 'Contexto da conversa:\n' + JSON.stringify(context.messages) : ''}
      `;

      const response = await openaiService.generateResponse(prompt, { messages: [] });
      const intent = response.trim().toUpperCase();

      console.log('Intent detection:', {
        text,
        detectedIntent: intent,
        hasContext: !!context,
        machinesCount: machines.length,
        productsCount: products.length
      });

      return this.intents[intent] ? intent : 'UNKNOWN';
    } catch (error) {
      console.error('Error detecting intent:', error);
      return 'UNKNOWN';
    }
  }

  async generateContextualResponse(intent, text, context) {
    try {
      // Get available machines and products from database
      const machines = await Machine.find({ availableForRent: true, stock: { $gt: 0 } });
      const products = await Product.find({ availableForSale: true, stock: { $gt: 0 } });

      const prompt = `
        Como Júlia, assistente digital do Grupo Souza Café, responda à seguinte mensagem:
        "${text}"

        Intenção detectada: ${intent}
        Descrição da intenção: ${this.intents[intent]}

        Informações atualizadas do banco de dados:
        Máquinas disponíveis:
        ${machines.map(m => `- ${m.name}: R$ ${m.rentalPrice}/mês
          • Descrição: ${m.description}
          • Produtos suportados: ${m.supportedProducts}
          • Forma de pagamento: ${m.paymentMethod}
          • Contrato: ${m.contractDuration}`).join('\n')}
        
        Produtos disponíveis:
        ${products.map(p => `- ${p.name}: R$ ${p.price}
          • Categoria: ${p.category}
          • Compatível com: ${p.compatibleMachines}
          • Descrição: ${p.description}`).join('\n')}

        Diretrizes:
        1. Use APENAS as informações atualizadas do banco de dados
        2. Mantenha um tom profissional mas amigável
        3. Seja clara e objetiva
        4. Foque em resolver a necessidade do cliente
        5. Use emojis com moderação
        6. Use formatação em negrito (*texto*) para destacar informações importantes
        7. Evite respostas genéricas
        8. Sempre mencione preços e condições reais do banco de dados

        ${context ? 'Contexto da conversa:\n' + JSON.stringify(context.messages) : ''}
      `;

      const response = await openaiService.generateResponse(prompt, { messages: [] });
      return { message: response };
    } catch (error) {
      console.error('Error generating contextual response:', error);
      return {
        message: 'Desculpe, estou com dificuldade para acessar algumas informações no momento. ' +
                'Você poderia reformular sua pergunta?'
      };
    }
  }
}

module.exports = new IntentService();
