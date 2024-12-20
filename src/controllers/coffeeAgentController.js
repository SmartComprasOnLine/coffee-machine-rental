const coffeeAgentService = require('../services/coffeeAgentService');
const evolutionApi = require('../services/evolutionApi');
const Customer = require('../models/Customer');
const Machine = require('../models/Machine');

class CoffeeAgentController {
    constructor() {
        this.pendingMessages = new Map();
        this.messageTimeouts = new Map();
    }

    async handleWebhook(req, res) {
        try {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

            if (!body.data || !body.data.message || !body.data.key) {
                console.error('Invalid webhook data:', body);
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const messageData = body.data;
            const number = messageData.key.remoteJid.replace('@s.whatsapp.net', '');
            
            let message;
            if (messageData.message.conversation) {
                message = messageData.message.conversation;
            } else if (messageData.message.extendedTextMessage) {
                message = messageData.message.extendedTextMessage.text;
            } else if (messageData.message.messageContextInfo && messageData.message.conversation) {
                message = messageData.message.conversation;
            } else {
                console.error('Unknown message format:', messageData.message);
                return res.status(400).json({ error: 'Unsupported message format' });
            }

            console.log('Extracted message:', message);

            const name = messageData.pushName || `Cliente ${number.slice(-4)}`;

            // Find or create customer
            let customer = await Customer.findOne({ whatsappNumber: number });
            if (!customer) {
                customer = await Customer.create({
                    name,
                    whatsappNumber: number,
                    businessInfo: {
                        status: 'LEAD'
                    }
                });
            }

            const customerId = customer._id.toString();

            // Add customer message to history
            await customer.addToMessageHistory('user', message);

            // Clear any existing timeout for this customer
            if (this.messageTimeouts.has(customerId)) {
                clearTimeout(this.messageTimeouts.get(customerId));
            }

            // Get or initialize pending messages for this customer
            const customerMessages = this.pendingMessages.get(customerId) || [];
            customerMessages.push(message);
            this.pendingMessages.set(customerId, customerMessages);

            // Set a new timeout
            const timeout = setTimeout(async () => {
                try {
                    const messages = this.pendingMessages.get(customerId) || [];
                    this.pendingMessages.delete(customerId);
                    this.messageTimeouts.delete(customerId);

                    await this.processMessages(messages.join('\n'), customer);
                } catch (error) {
                    console.error('Error processing messages:', error);
                    const errorMessage = 'Desculpe, tive um problema ao processar sua mensagem. Por favor, tente novamente em alguns instantes.';
                    await evolutionApi.sendText(customer.whatsappNumber, errorMessage);
                    await customer.addToMessageHistory('assistant', errorMessage);
                }
            }, 10000); // 10 seconds

            this.messageTimeouts.set(customerId, timeout);

            return res.json({ message: 'Message queued for processing' });
        } catch (error) {
            console.error('Error in webhook:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async processMessages(message, customer) {
        try {
            customer.lastInteraction = new Date();
            await customer.save();

            const messageHistory = customer.getMessageHistory();

            // Process CEP if it's the first interaction
            if (messageHistory.length === 1) {
                const cepMatch = message.match(/\d{5}-?\d{3}/);
                if (cepMatch) {
                    customer.businessInfo.cep = cepMatch[0];
                    await customer.save();
                }
            }

            // Process business type if CEP was provided
            if (customer.businessInfo.cep && !customer.businessInfo.businessType) {
                customer.businessInfo.businessType = this.extractBusinessType(message);
                if (customer.businessInfo.businessType) {
                    await customer.save();
                }
            }

            // Generate response using the coffee agent service
            const response = await coffeeAgentService.generateResponse(
                customer.name,
                message,
                messageHistory
            );

            // Send response
            await evolutionApi.sendText(customer.whatsappNumber, response);
            await customer.addToMessageHistory('assistant', response);

            // Update customer status based on interaction
            await this.updateCustomerStatus(customer, message);

        } catch (error) {
            console.error('Error processing messages:', error);
            const errorMessage = 'Desculpe, tive um problema ao processar sua mensagem. Por favor, tente novamente em alguns instantes.';
            await evolutionApi.sendText(customer.whatsappNumber, errorMessage);
            await customer.addToMessageHistory('assistant', errorMessage);
        }
    }

    extractBusinessType(message) {
        const businessTypes = {
            'escritório': 'ESCRITÓRIO',
            'café': 'CAFÉ',
            'restaurante': 'RESTAURANTE',
            'indústria': 'INDÚSTRIA',
            'industria': 'INDÚSTRIA',
            'hotel': 'HOTEL',
            'loja': 'LOJA',
            'consultório': 'CONSULTÓRIO',
            'consultorio': 'CONSULTÓRIO',
            'clínica': 'CLÍNICA',
            'clinica': 'CLÍNICA'
        };

        const messageLower = message.toLowerCase();
        for (const [key, value] of Object.entries(businessTypes)) {
            if (messageLower.includes(key)) {
                return value;
            }
        }

        return null;
    }

    async updateCustomerStatus(customer, message) {
        const messageLower = message.toLowerCase();

        // Update status based on message content and current status
        switch (customer.businessInfo.status) {
            case 'LEAD':
                if (customer.businessInfo.cep && customer.businessInfo.businessType) {
                    customer.businessInfo.status = 'QUALIFIED';
                }
                break;
            case 'QUALIFIED':
                if (messageLower.includes('preço') || messageLower.includes('valor') || 
                    messageLower.includes('orçamento') || messageLower.includes('orcamento')) {
                    customer.businessInfo.status = 'NEGOTIATING';
                }
                break;
            case 'NEGOTIATING':
                if (messageLower.includes('contrato') || messageLower.includes('fechar') || 
                    messageLower.includes('aceito') || messageLower.includes('acordo')) {
                    customer.businessInfo.status = 'CONTRACT_SENT';
                }
                break;
        }

        // Update machine preferences
        const machines = ['onix', 'jade', 'rubi'];
        machines.forEach(async (machine) => {
            if (messageLower.includes(machine)) {
                const machineDoc = await Machine.findOne({ 
                    model: { $regex: new RegExp(machine, 'i') }
                });
                if (machineDoc && !customer.preferences.interestedMachines.includes(machineDoc._id)) {
                    customer.preferences.interestedMachines.push(machineDoc._id);
                }
            }
        });

        // Update payment preferences
        if (messageLower.includes('macpay') || messageLower.includes('pix')) {
            customer.preferences.paymentMethod = 'MACPAY';
        } else if (messageLower.includes('moeda') || messageLower.includes('ficha')) {
            customer.preferences.paymentMethod = 'MANUAL';
        }

        await customer.save();
    }
}

module.exports = new CoffeeAgentController();
