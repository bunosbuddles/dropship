const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../../models/user');
const auth = require('../../middleware/auth');

// @route    POST api/users
// @desc     Register user
// @access   Public
router.post(
  '/',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 })
  ],
  async (req, res) => {
    console.log('Registration route accessed');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    console.log('Received registration data for:', email);

    try {
      // See if user exists
      console.log('Checking if user already exists');
      let user = await User.findOne({ email });

      if (user) {
        console.log('User already exists');
        return res
          .status(400)
          .json({ message: 'User already exists' });
      }

      console.log('Creating new user');
      user = new User({
        name,
        email,
        password
      });

      // Encrypt password
      console.log('Encrypting password');
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      console.log('Saving user to database');
      await user.save();
      console.log('User saved successfully');

      // Return jsonwebtoken
      const payload = {
        user: {
          id: user.id
        }
      };

      console.log('Generating JWT token');
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '5 days' },
        (err, token) => {
          if (err) {
            console.error('JWT Sign error:', err);
            throw err;
          }
          console.log('Registration successful, returning token');
          res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
        }
      );
    } catch (err) {
      console.error('Registration error:', err.message);
      console.error('Full error stack:', err.stack);
      res.status(500).send('Server error');
    }
  }
);

// @route    GET api/users/all
// @desc     Get all users (superuser only)
// @access   Private (superuser)
router.get('/all', auth, async (req, res) => {
  try {
    const requestingUser = await User.findById(req.user.id);
    if (!requestingUser || requestingUser.role !== 'superuser') {
      return res.status(403).json({ msg: 'Forbidden: Superuser access only' });
    }
    const users = await User.find({}, 'name email _id');
    res.json(users);
  } catch (err) {
    console.error('Error fetching all users:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;