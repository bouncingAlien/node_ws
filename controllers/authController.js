const passport = require('passport');

exports.login = (req, res, next) => {
    passport.authenticate('local', {
        failureRedirect: '/login',
        failureFlash: 'Failed Log In!',
        successRedirect: '/',
        successFlash: 'You are now logged in.'
    })(req, res, next);
}

exports.logout = (req, res) => {
    req.logout();
    req.flash('success', 'You are now logged out!');
    res.redirect('/');
}

exports.isLoggedIn = (req, res, next) => {
    // check is user logged in
    if (req.isAuthenticated()) {
        next(); // if true, continue
        return;
    }
    req.flash('error', 'You must be logged in!');
    res.redirect('/login');
}