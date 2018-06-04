const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

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

exports.forgot = async(req, res) => {
    // 1. check does user email exist
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        req.flash('error', 'No account with that email exist!');
        return res.redirect('/login');
    }
    // 2. if exist, set reset token and expiry of that token on their account
    user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
    await user.save();
    // 3. send email with token
    const resetURL = `http//${req.headers.host}/account/reset/${user.resetPasswordToken}`;
    req.flash('success', `You have been emailed a password reset link. ${resetURL}`);
    // 4. redirect to login page 
    res.redirect('/login');
}

exports.reset = async(req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired!');
        res.redirect('/login');
    }
    // if there is user, show password reset form
    res.render('reset', { title: 'Reset your Password.' });
}

exports.confirmPasswords = (req, res, next) => {
    if (req.body.password === req.body['password-confirm']) {
        next();
        return;
    }
    req.flash('error', 'Passwords do not match!');
    res.redirect('back');
}

exports.update = async(req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired!');
        res.redirect('/login');
    }
    const setPassword = promisify(user.setPassword, user);
    await setPassword(req.body.password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    const updatedUser = await user.save();
    await req.login(updatedUser);
    req.flash('success', 'Your password has been reset.');
    res.redirect('/');
}