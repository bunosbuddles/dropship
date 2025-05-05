const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/user');
const ContentIdea = require('../../models/contentIdea');
const { getAuthUrl, getTokens, getCalendarClient } = require('../../config/googleCalendar');

// @route    GET api/google-calendar/auth
// @desc     Get Google OAuth URL
// @access   Private
router.get('/auth', auth, (req, res) => {
  try {
    const authUrl = getAuthUrl(req.user.id);
    res.json({ authUrl });
  } catch (err) {
    console.error('Error generating auth URL:', err);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/google-calendar/oauth2callback
// @desc     Handle OAuth callback
// @access   Public (OAuth redirect)
router.get('/oauth2callback', async (req, res) => {
  const { code, state } = req.query;
  const userId = state; // We passed user ID as state
  
  try {
    // Exchange code for tokens
    const tokens = await getTokens(code);
    
    // Store tokens in the user document
    await User.findByIdAndUpdate(userId, { 
      googleCalendarTokens: tokens 
    });
    
    // Redirect to frontend calendar page with production URL
    res.redirect('https://dropship-frontend.onrender.com/calendar?authSuccess=true');
  } catch (err) {
    console.error('Google OAuth error:', err);
    res.redirect('https://dropship-frontend.onrender.com/calendar?authError=true');
  }
});

// @route    GET api/google-calendar/status
// @desc     Check if user has connected Google Calendar
// @access   Private
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ 
      connected: !!user.googleCalendarTokens,
      // Don't send the actual tokens to frontend
    });
  } catch (err) {
    console.error('Error checking Google Calendar status:', err);
    res.status(500).send('Server Error');
  }
});

// @route    POST api/google-calendar/sync
// @desc     Sync selected content ideas to Google Calendar
// @access   Private
router.post('/sync', auth, async (req, res) => {
  try {
    // Get user with tokens
    const user = await User.findById(req.user.id);
    
    if (!user.googleCalendarTokens) {
      return res.status(400).json({ msg: 'Google Calendar not connected' });
    }
    
    // Get Google Calendar client
    const calendar = getCalendarClient(user.googleCalendarTokens);
    
    // Get content ideas marked for sync
    const contentIdeas = await ContentIdea.find({ 
      user: req.user.id,
      syncToGoogle: true // Only sync ideas marked for sync
    }).populate('product', 'name variant');
    
    const results = [];
    
    // Create or update events for each selected content idea
    for (const idea of contentIdeas) {
      // Format the event
      const event = {
        summary: `Content: ${idea.videoConcept}`,
        description: `Hook: ${idea.hook}\nProduct: ${idea.product.name}${idea.product.variant ? ` - ${idea.product.variant}` : ''}\nStatus: ${idea.status}`,
        start: {
          date: new Date(idea.postDateNeeded).toISOString().split('T')[0]
        },
        end: {
          date: new Date(idea.postDateNeeded).toISOString().split('T')[0]
        },
        // Color based on status (2=green, 5=yellow, 10=gray)
        colorId: idea.status === 'Posted' ? '2' : idea.status === 'Edited' ? '5' : '10',
        // Store content idea ID in extendedProperties for reference
        extendedProperties: {
          private: {
            contentIdeaId: idea._id.toString()
          }
        }
      };
      
      try {
        // Check if event already exists
        if (idea.googleCalendarEventId) {
          // Update existing event
          const updatedEvent = await calendar.events.update({
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
          const createdEvent = await calendar.events.insert({
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
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/google-calendar/toggle-sync/:id
// @desc     Toggle syncToGoogle flag for a content idea
// @access   Private
router.put('/toggle-sync/:id', auth, async (req, res) => {
  try {
    const contentIdea = await ContentIdea.findById(req.params.id);
    
    if (!contentIdea) {
      return res.status(404).json({ msg: 'Content idea not found' });
    }
    
    // Make sure user owns the content idea
    if (contentIdea.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    // Toggle the syncToGoogle flag
    contentIdea.syncToGoogle = !contentIdea.syncToGoogle;
    
    // If toggling off and has a Google Calendar event, remove it
    if (!contentIdea.syncToGoogle && contentIdea.googleCalendarEventId) {
      const user = await User.findById(req.user.id);
      
      if (user.googleCalendarTokens) {
        try {
          const calendar = getCalendarClient(user.googleCalendarTokens);
          await calendar.events.delete({
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

module.exports = router; 