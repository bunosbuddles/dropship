# Dropship Analytics Platform

A full-stack MERN (MongoDB, Express, React, Node.js) application for tracking and analyzing dropshipping business performance. Track product sales, manage suppliers, set goals, and visualize your business growth.

Hosted: https://dropship-frontend.onrender.com/ 
(may take a minute to load up since the site isn't active all the time)

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

## Usage Guide

### Adding Products

1. Click "Add New Product"
2. Fill in the product details including:
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


### Please provide feedback

<img width="1512" alt="image" src="https://github.com/user-attachments/assets/343c5cfb-79b7-4cee-a869-0bc2c144a170" />


