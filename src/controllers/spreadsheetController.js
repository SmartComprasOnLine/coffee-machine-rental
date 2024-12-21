const Machine = require('../models/Machine');
const Product = require('../models/Product');

class SpreadsheetController {
  async handleWebhook(req, res) {
    try {
      const data = req.body;
      console.log('Received spreadsheet webhook data:', data);

      if (data.Planilha === 'MÁQUINAS ALUGAR') {
        await this.updateMachineData(data);
      }
      else if (data.Planilha === 'PRODUTOS') {
        await this.updateProductData(data);
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error in handleSpreadsheetWebhook:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  async updateMachineData(data) {
    try {
      console.log('Updating machine data:', {
        name: data.MÁQUINA,
        available: data['DISPONÍVEL PARA ALUGUEL'],
        stock: data.ESTOQUE
      });

      const machineData = {
        name: data.MÁQUINA,
        availableForRent: data['DISPONÍVEL PARA ALUGUEL'] === 'SIM',
        stock: parseInt(data.ESTOQUE) || 0,
        acceptsPixPayment: data['ACEITA PIX COM QR CODE PARA LIBERAR AS BEBIDAS'] === 'SIM',
        image: data['IMAGEM / FOTO'],
        supportedProducts: data['PRODUTOS SUPORTADOS'],
        videos: data.VIDEOS,
        photoGallery: data['CATALOGO DE FOTOS'],
        installationVideos: data['VIDEOS DE INSTALAÇÕES'],
        customerFeedbackVideo: data['VIDEO DE FEEDBACK DO CLIENTE'],
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
      };

      const result = await Machine.findOneAndUpdate(
        { name: data.MÁQUINA },
        machineData,
        { upsert: true, new: true }
      );

      console.log('Machine data updated:', {
        name: result.name,
        available: result.availableForRent,
        stock: result.stock
      });

      return result;
    } catch (error) {
      console.error('Error updating machine data:', error);
      throw error;
    }
  }

  async updateProductData(data) {
    try {
      console.log('Updating product data:', {
        name: data.NOME,
        available: data['DISPONÍVEL PARA VENDA'],
        stock: data.ESTOQUE
      });

      const productData = {
        name: data.NOME,
        price: parseFloat(data.PREÇO) || 0,
        compatibleMachines: data['MAQUINAS COMPATIVEIS'],
        dosage: {
          ml50: {
            grams: parseFloat(data['GRAMATURA 50ML']) || 0,
            doses: parseInt(data['DOSE 50 ML']) || 0,
            pricePerDose: parseFloat(data['PREÇO DOSE/50ML']) || 0
          },
          ml80: {
            grams: parseFloat(data['GRAMATURA 80ML']) || 0,
            doses: parseInt(data['DOSE 80ML']) || 0,
            pricePerDose: parseFloat(data['PREÇO DOSE/80ML']) || 0
          },
          ml120: {
            grams: parseFloat(data['GRAMATURA 120ML']) || 0,
            doses: parseInt(data['DOSE 120ML']) || 0,
            pricePerDose: parseFloat(data['PREÇO DOSE/ 120ML']) || 0
          }
        },
        description: data.DESCRIÇÃO,
        image: data.IMAGEM,
        availableForSale: data['DISPONÍVEL PARA VENDA'] === 'SIM',
        stock: parseInt(data.ESTOQUE) || 0,
        category: this.determineProductCategory(data.NOME)
      };

      const result = await Product.findOneAndUpdate(
        { name: data.NOME },
        productData,
        { upsert: true, new: true }
      );

      console.log('Product data updated:', {
        name: result.name,
        available: result.availableForSale,
        stock: result.stock
      });

      return result;
    } catch (error) {
      console.error('Error updating product data:', error);
      throw error;
    }
  }

  determineProductCategory(name) {
    name = name.toLowerCase();
    if (name.includes('café')) return 'COFFEE';
    if (name.includes('chocolate')) return 'CHOCOLATE';
    if (name.includes('cappuccino')) return 'CAPPUCCINO';
    if (name.includes('chá')) return 'TEA';
    if (name.includes('leite')) return 'MILK';
    return 'SUPPLIES';
  }

  async getMachineStats() {
    try {
      const stats = await Machine.aggregate([
        {
          $group: {
            _id: null,
            totalMachines: { $sum: 1 },
            availableMachines: {
              $sum: {
                $cond: [
                  { $and: [
                    { $eq: ["$availableForRent", true] },
                    { $gt: ["$stock", 0] }
                  ]},
                  1,
                  0
                ]
              }
            },
            totalStock: { $sum: "$stock" }
          }
        }
      ]);

      console.log('Machine statistics:', stats[0]);
      return stats[0];
    } catch (error) {
      console.error('Error getting machine stats:', error);
      throw error;
    }
  }

  async getProductStats() {
    try {
      const stats = await Product.aggregate([
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            availableProducts: {
              $sum: {
                $cond: [
                  { $and: [
                    { $eq: ["$availableForSale", true] },
                    { $gt: ["$stock", 0] }
                  ]},
                  1,
                  0
                ]
              }
            },
            totalStock: { $sum: "$stock" }
          }
        }
      ]);

      console.log('Product statistics:', stats[0]);
      return stats[0];
    } catch (error) {
      console.error('Error getting product stats:', error);
      throw error;
    }
  }
}

module.exports = new SpreadsheetController();
