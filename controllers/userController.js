const mongoose = require('mongoose');

exports.loginForm = (req, res) => {
    res.render('login', { title: 'Login' });
}

exports.registerForm = (req, res) => {
    res.render('register', { title: 'Register' });
}

exports.validateRegister = (req, res, next) => {
    // methods on express-validator package
    req.sanitizeBody('name');
    req.checkBody('name', 'You must supply a name.').notEmpty();
    req.sanitizeBody('email').normalizeEmail({
        remove_dots: false,
        remove_extension: false,
        gmail_remove_subaddress: false
    });
    req.checkBody('email', 'That e-mail is not valid.').isEmail();
    req.checkBody('password', 'Password can not be blank.').notEmpty();
    req.checkBody('password-confirm', 'Confirmed password can not be blank.').notEmpty();
    req.checkBody('password-confirm', 'Your passwords do not match.').equals(req.body.password);

    const error = req.validationErrors();
    if (error) {
        req.flash('error', error.map(err => err.msg));
        res.render('register', { title: 'Register', body: req.body, flashes: req.flash() })
        return; // stop function from running 
    }
    // if no errors call next
    next();
};