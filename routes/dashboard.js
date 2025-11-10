var express = require('express');
var router = express.Router();

// Middleware to check authentication
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

// Dashboard home page (this becomes /dashboard when mounted)
router.get('/', isAuthenticated, function(req, res, next) {
  res.render('dashboard', { user: req.user });
});

router


module.exports = router;