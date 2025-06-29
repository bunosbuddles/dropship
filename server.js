require('dotenv').config(); // This must be at the very top
const express = require('express');
const connectDB = require('./config/db');
const path = require('path');
const cors = require('cors');

// Import models to register schemas
require('./models/user');
require('./models/product');
require('./models/contentIdea');
require('./models/goal');

const app = express();

// Connect Database first
connectDB();

// Improved CORS configuration with explicit preflight handling
const allowedOrigins = ['http://localhost:3000', 'https://dropship-frontend.onrender.com'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.onrender.com')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'x-auth-token'],
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

// Init Middleware
app.use(express.json({ extended: false }));

// Define Routes
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/users', require('./routes/api/users'));
app.use('/api/products', require('./routes/api/products'));
app.use('/api/goals', require('./routes/api/goals'));
app.use('/api/dashboard', require('./routes/api/dashboard'));
app.use('/api/content-ideas', require('./routes/api/contentIdeas'));
app.use('/api/feedback', require('./routes/api/feedback'));
app.use('/api/google-calendar', require('./routes/api/googleCalendar'));

// Impersonation middleware
const User = require('./models/user');
app.use(async (req, res, next) => {
  const impersonateId = req.header('x-impersonate-user-id');
  if (impersonateId && req.user) {
    try {
      const requestingUser = await User.findById(req.user.id);
      if (requestingUser && requestingUser.role === 'superuser') {
        req.impersonatedUserId = impersonateId;
      }
    } catch (err) {
      // Ignore and proceed as normal user
    }
  }
  next();
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));