const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const impersonation = require('../../middleware/impersonation');
const User = require('../../models/user');
const ContentIdea = require('../../models/contentIdea');
const { getAuthUrl, getTokens, getCalendarClient } = require('../../config/googleCalendar');
const Product = require('../../models/product');

// Helper to get the effective user ID (impersonated or real)
function getEffectiveUserId(req) {
  return req.impersonatedUserId || req.user.id;
}

// @route    GET api/google-calendar/auth
// @desc     Get Google OAuth URL
// @access   Private
router.get('/auth', auth, impersonation, (req, res) => {
  try {
    const authUrl = getAuthUrl(getEffectiveUserId(req));
    res.json({ authUrl });
  } catch (err) {
    console.error('Error generating auth URL:', err);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/google-calendar/callback
// @desc     Handle Google OAuth callback
// @access   Private
router.get('/callback', auth, impersonation, async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ message: 'Authorization code is required' });
    }

    // Get tokens from Google
    const tokens = await getTokens(code);
    
    // Save tokens to user
    const user = await User.findById(getEffectiveUserId(req));
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.googleCalendarTokens = tokens;
    await user.save();
    
    res.json({ message: 'Google Calendar connected successfully' });
  } catch (err) {
    console.error('Error in Google Calendar callback:', err);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/google-calendar/status
// @desc     Check Google Calendar connection status
// @access   Private
router.get('/status', auth, impersonation, async (req, res) => {
  try {
    const user = await User.findById(getEffectiveUserId(req));
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const connected = !!(user.googleCalendarTokens && user.googleCalendarTokens.access_token);
    res.json({ connected });
  } catch (err) {
    console.error('Error checking Google Calendar status:', err);
    res.status(500).send('Server Error');
  }
});

// @route    POST api/google-calendar/sync
// @desc     Sync content ideas to Google Calendar
// @access   Private
router.post('/sync', auth, impersonation, async (req, res) => {
  try {
    console.log('Starting sync process...');
    
    // Get user's content ideas that are marked for sync
    const contentIdeas = await ContentIdea.find({
      user: getEffectiveUserId(req),
      syncToGoogle: true
    }).populate('product', 'name variant');
    
    console.log(`Found ${contentIdeas.length} ideas to sync`);
    
    const results = [];
    
    // Create or update events for each selected content idea
    for (const idea of contentIdeas) {
      try {
        // Manually fetch the product
        let productName = 'Unknown Product';
        let productVariant = '';
        
        if (idea.product) {
          const product = await Product.findById(idea.product);
          if (product) {
            productName = product.name;
            productVariant = product.variant || '';
          }
        }
        
        // Format the event
        const event = {
          summary: `Content: ${idea.videoConcept}`,
          description: `Hook: ${idea.hook}\nProduct: ${productName}${productVariant ? ` - ${productVariant}` : ''}\nStatus: ${idea.status}`,
          start: {
            date: new Date(idea.postDateNeeded).toISOString().split('T')[0]
          },
          end: {
            date: new Date(idea.postDateNeeded).toISOString().split('T')[0]
          },
          colorId: idea.status === 'Posted' ? '2' : idea.status === 'Edited' ? '5' : '10',
          extendedProperties: {
            private: {
              contentIdeaId: idea._id.toString()
            }
          }
        };
        
        console.log(`Processing idea ${idea._id} - ${idea.videoConcept}`);
        
        // Check if event already exists
        if (idea.googleCalendarEventId) {
          // Update existing event
          const updatedEvent = await getCalendarClient(getEffectiveUserId(req)).events.update({
            calendarId: 'primary',
            eventId: idea.googleCalendarEventId,
            resource: event
          });
          results.push({ 
            id: idea._id, 
            action: 'updated', 
            success: true,
            eventId: idea.googleCalendarEventId
          });
        } else {
          // Create new event
          const createdEvent = await getCalendarClient(getEffectiveUserId(req)).events.insert({
            calendarId: 'primary',
            resource: event
          });
          
          // Store Google Calendar event ID in content idea
          await ContentIdea.findByIdAndUpdate(idea._id, {
            googleCalendarEventId: createdEvent.data.id,
            lastSyncedAt: new Date()
          });
          
          results.push({ 
            id: idea._id, 
            action: 'created', 
            success: true,
            eventId: createdEvent.data.id
          });
        }
      } catch (error) {
        console.error(`Error with event for ${idea._id}:`, error);
        results.push({ 
          id: idea._id, 
          action: idea.googleCalendarEventId ? 'updated' : 'created', 
          success: false,
          error: error.message
        });
      }
    }
    
    res.json({ results });
  } catch (err) {
    console.error('Sync error:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ 
      error: err.message,
      details: err.response ? err.response.data : null
    });
  }
});

// @route    PUT api/google-calendar/toggle-sync/:id
// @desc     Toggle syncToGoogle flag for a content idea
// @access   Private
router.put('/toggle-sync/:id', auth, impersonation, async (req, res) => {
  try {
    const contentIdea = await ContentIdea.findById(req.params.id);
    
    if (!contentIdea) {
      return res.status(404).json({ msg: 'Content idea not found' });
    }
    
    // Make sure user owns the content idea
    if (contentIdea.user.toString() !== getEffectiveUserId(req)) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    // Toggle the syncToGoogle flag
    contentIdea.syncToGoogle = !contentIdea.syncToGoogle;
    
    // If toggling off and has a Google Calendar event, remove it
    if (!contentIdea.syncToGoogle && contentIdea.googleCalendarEventId) {
      const currentUser = await User.findById(getEffectiveUserId(req));
      
      if (currentUser.googleCalendarTokens) {
        try {
          await getCalendarClient(getEffectiveUserId(req)).events.delete({
            calendarId: 'primary',
            eventId: contentIdea.googleCalendarEventId
          });
          
          // Clear the Google Calendar event ID
          contentIdea.googleCalendarEventId = null;
          contentIdea.lastSyncedAt = null;
        } catch (error) {
          console.error('Error removing Google Calendar event:', error);
          // Continue even if delete fails - we'll still update the local flag
        }
      }
    }
    
    await contentIdea.save();
    res.json(contentIdea);
  } catch (err) {
    console.error('Error toggling sync flag:', err);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/google-calendar/test
// @desc     Test Google Calendar connectivity
// @access   Private
router.get('/test', auth, async (req, res) => {
  try {
    // Get user with tokens
    const testUser = await User.findById(getEffectiveUserId(req));
    
    if (!testUser.googleCalendarTokens) {
      return res.status(400).json({ msg: 'Google Calendar not connected' });
    }
    
    console.log('Testing Google Calendar connection...');
    
    // Get Google Calendar client
    const calendar = getCalendarClient(testUser.googleCalendarTokens);
    
    // Try a simple operation - list calendars
    const calendarList = await calendar.calendarList.list({
      maxResults: 10
    });
    
    res.json({
      success: true,
      calendars: calendarList.data.items.map(cal => ({
        id: cal.id,
        summary: cal.summary
      }))
    });
  } catch (err) {
    console.error('Google Calendar test error:', err);
    res.status(500).json({
      success: false,
      error: err.message,
      details: err.response ? err.response.data : null
    });
  }
});

module.exports = router; 