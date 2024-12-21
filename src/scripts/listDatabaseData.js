const mongoose = require('mongoose');
const Machine = require('../models/Machine');
const Product = require('../models/Product');

async function listDatabaseData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/coffee-rental');
    console.log('Connected to MongoDB');

    console.log('\n=== MACHINES ===');
    const machines = await Machine.find({});
    console.log('Total machines:', machines.length);
    machines.forEach(machine => {
      console.log(`\nMachine: ${machine.name}`);
      console.log('- Available for rent:', machine.availableForRent ? 'YES' : 'NO');
      console.log('- Stock:', machine.stock);
      console.log('- Rental price:', `R$ ${machine.rentalPrice}`);
      console.log('- Supported products:', machine.supportedProducts);
      console.log('- Has image:', !!machine.image);
      console.log('- Has videos:', !!machine.videos);
    });

    console.log('\n=== PRODUCTS ===');
    const products = await Product.find({});
    console.log('Total products:', products.length);
    products.forEach(product => {
      console.log(`\nProduct: ${product.name}`);
      console.log('- Available for sale:', product.availableForSale ? 'YES' : 'NO');
      console.log('- Stock:', product.stock);
      console.log('- Price:', `R$ ${product.price}`);
      console.log('- Category:', product.category);
      console.log('- Compatible machines:', product.compatibleMachines);
      if (product.dosage?.ml80) {
        console.log('- Dosage (80ml):', {
          grams: product.dosage.ml80.grams,
          doses: product.dosage.ml80.doses,
          pricePerDose: `R$ ${product.dosage.ml80.pricePerDose}`
        });
      }
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listDatabaseData();
