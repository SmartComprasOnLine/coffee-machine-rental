class SpreadsheetService {
    async processSpreadsheetData(data) {
        try {
            const Machine = require('../models/Machine');
            
            console.log('=== INÍCIO DA ATUALIZAÇÃO DA PLANILHA ===');
            console.log(`Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
            console.log(`Máquina: ${data['MÁQUINA']}`);
            console.log('Dados recebidos:', JSON.stringify(data, null, 2));

            const machineData = {
                model: data['MÁQUINA'],
                status: data['DISPONÍVEL PARA ALUGUEL']?.toLowerCase() === 'sim' ? 
                    'DISPONÍVEL PARA ALUGUEL' : 'INDISPONÍVEL',
                stock: parseInt(data['ESTOQUE']) || 0,
                features: {
                    macpayCompatible: data['ACEITA PIX COM QR CODE PARA LIBERAR AS BEBIDAS']?.toLowerCase() === 'sim',
                    image: data['IMAGEM / FOTO'],
                    supportedProducts: data['PRODUTOS SUPORTADOS'],
                    videos: data['VIDEOS'],
                    photosCatalog: data['CATALOGO DE FOTOS'],
                    installationVideos: data['VIDEOS DE INSTALAÇÕES'],
                    clientFeedbackVideo: data['VIDEO DE FEEDBACK DO CLIENTE']
                },
                pricing: {
                    monthlyRent: parseFloat(data['LOCAÇÃO']) || 0,
                    paymentMethod: data['FORMA DE PAGAMENTO'],
                    rentDiscount: parseFloat(data['DESCONTO LOCAÇÃO']) || 0
                },
                specifications: {
                    description: data['DESCRICAO'],
                    dimensions: {
                        height: data['ALTURA']?.replace(/[^0-9]/g, '') || '0',
                        width: data['LARGURA']?.replace(/[^0-9]/g, '') || '0',
                        depth: data['PROFUNDIDADE']?.replace(/[^0-9]/g, '') || '0',
                        weight: data['PESO']?.replace(/[^0-9,.]/g, '') || '0'
                    },
                    unsupportedProducts: data['INSUMOS NÃO SUPORTADOS']
                },
                contract: {
                    loyaltyPeriod: data['CONTRATO FIDELIDADE'],
                    cancellationFee: data['MULTA CANCELAMENTO DE CONTRATO']
                }
            };

            console.log('\nDados processados:');
            console.log('- Status:', machineData.status);
            console.log('- Estoque:', machineData.stock);
            console.log('- Preço:', machineData.pricing.monthlyRent);
            console.log('- Aceita MACPAY:', machineData.features.macpayCompatible);

            // Update or create machine
            const previousData = await Machine.findOne({ model: machineData.model });
            const result = await Machine.findOneAndUpdate(
                { model: machineData.model },
                machineData,
                { upsert: true, new: true }
            );

            console.log('\nAtualização no banco de dados:');
            if (previousData) {
                console.log('Alterações detectadas:');
                Object.keys(machineData).forEach(key => {
                    const oldValue = previousData[key];
                    const newValue = result[key];
                    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                        console.log(`- ${key}:`);
                        console.log(`  Anterior: ${JSON.stringify(oldValue)}`);
                        console.log(`  Novo: ${JSON.stringify(newValue)}`);
                    }
                });
            } else {
                console.log('Nova máquina cadastrada');
            }

            console.log('\n=== FIM DA ATUALIZAÇÃO ===\n');
            
            return {
                success: true,
                machine: result
            };
        } catch (error) {
            console.error('Erro ao processar dados da planilha:', error);
            throw error;
        }
    }

    validateSpreadsheetData(data) {
        console.log('Validando dados da planilha...');
        
        if (!data['Planilha'] || data['Planilha'] !== 'MÁQUINAS ALUGAR') {
            throw new Error('Planilha inválida. Deve ser "MÁQUINAS ALUGAR"');
        }

        const requiredFields = [
            'MÁQUINA',
            'DISPONÍVEL PARA ALUGUEL',
            'ESTOQUE',
            'LOCAÇÃO'
        ];

        const errors = [];

        // Check required fields
        requiredFields.forEach(field => {
            if (!data[field] && data[field] !== 0) {
                errors.push(`Campo obrigatório ausente: '${field}'`);
            }
        });

        // Validate numeric fields
        if (data['ESTOQUE'] && isNaN(parseInt(data['ESTOQUE']))) {
            errors.push('Estoque deve ser um número');
        }

        if (data['LOCAÇÃO'] && isNaN(parseFloat(data['LOCAÇÃO']))) {
            errors.push('Valor da locação deve ser um número');
        }

        // Validate URLs
        const urlFields = ['IMAGEM / FOTO', 'VIDEOS', 'CATALOGO DE FOTOS'];
        urlFields.forEach(field => {
            if (data[field] && !this.isValidUrl(data[field])) {
                errors.push(`URL inválida no campo '${field}'`);
            }
        });

        if (errors.length > 0) {
            console.error('Erros de validação encontrados:', errors);
            throw new Error('Erros de validação:\n' + errors.join('\n'));
        }

        console.log('Validação concluída com sucesso');
        return true;
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
}

module.exports = new SpreadsheetService();
