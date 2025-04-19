// routes/api/goals.js
const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const Goal = require('../../models/goal');
const Product = require('../../models/product');

// @route    GET api/goals
// @desc     Get all goals for logged in user
// @access   Private
router.get('/', auth, async (req, res) => {
  try {
    // If isProductSpecific query param is provided, filter by it
    const filter = { user: req.user.id };
    if (req.query.isProductSpecific !== undefined) {
      filter.isProductSpecific = req.query.isProductSpecific === 'true';
    }
    
    const goals = await Goal.find(filter).sort({ endDate: 1 });
    res.json(goals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/goals/product/:productId
// @desc     Get all goals for a specific product
// @access   Private
router.get('/product/:productId', auth, async (req, res) => {
  try {
    const goals = await Goal.find({ 
      user: req.user.id,
      product: req.params.productId,
      isProductSpecific: true
    }).sort({ endDate: 1 });
    
    res.json(goals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/goals/store
// @desc     Get all store-wide goals (non-product-specific)
// @access   Private
router.get('/store', auth, async (req, res) => {
  try {
    const goals = await Goal.find({ 
      user: req.user.id,
      isProductSpecific: false
    }).sort({ endDate: 1 });
    
    res.json(goals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/goals/status
// @desc     Get goals with current progress
// @access   Private
router.get('/status', auth, async (req, res) => {
  try {
    // Get all user goals
    const goals = await Goal.find({ user: req.user.id }).sort({ endDate: 1 });
    
    // Get revenue and sales data
    const products = await Product.find({ user: req.user.id });
    
    // Calculate store-wide totals
    const totalRevenue = products.reduce((sum, product) => sum + product.totalSales, 0);
    const totalUnitsSold = products.reduce((sum, product) => sum + product.unitsSold, 0);
    const totalCost = products.reduce((sum, product) => sum + (product.unitCost * product.unitsSold), 0);
    const totalFees = products.reduce((sum, product) => sum + ((product.fees || 0) * product.unitsSold), 0);
    const totalProfit = totalRevenue - totalCost - totalFees;
    const storeProftMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    // Calculate progress for each goal
    const goalsWithProgress = await Promise.all(goals.map(async (goal) => {
      const goalObj = goal.toObject();
      
      if (goal.isProductSpecific && goal.product) {
        // Find the specific product for this goal
        const product = products.find(p => p._id.toString() === goal.product.toString());
        
        if (product) {
          if (goal.type === 'revenue') {
            goalObj.currentAmount = product.totalSales || 0;
          } else if (goal.type === 'sales') {
            goalObj.currentAmount = product.unitsSold || 0;
          } else if (goal.type === 'profit') {
            const profit = (product.basePrice - product.unitCost - (product.fees || 0)) * product.unitsSold;
            goalObj.currentAmount = profit;
          } else if (goal.type === 'profit_margin') {
            if (product.basePrice > 0) {
              const margin = ((product.basePrice - product.unitCost - (product.fees || 0)) / product.basePrice * 100);
              goalObj.currentAmount = margin;
            } else {
              goalObj.currentAmount = 0;
            }
          }
        } else {
          // Product not found or deleted
          goalObj.currentAmount = 0;
        }
      } else {
        // Store-wide goal
        if (goal.type === 'revenue') {
          goalObj.currentAmount = totalRevenue;
        } else if (goal.type === 'sales') {
          goalObj.currentAmount = totalUnitsSold;
        } else if (goal.type === 'profit') {
          goalObj.currentAmount = totalProfit;
        } else if (goal.type === 'profit_margin') {
          goalObj.currentAmount = storeProftMargin;
        }
      }
      
      goalObj.progressPercentage = (goalObj.currentAmount / goal.targetAmount) * 100;
      
      // Cap percentage at 100
      goalObj.progressPercentage = Math.min(100, goalObj.progressPercentage);
      
      // Add status indicator
      if (goalObj.progressPercentage >= 100) {
        goalObj.status = 'completed';
      } else if (goalObj.progressPercentage >= 75) {
        goalObj.status = 'on-track';
      } else if (goalObj.progressPercentage >= 50) {
        goalObj.status = 'in-progress';
      } else {
        goalObj.status = 'at-risk';
      }
      
      return goalObj;
    }));
    
    res.json(goalsWithProgress);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    POST api/goals
// @desc     Create a goal
// @access   Private
router.post(
  '/',
  [
    auth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('type', 'Type must be valid').isIn(['revenue', 'sales', 'profit', 'profit_margin']),
      check('targetAmount', 'Target amount is required').isNumeric(),
      check('startDate', 'Start date is required').not().isEmpty(),
      check('endDate', 'End date is required').not().isEmpty()
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
        type, 
        targetAmount, 
        startDate, 
        endDate, 
        product, 
        isProductSpecific 
      } = req.body;
      
      // Create new goal
      const newGoal = new Goal({
        user: req.user.id,
        name,
        type,
        targetAmount,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        currentAmount: 0,
        product: product || null,
        isProductSpecific: isProductSpecific || false
      });
      
      const goal = await newGoal.save();
      res.json(goal);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    PUT api/goals/:id
// @desc     Update a goal
// @access   Private
router.put('/:id', auth, async (req, res) => {
  try {
    let goal = await Goal.findById(req.params.id);
    
    // Check if goal exists
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    // Check user owns the goal
    if (goal.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    const { 
      name, 
      type, 
      targetAmount, 
      startDate, 
      endDate, 
      product, 
      isProductSpecific 
    } = req.body;
    
    // Build goal object
    const goalFields = {};
    if (name) goalFields.name = name;
    if (type) goalFields.type = type;
    if (targetAmount !== undefined) goalFields.targetAmount = targetAmount;
    if (startDate) goalFields.startDate = new Date(startDate);
    if (endDate) goalFields.endDate = new Date(endDate);
    if (product !== undefined) goalFields.product = product || null;
    if (isProductSpecific !== undefined) goalFields.isProductSpecific = isProductSpecific;
    goalFields.updatedAt = Date.now();
    
    // Update goal
    goal = await Goal.findByIdAndUpdate(
      req.params.id,
      { $set: goalFields },
      { new: true }
    );
    
    res.json(goal);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

// @route    DELETE api/goals/:id
// @desc     Delete a goal
// @access   Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    
    // Check if goal exists
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    // Check user owns the goal
    if (goal.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    await Goal.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Goal removed', id: req.params.id });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/goals/:id/update-progress
// @desc     Update current amount and progress for a goal (manual override)
// @access   Private
router.put('/:id/update-progress', auth, async (req, res) => {
  try {
    let goal = await Goal.findById(req.params.id);
    
    // Check if goal exists
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    // Check user owns the goal
    if (goal.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    const { currentAmount } = req.body;
    
    if (currentAmount === undefined) {
      return res.status(400).json({ message: 'Current amount is required' });
    }
    
    // Update goal
    goal = await Goal.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          currentAmount,
          updatedAt: Date.now()
        } 
      },
      { new: true }
    );
    
    res.json(goal);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

// @route    GET api/goals/refresh-product-goals/:productId
// @desc     Refresh goals for a specific product with latest data
// @access   Private
router.get('/refresh-product-goals/:productId', auth, async (req, res) => {
  try {
    // Find the product
    const product = await Product.findOne({
      _id: req.params.productId,
      user: req.user.id
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Find all goals for this product
    const goals = await Goal.find({
      user: req.user.id,
      product: req.params.productId,
      isProductSpecific: true
    });
    
    if (!goals || goals.length === 0) {
      return res.json({ message: 'No goals found for this product' });
    }
    
    // Calculate the profit
    const profit = (product.basePrice - product.unitCost - (product.fees || 0)) * product.unitsSold;
    const profitMargin = product.basePrice > 0 
      ? ((product.basePrice - product.unitCost - (product.fees || 0)) / product.basePrice * 100)
      : 0;
    
    // Update each goal's current amount based on its type
    const updatedGoals = [];
    
    for (const goal of goals) {
      let currentAmount = 0;
      
      if (goal.type === 'revenue') {
        currentAmount = product.totalSales || 0;
      } else if (goal.type === 'sales') {
        currentAmount = product.unitsSold || 0;
      } else if (goal.type === 'profit') {
        currentAmount = profit;
      } else if (goal.type === 'profit_margin') {
        currentAmount = profitMargin;
      }
      
      // Update the goal in the database
      const updatedGoal = await Goal.findByIdAndUpdate(
        goal._id,
        { 
          $set: { 
            currentAmount,
            updatedAt: Date.now()
          } 
        },
        { new: true }
      );
      
      updatedGoals.push(updatedGoal);
    }
    
    res.json(updatedGoals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;