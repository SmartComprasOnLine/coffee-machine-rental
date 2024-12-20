const spreadsheetService = require('../services/spreadsheetService');

class SpreadsheetController {
    async handleWebhook(req, res) {
        try {
            const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

            console.log('\n=== WEBHOOK RECEBIDO ===');
            console.log('Data/Hora:', new Date().toLocaleString('pt-BR'));
            console.log('\nJSON Completo Recebido:');
            console.log(JSON.stringify(data, null, 2));
            console.log('\n======================\n');

            // Validate spreadsheet data
            try {
                spreadsheetService.validateSpreadsheetData(data);
            } catch (validationError) {
                console.error('Erro na validação dos dados:', validationError.message);
                return res.status(400).json({
                    error: 'Erro na validação',
                    details: validationError.message
                });
            }

            // Process the spreadsheet data
            const result = await spreadsheetService.processSpreadsheetData(data);

            return res.json({
                success: true,
                message: `Máquina ${result.machine.model} atualizada com sucesso`,
                machine: {
                    model: result.machine.model,
                    status: result.machine.status,
                    stock: result.machine.stock,
                    monthlyRent: result.machine.pricing.monthlyRent
                }
            });

        } catch (error) {
            console.error('Erro ao processar webhook da planilha:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: error.message
            });
        }
    }

    async getMachineUpdates(req, res) {
        try {
            const Machine = require('../models/Machine');
            const machines = await Machine.find({})
                .select('model status stock pricing.monthlyRent updatedAt')
                .sort('-updatedAt');

            if (machines.length === 0) {
                return res.json({
                    lastUpdate: null,
                    machines: []
                });
            }

            // Get the most recent update timestamp
            const lastUpdate = machines.reduce((latest, machine) => {
                return machine.updatedAt > latest ? machine.updatedAt : latest;
            }, machines[0].updatedAt);

            res.json({
                lastUpdate,
                machines: machines.map(m => ({
                    model: m.model,
                    status: m.status,
                    stock: m.stock,
                    monthlyRent: m.pricing.monthlyRent,
                    updatedAt: m.updatedAt
                }))
            });

        } catch (error) {
            console.error('Erro ao obter atualizações das máquinas:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: error.message
            });
        }
    }

    async getMachineDetails(req, res) {
        try {
            const Machine = require('../models/Machine');
            const machine = await Machine.findOne({ model: req.params.model });

            if (!machine) {
                return res.status(404).json({
                    error: 'Máquina não encontrada',
                    message: `Nenhuma máquina encontrada com o modelo ${req.params.model}`
                });
            }

            res.json({
                model: machine.model,
                status: machine.status,
                stock: machine.stock,
                features: machine.features,
                pricing: machine.pricing,
                specifications: machine.specifications,
                contract: machine.contract,
                whatsappDescription: machine.getWhatsAppDescription()
            });

        } catch (error) {
            console.error('Erro ao obter detalhes da máquina:', error);
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: error.message
            });
        }
    }
}

module.exports = new SpreadsheetController();
