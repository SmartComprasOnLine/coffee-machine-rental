const Machine = require('../models/Machine');
const Product = require('../models/Product');

class SpreadsheetController {
  async handleWebhook(req, res) {
    try {
      console.log('Received webhook data:', req.body);
      const data = this.parseYamlData(req.body.text);
      
      if (!data || !data.Planilha) {
        return res.status(400).json({ error: 'Invalid data format' });
      }

      switch (data.Planilha) {
        case 'MÁQUINAS ALUGAR':
          await this.updateMachineData(data);
          break;
        case 'PRODUTOS':
          await this.updateProductData(data);
          break;
        case 'MAQUINAS COMPRAR':
          // Handle purchase prices if needed
          break;
        default:
          console.log('Unknown spreadsheet type:', data.Planilha);
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error in handleWebhook:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  parseYamlData(text) {
    try {
      // Find JSON content between triple dashes
      const match = text.match(/---\n([\s\S]*?)\n---/);
      if (!match) return null;
      
      // Parse JSON content
      return JSON.parse(match[1]);
    } catch (error) {
      console.error('Error parsing YAML data:', error);
      return null;
    }
  }

  async updateMachineData(data) {
    try {
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

      await Machine.findOneAndUpdate(
        { name: data.MÁQUINA },
        machineData,
        { upsert: true, new: true }
      );

      console.log(`Updated/created machine: ${data.MÁQUINA}`);
    } catch (error) {
      console.error('Error updating machine data:', error);
      throw error;
    }
  }

  async updateProductData(data) {
    try {
      if (!data.NOME) return; // Skip empty rows

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
          },
          ml150: {
            grams: parseFloat(data['GRAMATURA 150ML']) || 0,
            doses: parseInt(data['DOSE 150ML']) || 0,
            pricePerDose: parseFloat(data['PREÇO DOSE/ 150ML']) || 0
          },
          ml180: {
            grams: parseFloat(data['GRAMATURA 180ML']) || 0,
            doses: parseInt(data['DOSE 180ML']) || 0,
            pricePerDose: parseFloat(data['PREÇO DOSE/ 180ML']) || 0
          },
          ml200: {
            grams: parseFloat(data['GRAMATURA 200ML']) || 0,
            doses: parseInt(data['DOSE 200ML']) || 0,
            pricePerDose: parseFloat(data['PREÇO DOSE/ 200ML']) || 0
          }
        },
        description: data.DESCRIÇÃO,
        image: data.IMAGEM,
        availableForSale: data['DISPONÍVEL PARA VENDA'] === 'SIM',
        stock: parseInt(data.ESTOQUE) || 0,
        category: this.determineProductCategory(data.NOME)
      };

      await Product.findOneAndUpdate(
        { name: data.NOME },
        productData,
        { upsert: true, new: true }
      );

      console.log(`Updated/created product: ${data.NOME}`);
    } catch (error) {
      console.error('Error updating product data:', error);
      throw error;
    }
  }

  determineProductCategory(name) {
    if (!name) return 'SUPPLIES';
    
    name = name.toLowerCase();
    if (name.includes('café')) return 'COFFEE';
    if (name.includes('chocolate')) return 'CHOCOLATE';
    if (name.includes('cappuccino')) return 'CAPPUCCINO';
    if (name.includes('chá')) return 'TEA';
    if (name.includes('leite')) return 'MILK';
    return 'SUPPLIES';
  }
}

module.exports = new SpreadsheetController();
