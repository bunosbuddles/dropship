const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

// These values should come from environment variables
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5001/api/google-calendar/oauth2callback';

// Create a new OAuth2 client
const oAuth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Generate authorization URL
const getAuthUrl = (userId) => {
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ];
  
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: userId // Pass user ID as state for the callback
  });
};

// Exchange code for tokens
const getTokens = async (code) => {
  const { tokens } = await oAuth2Client.getToken(code);
  return tokens;
};

// Set credentials and return calendar client
const getCalendarClient = (tokens) => {
  oAuth2Client.setCredentials(tokens);
  return google.calendar({ version: 'v3', auth: oAuth2Client });
};

module.exports = {
  getAuthUrl,
  getTokens,
  getCalendarClient
}; 