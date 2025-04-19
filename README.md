# Dropship Analytics Platform

A full-stack MERN (MongoDB, Express, React, Node.js) application for tracking and analyzing dropshipping business performance. Track product sales, manage suppliers, set goals, and visualize your business growth.

## Features

- **User Authentication** - Secure login and registration system
- **Product Management** - Add, edit, and delete products
- **Sales Tracking** - Record and analyze sales data
- **Supplier Management** - Track multiple suppliers per product
- **Sales History** - View and analyze sales over time with charts
- **Performance Analytics** - Monitor revenue, profit margins, and growth

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14.x or later)
- [npm](https://www.npmjs.com/) (v6.x or later)
- [MongoDB](https://www.mongodb.com/) account or local installation

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/dropship.git
cd dropship
```

### 2. Environment Setup

Create a `.env` file in the root directory with the following variables:

```
NODE_ENV=development
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

> **Note:** Replace `your_mongodb_connection_string` with your actual MongoDB connection string and set a secure `JWT_SECRET` value.

### 3. Install Dependencies

Install server dependencies:
```bash
npm install
```

Install client dependencies:
```bash
cd client
npm install
cd ..
```

### 4. Start the Development Server

Run both the backend and frontend concurrently:
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:5001
- Frontend development server on http://localhost:3000

## Usage Guide

### User Registration and Login

1. Navigate to http://localhost:3000
2. Create a new account using the registration page
3. Log in with your credentials

### Adding Products

1. Navigate to the Products page
2. Click "Add New Product"
3. Fill in the product details including:
   - Product name
   - Base price
   - Unit cost
   - Additional fees
   - Supplier information

### Recording Sales

1. Navigate to a specific product page
2. Go to the "Sales History" tab
3. Use the form at the top to add a new sales record:
   - Date (defaults to today)
   - Units sold
   - Revenue (auto-calculated based on price × units, or enter custom amount)
   - Optional notes

### Viewing Analytics

1. Navigate to the Dashboard page to see overall business performance
2. Visit individual product pages to view:
   - Revenue over time charts
   - Sales history
   - Profit margins

## Folder Structure

```
dropship/
├── client/                 # React frontend
│   ├── public/             # Static files
│   └── src/                # React source code
│       ├── components/     # Reusable components
│       ├── pages/          # Page components
│       └── redux/          # Redux state management
├── config/                 # Backend configuration
├── middleware/             # Express middleware
├── models/                 # MongoDB schemas
├── routes/                 # API routes
└── server.js              # Express server entry point
```

## Tech Stack

### Backend
- Node.js & Express - Server framework
- MongoDB & Mongoose - Database and ORM
- JWT - Authentication
- bcrypt - Password hashing

### Frontend
- React - UI library
- Redux Toolkit - State management
- React Router - Navigation
- Tailwind CSS - Styling
- Recharts - Data visualization
- Axios - API communication

## Troubleshooting

### Port Conflicts
If you encounter a "port already in use" error:

```
lsof -i :5001  # Find process using port 5001
kill -9 <PID>  # Kill the process using that port
```

### Connection Issues
If you experience MongoDB connection issues:
1. Ensure your MongoDB connection string is correct in the `.env` file
2. Check that your IP address is whitelisted in MongoDB Atlas (if using Atlas)
3. Verify network connectivity

## License

This project is licensed under the MIT License - see the LICENSE file for details. 