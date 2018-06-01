const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

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

exports.register = async(req, res, next) => {
    // create new user
    const user = new User({ email: req.body.email, name: req.body.name });
    // to use promisify library for promises... or else we use callback
    const registerWithPromise = promisify(User.register, User);
    await registerWithPromise(user, req.body.password);
    next(); // pass to authController.login
}

exports.account = (req, res) => {
    res.render('account', { title: 'Edit Your Account.' });
}

exports.updateAccount = async(req, res) => {
    const updates = {
        name: req.body.name,
        email: req.body.email
    };
    const user = await User.findOneAndUpdate(
        // query - specify user, using ID from id property that is passed to us by passport
        { _id: req.user._id },
        // update - take updates object and use it to update data
        { $set: updates },
        // options
        // 1: send back new data stored in DB
        // 2 run validation of input
        // 3: context is required from mongoose to run and finis query
        { new: true, runValidators: true, context: 'query' }
    )
    req.flash('success', 'Updated the profile!');
    res.redirect('account');
}