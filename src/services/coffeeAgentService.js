const { OpenAI } = require('openai');
require('dotenv').config();

class CoffeeAgentService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    async generateResponse(name, message, messageHistory = []) {
        try {
            console.log('Gerando resposta para:', {
                name,
                message,
                historyLength: messageHistory.length
            });

            // Extract context from previous interactions
            const contextInfo = this.extractContextInfo(messageHistory);
            
            // Check if it's the first message
            const isFirstMessage = messageHistory.length === 1;

            const systemPrompt = `
            <assistant>
                <persona>
                    <name>Júlia</name>
                    <role>Assistente digital do Mateus do Grupo Souza Café</role>
                    <specialization>Qualificação de leads, captação de informações e geração de interesse em máquinas de café</specialization>
                    <expertise>Especialista em vendas e negociação</expertise>
                </persona>
                <communication_style>
                    <tone>Adaptar ao cliente (formal ou informal)</tone>
                    <sales_techniques>Utilizar técnicas de persuasão para gerar conexão e valor</sales_techniques>
                    <first_name_reference>Sempre usar o primeiro nome do cliente após mencionado</first_name_reference>
                    <whatsapp_formatting>
                        <bold>*Texto em negrito*</bold>
                        <italic>_Texto em itálico_</italic>
                    </whatsapp_formatting>
                </communication_style>
                ${contextInfo ? `
                <context>
                    <customer>
                        <name>${name}</name>
                        <business_info>
                            <cep>${contextInfo.cep || 'Não informado'}</cep>
                            <business_type>${contextInfo.businessType || 'Não informado'}</business_type>
                            <status>${contextInfo.status || 'LEAD'}</status>
                        </business_info>
                        <preferences>
                            <interested_machines>${contextInfo.interestedMachines || 'Não informado'}</interested_machines>
                            <desired_beverages>${contextInfo.desiredBeverages || 'Não informado'}</desired_beverages>
                            <payment_method>${contextInfo.paymentMethod || 'UNDEFINED'}</payment_method>
                        </preferences>
                    </customer>
                </context>` : ''}
            </assistant>`;

            // Initial message template
            if (isFirstMessage) {
                return "*Oi, tudo bem?* Somos do Grupo Souza Café, e oferecemos máquinas de café ideais para empresas de todos os tamanhos. Para qual CEP você deseja receber uma cotação?";
            }

            // Handle CEP validation
            if (this.isCEPRequest(messageHistory)) {
                const cep = this.extractCEP(message);
                if (cep) {
                    return `Obrigada! Para melhor atendê-lo, poderia me dizer qual o tipo do seu negócio? (Ex: escritório, café, restaurante, indústria)`;
                } else {
                    return `Por favor, me informe um CEP válido para que eu possa verificar a disponibilidade de máquinas na sua região.`;
                }
            }

            const response = await this.openai.chat.completions.create({
                model: process.env.OPENAI_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    ...messageHistory,
                    { role: "user", content: message }
                ],
                temperature: 0.7
            });

            console.log('Resposta gerada:', {
                status: 'sucesso',
                content: response.choices[0].message.content
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('Erro ao gerar resposta:', error);
            throw error;
        }
    }

    extractContextInfo(messageHistory) {
        if (!messageHistory || messageHistory.length === 0) return null;

        const context = {
            cep: '',
            businessType: '',
            status: 'LEAD',
            interestedMachines: [],
            desiredBeverages: [],
            paymentMethod: 'UNDEFINED'
        };

        messageHistory.forEach(msg => {
            const content = msg.content.toLowerCase();
            
            // Extract CEP
            const cepMatch = content.match(/\d{5}-?\d{3}/);
            if (cepMatch) {
                context.cep = cepMatch[0];
            }

            // Extract business type
            if (content.includes('escritório') || content.includes('café') || 
                content.includes('restaurante') || content.includes('indústria')) {
                context.businessType = content;
            }

            // Extract machine interest
            const machines = ['onix', 'jade', 'rubi'];
            machines.forEach(machine => {
                if (content.includes(machine) && !context.interestedMachines.includes(machine)) {
                    context.interestedMachines.push(machine);
                }
            });

            // Extract payment preference
            if (content.includes('macpay') || content.includes('pix')) {
                context.paymentMethod = 'MACPAY';
            } else if (content.includes('moeda') || content.includes('ficha')) {
                context.paymentMethod = 'MANUAL';
            }
        });

        return context;
    }

    isCEPRequest(messageHistory) {
        if (messageHistory.length !== 1) return false;
        const lastMessage = messageHistory[0].content.toLowerCase();
        return lastMessage.includes('cep') || lastMessage.includes('cotação');
    }

    extractCEP(message) {
        const cepMatch = message.match(/\d{5}-?\d{3}/);
        return cepMatch ? cepMatch[0] : null;
    }
}

module.exports = new CoffeeAgentService();
