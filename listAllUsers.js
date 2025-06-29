const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/user');

async function listAllUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const users = await User.find({}, 'email name _id');
    if (users.length === 0) {
      console.log('❌ No users found');
    } else {
      console.log(`✅ Found ${users.length} users:`);
      users.forEach((u, i) => {
        console.log(`${i + 1}. Email: ${u.email}, Name: ${u.name}, _id: ${u._id}`);
      });
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

listAllUsers(); 