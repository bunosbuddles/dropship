const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');

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
      // OPTION 1: Save to a file (still keeping this for backup)
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
      
      // OPTION 2: Email notification (enabled)
      // Setup email transport - for Gmail, Outlook, or other services
      let transporter;
      
      if (process.env.EMAIL_SERVICE === 'gmail') {
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
      } else {
        // Generic SMTP configuration
        transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT,
          secure: process.env.EMAIL_SECURE === 'true',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
      }
      
      // Format the date for better readability
      const formattedDate = new Date(timestamp).toLocaleString();
      
      // Prepare email content
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_RECIPIENT || process.env.EMAIL_USER, // Default to sender if no recipient specified
        subject: `Dropship Beta Feedback: ${type}`,
        text: `
          Feedback Type: ${type}
          Message: ${message}
          Page: ${page}
          Timestamp: ${formattedDate}
          User ID: ${req.user.id}
          User Agent: ${req.headers['user-agent']}
        `,
        html: `
          <h2>Dropship Beta Feedback</h2>
          <p><strong>Type:</strong> ${type}</p>
          <p><strong>Message:</strong> ${message}</p>
          <p><strong>Page:</strong> ${page}</p>
          <p><strong>Timestamp:</strong> ${formattedDate}</p>
          <p><strong>User ID:</strong> ${req.user.id}</p>
          <p><strong>User Agent:</strong> ${req.headers['user-agent']}</p>
        `
      };
      
      // Only try to send email if we have the required environment variables
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
          await transporter.sendMail(mailOptions);
          console.log('Feedback email sent successfully');
        } catch (emailError) {
          console.error('Error sending feedback email:', emailError);
          // Don't fail the request if email fails, we still have the file backup
        }
      } else {
        console.log('Email credentials not configured, skipping email notification');
      }
      
      res.json({ msg: 'Feedback submitted successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router; 