class IntentService {
    async detectIntent(message, userContext) {
        const messageLower = message.toLowerCase();

        // Check if it's a first message or greeting
        if (!userContext.welcomeSent || this.isGreeting(messageLower)) {
            return 'initial_message';
        }

        // Check for CEP
        if (this.isCEPFormat(message)) {
            return 'provide_cep';
        }

        // Check for business type
        if (this.isBusinessType(messageLower)) {
            return 'provide_business_type';
        }

        // Check for machine interest
        if (this.containsMachineReference(messageLower)) {
            return 'machine_interest';
        }

        // Check for pricing questions
        if (this.isPricingQuestion(messageLower)) {
            return 'pricing_inquiry';
        }

        // Check for contract questions
        if (this.isContractQuestion(messageLower)) {
            return 'contract_inquiry';
        }

        // Default response for other messages
        return 'general_inquiry';
    }

    isGreeting(message) {
        const greetings = ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hi', 'hello'];
        return greetings.some(greeting => message.includes(greeting));
    }

    isCEPFormat(message) {
        return /\d{5}-?\d{3}/.test(message);
    }

    isBusinessType(message) {
        const businessTypes = [
            'escritório', 'escritorio',
            'café', 'cafe',
            'restaurante',
            'indústria', 'industria',
            'hotel',
            'loja',
            'consultório', 'consultorio',
            'clínica', 'clinica'
        ];
        return businessTypes.some(type => message.includes(type));
    }

    containsMachineReference(message) {
        const machines = ['rubi', 'onix', 'jade', 'máquina', 'maquina'];
        return machines.some(machine => message.includes(machine));
    }

    isPricingQuestion(message) {
        const pricingTerms = ['preço', 'preco', 'valor', 'custo', 'quanto', 'aluguel'];
        return pricingTerms.some(term => message.includes(term));
    }

    isContractQuestion(message) {
        const contractTerms = ['contrato', 'fidelidade', 'prazo', 'cancelamento', 'multa'];
        return contractTerms.some(term => message.includes(term));
    }

    async extractActivityInfo(message) {
        // This method would be used to extract specific information from messages
        // For now, we'll return a basic structure
        return {
            activityType: this.detectActivityType(message),
            details: message
        };
    }

    detectActivityType(message) {
        const messageLower = message.toLowerCase();
        
        if (this.isCEPFormat(message)) {
            return 'CEP_PROVIDED';
        }
        
        if (this.isBusinessType(messageLower)) {
            return 'BUSINESS_TYPE_PROVIDED';
        }
        
        if (this.containsMachineReference(messageLower)) {
            return 'MACHINE_INTEREST';
        }
        
        if (this.isPricingQuestion(messageLower)) {
            return 'PRICING_INQUIRY';
        }
        
        if (this.isContractQuestion(messageLower)) {
            return 'CONTRACT_INQUIRY';
        }
        
        return 'GENERAL_INQUIRY';
    }
}

module.exports = new IntentService();
