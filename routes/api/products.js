// routes/api/products.js
const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const Product = require('../../models/product');

// @route    GET api/products
// @desc     Get all products for logged in user
// @access   Private
router.get('/', auth, async (req, res) => {
  try {
    const products = await Product.find({ user: req.user.id }).sort({ name: 1 });
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/products/:id
// @desc     Get product by ID
// @access   Private
router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    // Check if product exists
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check user owns the product
    if (product.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    res.json(product);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

// @route    POST api/products
// @desc     Create a product
// @access   Private
router.post(
  '/',
  [
    auth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('unitCost', 'Unit cost is required').isNumeric(),
      check('basePrice', 'Base price is required').isNumeric()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        name,
        unitCost,
        basePrice,
        fees,
        variant,
        unitsSold,
        supplier,
        sourcingStatus
      } = req.body;

      // Calculate initial sales and profit metrics
      const totalSales = basePrice * unitsSold || 0;
      const totalCost = unitCost * unitsSold || 0;
      const totalFees = fees * unitsSold || 0;
      const profit = totalSales - totalCost - totalFees;
      const profitMargin = totalSales > 0 ? (profit / totalSales) * 100 : 0;

      // Create salesHistory entry if units sold is provided
      const salesHistory = [];
      if (unitsSold > 0) {
        salesHistory.push({
          date: new Date(),
          unitsSold: unitsSold,
          revenue: totalSales,
          notes: 'Initial entry',
          transactionId: new Date().getTime().toString() // Store as string
        });
      }

      // Create new product
      const newProduct = new Product({
        user: req.user.id,
        name,
        unitCost,
        basePrice,
        fees: fees || 0,
        variant,
        unitsSold: unitsSold || 0,
        supplier,
        sourcingStatus: sourcingStatus || 'in progress',
        totalSales,
        profitMargin,
        salesHistory
      });

      const product = await newProduct.save();
      res.json(product);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    PUT api/products/:id
// @desc     Update a product
// @access   Private
router.put('/:id', auth, async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    
    // Check if product exists
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check user owns the product
    if (product.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    // Build product object with ALL fields from request body
    // This will include any suppliers array if present
    const productFields = { ...req.body };
    
    // Only calculate these if the relevant fields were provided
    if (productFields.basePrice && productFields.unitsSold) {
      const basePrice = parseFloat(productFields.basePrice);
      const unitsSold = parseInt(productFields.unitsSold);
      const unitCost = parseFloat(productFields.unitCost);
      const fees = parseFloat(productFields.fees || 0);
      
      // Calculate updated sales and profit metrics
      const totalSales = basePrice * unitsSold;
      const totalCost = unitCost * unitsSold;
      const totalFees = fees * unitsSold;
      const profit = totalSales - totalCost - totalFees;
      productFields.profitMargin = totalSales > 0 ? (profit / totalSales) * 100 : 0;
      productFields.totalSales = totalSales;
    }
    
    productFields.updatedAt = Date.now();
    
    // Update product
    product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: productFields },
      { new: true }
    );
    
    res.json(product);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(500).send('Server Error');
  }
});


// @route    DELETE api/products/:id
// @desc     Delete a product
// @access   Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    // Check if product exists
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check user owns the product
    if (product.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    await Product.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Product removed' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

// @route    POST api/products/:id/sales
// @desc     Add sales data for a product
// @access   Private
router.post('/:id/sales', [
  auth,
  [
    check('date', 'Date is required').not().isEmpty(),
    check('unitsSold', 'Units sold must be a number').isNumeric(),
    check('revenue', 'Revenue must be a number').isNumeric()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { date, unitsSold, revenue, notes, transactionId } = req.body;
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (product.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Format the date
    const saleDate = new Date(date);
    
    // Always add a new entry for each sale
    product.salesHistory.push({
      date: saleDate,
      unitsSold: parseInt(unitsSold),
      revenue: parseFloat(revenue),
      notes,
      transactionId: transactionId || new Date().getTime().toString() // Use provided ID or generate new one
    });
    
    // Recalculate totals from all sales history
    let totalUnits = 0;
    let totalRevenue = 0;
    
    product.salesHistory.forEach(sale => {
      totalUnits += sale.unitsSold;
      totalRevenue += sale.revenue;
    });
    
    product.unitsSold = totalUnits;
    product.totalSales = totalRevenue;
    
    // Calculate profit margin
    const totalCost = product.unitCost * totalUnits;
    const totalFees = product.fees * totalUnits;
    const profit = totalRevenue - totalCost - totalFees;
    
    // Store as a number, not a string
    product.profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    
    // Update the updatedAt timestamp
    product.updatedAt = Date.now();
    
    await product.save();
    
    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/products/:id/sales/:transactionId
// @desc     Update sales data for a product
// @access   Private
router.put('/:id/sales/:transactionId', [
  auth,
  [
    check('date', 'Date is required').not().isEmpty(),
    check('unitsSold', 'Units sold must be a number').isNumeric(),
    check('revenue', 'Revenue must be a number').isNumeric()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { date, unitsSold, revenue, notes } = req.body;
    const { id, transactionId } = req.params;
    
    console.log('Updating sales record:');
    console.log('Product ID:', id);
    console.log('Transaction ID/Object ID:', transactionId);
    console.log('Request body:', req.body);
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (product.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Try multiple ways to find the sales record
    let saleIndex = -1;
    
    // First try MongoDB _id field (most likely for existing records)
    saleIndex = product.salesHistory.findIndex(
      sale => sale._id && sale._id.toString() === transactionId
    );
    
    // If not found, try looking for transactionId field
    if (saleIndex === -1) {
      saleIndex = product.salesHistory.findIndex(
        sale => sale.transactionId && sale.transactionId.toString() === transactionId
      );
    }
    
    // If still not found, try numeric comparison
    if (saleIndex === -1 && !isNaN(Number(transactionId))) {
      saleIndex = product.salesHistory.findIndex(
        sale => sale.transactionId && Number(sale.transactionId) === Number(transactionId)
      );
    }
    
    console.log('Found sale at index:', saleIndex);
    
    if (saleIndex === -1) {
      return res.status(404).json({ message: 'Sales record not found' });
    }
    
    // Format the date
    const saleDate = new Date(date);
    
    // Preserve the original _id and transactionId
    const originalId = product.salesHistory[saleIndex]._id;
    const originalTransactionId = product.salesHistory[saleIndex].transactionId || 
                                  new Date().getTime().toString();
    
    // Log the original record
    console.log('Original sale record:', product.salesHistory[saleIndex]);
    
    // Update the sales record 
    // IMPORTANT: We're preserving both the _id and transactionId fields
    product.salesHistory[saleIndex] = {
      ...product.salesHistory[saleIndex].toObject(), // Keep existing properties
      _id: originalId, // Keep the MongoDB _id
      transactionId: originalTransactionId, // Keep or set transactionId
      date: saleDate,
      unitsSold: parseInt(unitsSold),
      revenue: parseFloat(revenue),
      notes: notes || ''
    };
    
    console.log('Updated sale record:', product.salesHistory[saleIndex]);
    
    // Mark as modified so Mongoose knows to update the nested array
    product.markModified('salesHistory');
    
    // Recalculate totals from all sales history
    let totalUnits = 0;
    let totalRevenue = 0;
    
    product.salesHistory.forEach(sale => {
      totalUnits += sale.unitsSold;
      totalRevenue += sale.revenue;
    });
    
    product.unitsSold = totalUnits;
    product.totalSales = totalRevenue;
    
    // Calculate profit margin
    const totalCost = product.unitCost * totalUnits;
    const totalFees = product.fees * totalUnits;
    const profit = totalRevenue - totalCost - totalFees;
    
    // Store as a number, not a string
    product.profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    
    // Update the updatedAt timestamp
    product.updatedAt = Date.now();
    
    await product.save();
    
    res.json(product);
  } catch (err) {
    console.error('Error updating sales:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route    DELETE api/products/:id/sales/:transactionId
// @desc     Delete sales data for a product
// @access   Private
router.delete('/:id/sales/:transactionId', auth, async (req, res) => {
  try {
    const { id, transactionId } = req.params;
    
    console.log('Deleting sales record:');
    console.log('Product ID:', id);
    console.log('Transaction ID/Object ID:', transactionId);
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (product.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Try multiple ways to find the sales record
    let saleIndex = -1;
    
    // First try MongoDB _id field (most likely for existing records)
    saleIndex = product.salesHistory.findIndex(
      sale => sale._id && sale._id.toString() === transactionId
    );
    
    // If not found, try looking for transactionId field
    if (saleIndex === -1) {
      saleIndex = product.salesHistory.findIndex(
        sale => sale.transactionId && sale.transactionId.toString() === transactionId
      );
    }
    
    // If still not found, try numeric comparison
    if (saleIndex === -1 && !isNaN(Number(transactionId))) {
      saleIndex = product.salesHistory.findIndex(
        sale => sale.transactionId && Number(sale.transactionId) === Number(transactionId)
      );
    }
    
    console.log('Found sale at index:', saleIndex);
    
    if (saleIndex === -1) {
      return res.status(404).json({ message: 'Sales record not found' });
    }
    
    // Remove the sales record
    product.salesHistory.splice(saleIndex, 1);
    
    // Mark as modified so Mongoose knows to update the nested array
    product.markModified('salesHistory');
    
    // Recalculate totals from all sales history
    let totalUnits = 0;
    let totalRevenue = 0;
    
    product.salesHistory.forEach(sale => {
      totalUnits += sale.unitsSold;
      totalRevenue += sale.revenue;
    });
    
    product.unitsSold = totalUnits;
    product.totalSales = totalRevenue;
    
    // Calculate profit margin
    const totalCost = product.unitCost * totalUnits;
    const totalFees = product.fees * totalUnits;
    const profit = totalRevenue - totalCost - totalFees;
    
    // Store as a number, not a string
    product.profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    
    // Update the updatedAt timestamp
    product.updatedAt = Date.now();
    
    await product.save();
    
    res.json(product);
  } catch (err) {
    console.error('Error deleting sales:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/products/:id/sales
// @desc     Get sales history for a product
// @access   Private
router.get('/:id/sales', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (product.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    // Sort sales history by date (newest first)
    const salesHistory = product.salesHistory.sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
    
    res.json(salesHistory);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

module.exports = router;