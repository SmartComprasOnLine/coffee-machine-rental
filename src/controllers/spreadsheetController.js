const Machine = require('../models/Machine');

class SpreadsheetController {
    async handleWebhook(req, res) {
        try {
            console.log('Received webhook data:', JSON.stringify(req.body, null, 2));

            const data = req.body;
            
            if (!data || !data.Planilha) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Invalid data format'
                });
            }

            // Handle different spreadsheet types
            switch (data.Planilha) {
                case 'MÁQUINAS ALUGAR':
                    await this.handleMachineData(data);
                    break;
                case 'MAQUINAS COMPRAR':
                    await this.handlePurchaseMachineData(data);
                    break;
                case 'PRODUTOS':
                    await this.handleProductData(data);
                    break;
                case 'COPOS ACUCAR E DESCALCIFICANTE':
                    await this.handleSuppliesData(data);
                    break;
                case 'ACESSÓRIOS':
                    await this.handleAccessoryData(data);
                    break;
                case 'Q&A':
                    await this.handleQAData(data);
                    break;
                default:
                    console.log(`Unknown spreadsheet type: ${data.Planilha}`);
            }

            return res.status(200).json({
                message: 'Data processed successfully',
                spreadsheet: data.Planilha
            });

        } catch (error) {
            console.error('Error processing webhook:', error);
            return res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }

    async handleMachineData(data) {
        try {
            const machine = await Machine.findOneAndUpdate(
                { name: data.MÁQUINA },
                {
                    name: data.MÁQUINA,
                    availableForRent: data['DISPONÍVEL PARA ALUGUEL'] === 'SIM',
                    stock: parseInt(data.ESTOQUE) || 0,
                    acceptsPix: data['ACEITA PIX COM QR CODE PARA LIBERAR AS BEBIDAS'] === 'SIM',
                    image: data['IMAGEM / FOTO'],
                    supportedProducts: data['PRODUTOS SUPORTADOS'],
                    videos: data.VIDEOS,
                    photosCatalog: data['CATALOGO DE FOTOS'],
                    installationVideos: data['VIDEOS DE INSTALAÇÕES'],
                    feedbackVideos: data['VIDEO DE FEEDBACK DO CLIENTE'],
                    rentalPrice: parseFloat(data.LOCAÇÃO) || 0,
                    paymentMethod: data['FORMA DE PAGAMENTO'],
                    rentalDiscount: parseFloat(data['DESCONTO LOCAÇÃO']) || 0,
                    description: data.DESCRICAO,
                    dimensions: {
                        height: data.ALTURA,
                        width: data.LARGURA,
                        depth: data.PROFUNDIDADE,
                        weight: data.PESO
                    },
                    unsupportedProducts: data['INSUMOS NÃO SUPORTADOS'],
                    contractDuration: data['CONTRATO FIDELIDADE'],
                    cancellationFee: data['MULTA CANCELAMENTO DE CONTRATO']
                },
                { upsert: true, new: true }
            );

            console.log('Machine data updated:', machine);
            return machine;

        } catch (error) {
            console.error('Error handling machine data:', error);
            throw error;
        }
    }

    // Implement other handlers as needed
    async handlePurchaseMachineData(data) {
        console.log('Processing purchase machine data:', data);
    }

    async handleProductData(data) {
        console.log('Processing product data:', data);
    }

    async handleSuppliesData(data) {
        console.log('Processing supplies data:', data);
    }

    async handleAccessoryData(data) {
        console.log('Processing accessory data:', data);
    }

    async handleQAData(data) {
        console.log('Processing Q&A data:', data);
    }
}

module.exports = new SpreadsheetController();
