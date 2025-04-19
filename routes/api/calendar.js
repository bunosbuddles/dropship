// routes/api/calendar.js
const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const CalendarEntry = require('../../models/calendarEntry');
// const Product = require('../../models/product');

// @route    GET api/calendar
// @desc     Get all calendar entries for logged in user
// @access   Private
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching all calendar entries for user:', req.user.id);
    const entries = await CalendarEntry.find({ user: req.user.id })
      .sort({ date: 1 })
      .populate('products', 'name variant');
    
    console.log('Found total entries:', entries.length);
    if (entries.length > 0) {
      console.log('Sample entry:', {
        id: entries[0]._id,
        date: entries[0].date,
        products: entries[0].products.length
      });
    }
    
    res.json(entries);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/calendar/date/:date
// @desc     Get calendar entries for a specific date
// @access   Private
router.get('/date/:date', auth, async (req, res) => {
  try {
    const dateString = req.params.date;
    console.log('Fetching calendar entries for date:', dateString);
    
    const entries = await CalendarEntry.find({
      user: req.user.id,
      date: dateString  // Direct string comparison
    }).populate('products', 'name variant');
    
    console.log('Found entries for date:', entries.length);
    
    res.json(entries);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/calendar/range/:start/:end
// @desc     Get calendar entries within a date range
// @access   Private
router.get('/range/:start/:end', auth, async (req, res) => {
  try {
    const startDateString = req.params.start;
    const endDateString = req.params.end;
    
    console.log('Fetching calendar entries in range:', startDateString, 'to', endDateString);
    
    // Get all entries for this user
    const allEntries = await CalendarEntry.find({
      user: req.user.id
    }).populate('products', 'name variant');
    
    console.log('Found total entries for user:', allEntries.length);
    
    // Filter entries that fall within the date range
    const entriesInRange = allEntries.filter(entry => {
      const isInRange = entry.date >= startDateString && entry.date <= endDateString;
      console.log(`Entry date: ${entry.date}, in range: ${isInRange}`);
      return isInRange;
    });
    
    console.log('Entries in range:', entriesInRange.length);
    
    res.json(entriesInRange);
  } catch (err) {
    console.error('Error in calendar range route:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route    POST api/calendar
// @desc     Create a calendar entry
// @access   Private
router.post('/', auth, async (req, res) => {
  try {
    console.log('Calendar POST route accessed');
    console.log('Request body:', JSON.stringify(req.body));
    console.log('User ID:', req.user.id);
    
    const { date, products = [], notes = '' } = req.body;
    
    console.log('Extracted data:', { date, products, notes });
    
    // Check for required fields
    if (!date) {
      console.error('Missing required field: date');
      return res.status(400).json({ message: 'Date is required' });
    }
    
    // Store date directly as a string - no Date object conversion
    const newEntry = new CalendarEntry({
      user: req.user.id,
      date: date,  // Store as string directly
      products: products || [],
      notes: notes || ''
    });
    
    console.log('New entry created, about to save');
    const entry = await newEntry.save();
    console.log('Entry saved successfully:', entry._id);
    
    res.json(entry);
  } catch (err) {
    console.error('ERROR in calendar POST route:', err);
    console.error('Error stack:', err.stack);
    res.status(500).send(`Server Error: ${err.message}`);
  }
});

// @route    PUT api/calendar/:id
// @desc     Update a calendar entry
// @access   Private
router.put('/:id', auth, async (req, res) => {
  try {
    console.log('PUT route accessed for ID:', req.params.id);
    console.log('Request body:', JSON.stringify(req.body));
    
    let entry = await CalendarEntry.findById(req.params.id);
    
    // Check if entry exists
    if (!entry) {
      console.log('Entry not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Calendar entry not found' });
    }
    
    // Check user owns the entry
    if (entry.user.toString() !== req.user.id) {
      console.log('User not authorized. Entry user:', entry.user.toString(), 'Request user:', req.user.id);
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    const { date, products, notes } = req.body;
    console.log('Extracted data:', { date, products: products?.length || 0, notes: notes?.length || 0 });
    
    // Build entry object - store date as string
    const entryFields = {};
    if (date) entryFields.date = date;  // Store as string directly
    if (notes !== undefined) entryFields.notes = notes;
    
    // Handle products with more robust error checking
    if (products && Array.isArray(products)) {
      try {
        console.log('Processing products array of length:', products.length);
        
        // Convert all product IDs to strings to ensure consistent format
        const formattedProductIds = products.map(id => {
          if (typeof id === 'object' && id._id) {
            console.log('Converting object to ID string:', id._id);
            return String(id._id);
          } 
          return String(id);
        });
        
        console.log('Formatted product IDs:', formattedProductIds);
        entryFields.products = formattedProductIds;
        
        // Skip product validation for now to simplify troubleshooting
        // We'll just trust the IDs sent from the frontend
      } catch (productErr) {
        console.error('Error processing products array:', productErr);
        // Continue with update instead of failing
      }
    }
    
    console.log('Entry fields to update:', entryFields);
    
    // Update entry with more error details
    try {
      entry = await CalendarEntry.findByIdAndUpdate(
        req.params.id,
        { $set: entryFields },
        { new: true }
      );
      
      const populatedEntry = await CalendarEntry.findById(entry._id)
        .populate('products', 'name variant');
      
      console.log('Update successful, returning populated entry');
      res.json(populatedEntry);
    } catch (updateErr) {
      console.error('Error during findByIdAndUpdate:', updateErr);
      return res.status(500).json({ 
        message: 'Database update error', 
        error: updateErr.message 
      });
    }
    
  } catch (err) {
    console.error('Outer error in PUT route:', err);
    console.error('Error stack:', err.stack);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Calendar entry not found - invalid ID format' });
    }
    
    res.status(500).json({ 
      message: 'Server Error',
      error: err.message
    });
  }
});

// @route    DELETE api/calendar/:id
// @desc     Delete a calendar entry
// @access   Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const entry = await CalendarEntry.findById(req.params.id);
    
    // Check if entry exists
    if (!entry) {
      return res.status(404).json({ message: 'Calendar entry not found' });
    }
    
    // Check user owns the entry
    if (entry.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    await CalendarEntry.findByIdAndDelete(entry._id);
    
    res.json({ message: 'Calendar entry removed' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Calendar entry not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

module.exports = router;