const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const nodemailer = require('nodemailer'); // You'll need to npm install this

// @route    POST api/feedback
// @desc     Submit feedback
// @access   Private
router.post(
  '/',
  [
    auth,
    check('message', 'Message is required').not().isEmpty(),
    check('type', 'Feedback type is required').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, message, page, timestamp } = req.body;

    try {
      // OPTION 1: Save to a file (simpler, no DB model needed)
      const fs = require('fs');
      const path = require('path');
      
      const feedbackData = {
        userId: req.user.id,
        type,
        message,
        page,
        timestamp,
        userAgent: req.headers['user-agent']
      };
      
      const feedbackDir = path.join(__dirname, '../../feedback');
      // Create directory if it doesn't exist
      if (!fs.existsSync(feedbackDir)) {
        fs.mkdirSync(feedbackDir);
      }
      
      const feedbackFile = path.join(feedbackDir, `feedback-${Date.now()}.json`);
      fs.writeFileSync(feedbackFile, JSON.stringify(feedbackData, null, 2));
      
      // OPTION 2: Email notification (uncomment to use)
      /*
      // This assumes you have set up environment variables for email
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: 'your-email@example.com', // Where you want to receive feedback
        subject: `Dropship Beta Feedback: ${type}`,
        text: `
          Feedback Type: ${type}
          Message: ${message}
          Page: ${page}
          Timestamp: ${timestamp}
          User ID: ${req.user.id}
        `,
        html: `
          <h3>Dropship Beta Feedback</h3>
          <p><strong>Type:</strong> ${type}</p>
          <p><strong>Message:</strong> ${message}</p>
          <p><strong>Page:</strong> ${page}</p>
          <p><strong>Timestamp:</strong> ${timestamp}</p>
          <p><strong>User ID:</strong> ${req.user.id}</p>
        `
      });
      */
      
      res.json({ msg: 'Feedback submitted successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router; 