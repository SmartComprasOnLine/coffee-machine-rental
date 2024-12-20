const axios = require('axios');

class SpreadsheetService {
  constructor() {
    this.baseUrl = process.env.SPREADSHEET_API_URL;
    this.apiKey = process.env.SPREADSHEET_API_KEY;
  }

  async updateMachineInventory(machineId, quantity) {
    try {
      const url = `${this.baseUrl}/update`;
      const data = {
        sheet: 'MÁQUINAS ALUGAR',
        rowId: machineId,
        updates: {
          'ESTOQUE': quantity
        }
      };

      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      console.log('Machine inventory updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating machine inventory:', error.response?.data || error.message);
      throw error;
    }
  }

  async updateProductInventory(productId, quantity) {
    try {
      const url = `${this.baseUrl}/update`;
      const data = {
        sheet: 'PRODUTOS',
        rowId: productId,
        updates: {
          'ESTOQUE': quantity
        }
      };

      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      console.log('Product inventory updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating product inventory:', error.response?.data || error.message);
      throw error;
    }
  }

  async getMachineData(machineName) {
    try {
      const url = `${this.baseUrl}/query`;
      const data = {
        sheet: 'MÁQUINAS ALUGAR',
        query: {
          'MÁQUINA': machineName
        }
      };

      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting machine data:', error.response?.data || error.message);
      throw error;
    }
  }

  async getProductData(productName) {
    try {
      const url = `${this.baseUrl}/query`;
      const data = {
        sheet: 'PRODUTOS',
        query: {
          'NOME': productName
        }
      };

      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting product data:', error.response?.data || error.message);
      throw error;
    }
  }

  async getAvailableMachines() {
    try {
      const url = `${this.baseUrl}/query`;
      const data = {
        sheet: 'MÁQUINAS ALUGAR',
        query: {
          'DISPONÍVEL PARA ALUGUEL': 'SIM',
          'ESTOQUE': { $gt: 0 }
        }
      };

      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting available machines:', error.response?.data || error.message);
      throw error;
    }
  }

  async getAvailableProducts() {
    try {
      const url = `${this.baseUrl}/query`;
      const data = {
        sheet: 'PRODUTOS',
        query: {
          'DISPONÍVEL PARA VENDA': 'SIM',
          'ESTOQUE': { $gt: 0 }
        }
      };

      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting available products:', error.response?.data || error.message);
      throw error;
    }
  }

  async getCompatibleProducts(machineName) {
    try {
      const url = `${this.baseUrl}/query`;
      const data = {
        sheet: 'PRODUTOS',
        query: {
          'MAQUINAS COMPATIVEIS': { $regex: machineName },
          'DISPONÍVEL PARA VENDA': 'SIM',
          'ESTOQUE': { $gt: 0 }
        }
      };

      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting compatible products:', error.response?.data || error.message);
      throw error;
    }
  }

  async logRental(customerData, machineData) {
    try {
      const url = `${this.baseUrl}/append`;
      const data = {
        sheet: 'ALUGUÉIS',
        row: {
          'DATA': new Date().toISOString(),
          'CLIENTE': customerData.name,
          'CNPJ': customerData.cnpj,
          'MÁQUINA': machineData.name,
          'VALOR': machineData.rentalPrice,
          'STATUS': 'ATIVO'
        }
      };

      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      console.log('Rental logged successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error logging rental:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new SpreadsheetService();
