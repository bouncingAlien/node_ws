const passport = require('passport');

exports.login = passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: 'Failed Log In!',
    successRedirect: '/',
    successFlash: 'You are now logged in.'
});