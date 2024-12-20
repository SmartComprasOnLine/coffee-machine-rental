const openaiService = require('./openaiService');

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
      const prompt = `
        Analise a seguinte mensagem e determine a intenção do usuário.
        Mensagem: "${text}"

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
        hasContext: !!context
      });

      return this.intents[intent] ? intent : 'UNKNOWN';
    } catch (error) {
      console.error('Error detecting intent:', error);
      return 'UNKNOWN';
    }
  }

  getResponseTemplate(intent) {
    const templates = {
      'PERSONAL_QUESTION': {
        message: 'Olá! Eu sou a Júlia, assistente digital do Grupo Souza Café. Estou aqui para ajudar você com informações sobre nossas máquinas de café, produtos e serviços. Como posso te ajudar hoje?'
      },
      'CEP_INFO': {
        message: 'Ótimo! Vou verificar a disponibilidade de atendimento na sua região. Enquanto isso, me conte um pouco sobre o que você procura em uma máquina de café. Que tipo de bebidas você gostaria de oferecer?'
      },
      'UNKNOWN': {
        message: 'Desculpe, não entendi completamente. Posso ajudar você com informações sobre:\n\n' +
                '• Máquinas de café disponíveis\n' +
                '• Produtos e insumos\n' +
                '• Contratos e documentação\n' +
                '• Suporte técnico\n' +
                '• Formas de pagamento\n\n' +
                'Como posso te ajudar?'
      }
    };

    return templates[intent] || templates['UNKNOWN'];
  }

  async generateContextualResponse(intent, text, context) {
    try {
      const prompt = `
        Como Júlia, assistente digital do Grupo Souza Café, responda à seguinte mensagem:
        "${text}"

        Intenção detectada: ${intent}
        Descrição da intenção: ${this.intents[intent]}

        Diretrizes:
        1. Mantenha um tom profissional mas amigável
        2. Seja clara e objetiva
        3. Foque em resolver a necessidade do cliente
        4. Use emojis com moderação
        5. Evite respostas genéricas
        6. Use formatação em negrito (*texto*) para destacar informações importantes

        ${context ? 'Contexto da conversa:\n' + JSON.stringify(context.messages) : ''}
      `;

      const response = await openaiService.generateResponse(prompt, { messages: [] });
      return { message: response };
    } catch (error) {
      console.error('Error generating contextual response:', error);
      return this.getResponseTemplate(intent);
    }
  }
}

module.exports = new IntentService();
