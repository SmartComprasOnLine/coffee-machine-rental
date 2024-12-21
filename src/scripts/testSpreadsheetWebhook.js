const axios = require('axios');

const testMachineData = {
  "Planilha": "MÁQUINAS ALUGAR",
  "MÁQUINA": "Rubi+",
  "DISPONÍVEL PARA ALUGUEL": "SIM",
  "ESTOQUE": "5",
  "ACEITA PIX COM QR CODE PARA LIBERAR AS BEBIDAS": "SIM",
  "IMAGEM / FOTO": "https://example.com/rubi-plus.jpg",
  "PRODUTOS SUPORTADOS": "Café, Cappuccino, Chocolate, Chá",
  "VIDEOS": "https://example.com/rubi-plus-video.mp4",
  "CATALOGO DE FOTOS": "https://example.com/rubi-plus-gallery",
  "VIDEOS DE INSTALAÇÕES": "https://example.com/rubi-plus-install.mp4",
  "VIDEO DE FEEDBACK DO CLIENTE": "https://example.com/rubi-plus-feedback.mp4",
  "LOCAÇÃO": "599.90",
  "FORMA DE PAGAMENTO": "Boleto mensal",
  "DESCONTO LOCAÇÃO": "0",
  "DESCRICAO": "Máquina compacta e versátil, ideal para escritórios e pequenas empresas",
  "ALTURA": "60cm",
  "LARGURA": "30cm",
  "PROFUNDIDADE": "45cm",
  "PESO": "15kg",
  "INSUMOS NÃO SUPORTADOS": "Nenhum",
  "CONTRATO FIDELIDADE": "12 meses",
  "MULTA CANCELAMENTO DE CONTRATO": "3x valor do aluguel"
};

const testProductData = {
  "Planilha": "PRODUTOS",
  "NOME": "Café Premium",
  "PREÇO": "89.90",
  "MAQUINAS COMPATIVEIS": "Rubi+, Onix+, Jade+",
  "GRAMATURA 50ML": "7",
  "DOSE 50 ML": "100",
  "PREÇO DOSE/50ML": "0.89",
  "GRAMATURA 80ML": "10",
  "DOSE 80ML": "70",
  "PREÇO DOSE/80ML": "1.28",
  "GRAMATURA 120ML": "14",
  "DOSE 120ML": "50",
  "PREÇO DOSE/ 120ML": "1.79",
  "DESCRIÇÃO": "Café premium 100% arábica",
  "IMAGEM": "https://example.com/cafe-premium.jpg",
  "DISPONÍVEL PARA VENDA": "SIM",
  "ESTOQUE": "50"
};

async function testSpreadsheetWebhook() {
  try {
    console.log('Testing machine data webhook...');
    const machineResponse = await axios.post(
      'http://app:3000/api/webhook/spreadsheet',
      testMachineData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Machine data webhook response:', machineResponse.data);

    console.log('\nTesting product data webhook...');
    const productResponse = await axios.post(
      'http://app:3000/api/webhook/spreadsheet',
      testProductData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Product data webhook response:', productResponse.data);

    console.log('\nChecking database content...');
    const mongoose = require('mongoose');
    const Machine = require('../models/Machine');
    const Product = require('../models/Product');

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/coffee-rental');

    const machines = await Machine.find({});
    console.log('\nMachines in database:', JSON.stringify(machines, null, 2));

    const products = await Product.find({});
    console.log('\nProducts in database:', JSON.stringify(products, null, 2));

    await mongoose.connection.close();

  } catch (error) {
    console.error('Error:', error.response?.data || error);
    if (error.response) {
      console.error('\nResponse error details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    if (error.config) {
      console.error('\nRequest details:', {
        url: error.config.url,
        method: error.config.method,
        headers: error.config.headers,
        data: error.config.data
      });
    }
  }
}

testSpreadsheetWebhook();
