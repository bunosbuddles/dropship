const User = require('../models/user');

// Impersonation middleware that should be used AFTER auth middleware
module.exports = async function (req, res, next) {
  const impersonateId = req.header('x-impersonate-user-id');
  console.log(`[DEBUG] Impersonation - impersonateId header: ${impersonateId}`);
  console.log(`[DEBUG] Impersonation - req.user:`, req.user ? req.user.id : 'no user');
  
  if (impersonateId && req.user) {
    try {
      const requestingUser = await User.findById(req.user.id);
      console.log(`[DEBUG] Impersonation - requestingUser role: ${requestingUser ? requestingUser.role : 'not found'}`);
      
      if (requestingUser && requestingUser.role === 'superuser') {
        req.impersonatedUserId = impersonateId;
        console.log(`[DEBUG] Impersonation - set impersonatedUserId to: ${impersonateId}`);
      } else {
        console.log(`[DEBUG] Impersonation - user is not superuser or not found`);
      }
    } catch (err) {
      console.log(`[DEBUG] Impersonation - error: ${err.message}`);
      // Ignore and proceed as normal user
    }
  } else {
    console.log(`[DEBUG] Impersonation - no impersonateId or no req.user`);
  }
  next();
}; 