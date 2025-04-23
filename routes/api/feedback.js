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
    console.log('=== FEEDBACK POST ENDPOINT CALLED ===');
    console.log('Request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, message, page, timestamp } = req.body;
    console.log(`Feedback received - Type: ${type}, Page: ${page}`);

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
      
      // OPTION 2: Email notification with more detailed logging for Gmail
      console.log('Attempting to send email notification...');
      console.log(`Using email service: ${process.env.EMAIL_SERVICE || 'not specified'}`);
      console.log(`Email user: ${process.env.EMAIL_USER ? '✓ configured' : '✗ missing'}`);
      console.log(`Email password: ${process.env.EMAIL_PASS ? '✓ configured' : '✗ missing'}`);
      console.log(`Email recipient: ${process.env.EMAIL_RECIPIENT || process.env.EMAIL_USER || 'not specified'}`);
      
      // Gmail-specific setup (more reliable for Gmail)
      let transporter;
      
      if (process.env.EMAIL_USER && process.env.EMAIL_USER.includes('@gmail.com')) {
        console.log('Setting up Gmail-specific transporter');
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          },
          debug: true // Enable debug output
        });
      } else if (process.env.EMAIL_HOST) {
        console.log('Setting up custom SMTP transporter');
        transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT || '587'),
          secure: process.env.EMAIL_SECURE === 'true',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          },
          debug: true // Enable debug output
        });
      } else if (process.env.EMAIL_USER) {
        console.log('Using default SMTP settings for email provider');
        // Try to auto-detect service based on email domain
        const emailDomain = process.env.EMAIL_USER.split('@')[1];
        let service = null;
        
        if (emailDomain === 'gmail.com') service = 'gmail';
        else if (emailDomain === 'outlook.com' || emailDomain === 'hotmail.com') service = 'outlook';
        else if (emailDomain === 'yahoo.com') service = 'yahoo';
        
        transporter = nodemailer.createTransport({
          service: service,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          },
          debug: true // Enable debug output
        });
      }
      
      // Format the date for better readability
      const formattedDate = new Date(timestamp).toLocaleString();
      
      // Only try to send email if we have a transporter
      if (transporter && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
          console.log('Sending feedback email...');
          
          // Prepare email content
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_RECIPIENT || process.env.EMAIL_USER,
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
          
          const info = await transporter.sendMail(mailOptions);
          console.log('Feedback email sent successfully:', info.response);
          console.log('Message ID:', info.messageId);
        } catch (emailError) {
          console.error('Error sending feedback email:', emailError);
          // Log detailed error information
          if (emailError.code) console.error('Error code:', emailError.code);
          if (emailError.command) console.error('Failed command:', emailError.command);
          if (emailError.response) console.error('Server response:', emailError.response);
          if (emailError.responseCode) console.error('Response code:', emailError.responseCode);
          // Don't fail the request if email fails, we still have the file backup
        }
      } else {
        console.log('Email sending skipped: required configuration missing');
      }
      
      res.json({ msg: 'Feedback submitted successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    GET api/feedback/test-email
// @desc     Test email configuration
// @access   Private
router.get('/test-email', auth, async (req, res) => {
  console.log('=== EMAIL TEST ENDPOINT CALLED ===');
  console.log(`Email user: ${process.env.EMAIL_USER ? '✓ configured' : '✗ missing'}`);
  console.log(`Email password: ${process.env.EMAIL_PASS ? '✓ configured' : '✗ missing'}`);
  
  try {
    // Gmail-specific setup
    let transporter;
    
    if (process.env.EMAIL_USER && process.env.EMAIL_USER.includes('@gmail.com')) {
      console.log('Setting up Gmail-specific transporter');
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        debug: true
      });
    } else {
      console.log('Using default transporter');
      transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        debug: true
      });
    }
    
    if (!transporter) {
      return res.status(500).json({ error: 'Email transporter could not be created' });
    }
    
    const testMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_RECIPIENT || process.env.EMAIL_USER,
      subject: 'Dropship Feedback System - Test Email',
      text: 'This is a test email from your Dropship Feedback System.',
      html: '<h2>Test Email</h2><p>This is a test email from your Dropship Feedback System.</p>'
    };
    
    console.log('Sending test email to:', testMailOptions.to);
    
    const info = await transporter.sendMail(testMailOptions);
    console.log('Test email sent successfully:', info.response);
    console.log('Message ID:', info.messageId);
    
    return res.json({ 
      success: true, 
      message: 'Test email sent successfully',
      details: {
        messageId: info.messageId,
        response: info.response,
        emailSentTo: testMailOptions.to
      }
    });
  } catch (err) {
    console.error('Error sending test email:', err);
    if (err.code) console.error('Error code:', err.code);
    if (err.command) console.error('Failed command:', err.command);
    if (err.response) console.error('Server response:', err.response);
    if (err.responseCode) console.error('Response code:', err.responseCode);
    
    return res.status(500).json({ 
      error: 'Failed to send test email', 
      details: err.message,
      code: err.code || 'unknown'
    });
  }
});

module.exports = router;