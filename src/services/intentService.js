class IntentService {
  analyzeIntent(message) {
    message = message.toLowerCase();
    
    // Price related intents
    if (this.containsAny(message, ['preço', 'valor', 'custo', 'quanto custa', 'quanto fica'])) {
      if (this.containsAny(message, ['produto', 'insumo', 'café', 'chocolate', 'cappuccino'])) {
        return 'PRODUCT_PRICE_INQUIRY';
      }
      if (this.containsAny(message, ['máquina', 'aluguel', 'locação'])) {
        return 'MACHINE_PRICE_INQUIRY';
      }
      return 'GENERAL_PRICE_INQUIRY';
    }

    // Machine related intents
    if (this.containsAny(message, ['máquina', 'equipamento'])) {
      if (this.containsAny(message, ['disponível', 'estoque'])) {
        return 'MACHINE_AVAILABILITY';
      }
      if (this.containsAny(message, ['funciona', 'como usar'])) {
        return 'MACHINE_OPERATION';
      }
      if (this.containsAny(message, ['suporta', 'faz', 'bebida', 'produto'])) {
        return 'MACHINE_CAPABILITIES';
      }
      return 'MACHINE_GENERAL_INQUIRY';
    }

    // Contract related intents
    if (this.containsAny(message, ['contrato', 'documentos', 'documentação', 'fechar', 'alugar'])) {
      if (this.containsAny(message, ['cancelar', 'cancelamento', 'multa'])) {
        return 'CONTRACT_CANCELLATION';
      }
      if (this.containsAny(message, ['documento', 'precisa', 'necessário'])) {
        return 'CONTRACT_DOCUMENTS';
      }
      if (this.containsAny(message, ['duração', 'tempo', 'prazo'])) {
        return 'CONTRACT_DURATION';
      }
      return 'CONTRACT_GENERAL_INQUIRY';
    }

    // Support related intents
    if (this.containsAny(message, ['suporte', 'assistência', 'técnico', 'manutenção', 'problema'])) {
      if (this.containsAny(message, ['demora', 'tempo', 'rápido'])) {
        return 'SUPPORT_RESPONSE_TIME';
      }
      if (this.containsAny(message, ['incluído', 'cobrado', 'extra'])) {
        return 'SUPPORT_COST';
      }
      return 'SUPPORT_GENERAL_INQUIRY';
    }

    // Payment related intents
    if (this.containsAny(message, ['pagamento', 'pagar', 'boleto', 'prazo'])) {
      if (this.containsAny(message, ['produto', 'insumo'])) {
        return 'PRODUCT_PAYMENT';
      }
      if (this.containsAny(message, ['aluguel', 'locação', 'máquina'])) {
        return 'RENTAL_PAYMENT';
      }
      return 'PAYMENT_GENERAL_INQUIRY';
    }

    // Product related intents
    if (this.containsAny(message, ['produto', 'insumo', 'café', 'chocolate', 'cappuccino'])) {
      if (this.containsAny(message, ['disponível', 'estoque'])) {
        return 'PRODUCT_AVAILABILITY';
      }
      if (this.containsAny(message, ['compatível', 'funciona'])) {
        return 'PRODUCT_COMPATIBILITY';
      }
      if (this.containsAny(message, ['rendimento', 'doses', 'quantidade'])) {
        return 'PRODUCT_YIELD';
      }
      return 'PRODUCT_GENERAL_INQUIRY';
    }

    // Closing intent
    if (this.containsAny(message, ['quero fechar', 'vamos fechar', 'podemos fechar', 'quero alugar'])) {
      return 'CLOSING_INTENT';
    }

    // Greeting intent
    if (this.containsAny(message, ['oi', 'olá', 'bom dia', 'boa tarde', 'boa noite'])) {
      return 'GREETING';
    }

    return 'UNKNOWN';
  }

  containsAny(text, keywords) {
    return keywords.some(keyword => text.includes(keyword));
  }

  getResponseTemplate(intent) {
    const templates = {
      GREETING: {
        message: '*Oi, tudo bem?* Somos do Grupo Souza Café, e oferecemos máquinas de café ideais para empresas de todos os tamanhos. Como posso te ajudar hoje?',
        requiresFollowUp: true
      },
      MACHINE_PRICE_INQUIRY: {
        message: 'Temos várias opções de máquinas com diferentes valores. Para te indicar a melhor opção, me conta um pouco sobre sua necessidade:\n\n• Quantas pessoas em média vão utilizar a máquina por dia?\n• Quais tipos de bebidas você gostaria de oferecer?\n• Qual sua expectativa de investimento mensal?',
        requiresFollowUp: true
      },
      CONTRACT_GENERAL_INQUIRY: {
        message: '*Sobre nosso contrato:*\n\n• Duração de 12 meses\n• Pagamento mensal por boleto\n• Suporte técnico incluso\n• Manutenção preventiva trimestral\n\nGostaria de conhecer mais detalhes ou iniciar o processo?',
        requiresFollowUp: true
      },
      SUPPORT_GENERAL_INQUIRY: {
        message: '*Nosso suporte técnico inclui:*\n\n• Atendimento em até 24 horas\n• Manutenção preventiva trimestral\n• Suporte remoto imediato\n• Troca de máquina se necessário\n\nTudo isso já está incluído no valor da locação! 😊',
        requiresFollowUp: false
      },
      UNKNOWN: {
        message: 'Desculpe, não entendi completamente sua pergunta. Pode me explicar melhor? Estou aqui para ajudar com informações sobre nossas máquinas, produtos, contratos e suporte.',
        requiresFollowUp: true
      }
    };

    return templates[intent] || templates.UNKNOWN;
  }
}

module.exports = new IntentService();
