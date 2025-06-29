const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/user');
const Product = require('./models/product');

async function checkUserProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'sdfgsdfg@gmail.com' });
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    console.log(`User _id for sdfgsdfg@gmail.com: ${user._id}`);

    const products = await Product.find({ user: user._id });
    if (products.length === 0) {
      console.log('❌ No products found for this user ObjectId');
    } else {
      console.log(`✅ Found ${products.length} products for this user:`);
      products.forEach((p, i) => {
        console.log(`${i + 1}. Name: ${p.name}, _id: ${p._id}`);
      });
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

checkUserProducts(); 