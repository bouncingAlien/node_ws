const mongoose = require('mongoose');
const Store = mongoose.model('Store');

exports.homePage = (req, res) => {
    res.render('index');
};

exports.addStore = (req, res) => {
    res.render('editStore', { title: 'Add Store' });
};

exports.createStore = async(req, res) => {
    const store = await (new Store(req.body)).save();
    req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);
    console.log('It worked!');
    res.redirect(`/store/${store.slug}`);
};

exports.getStores = async(req, res) => {
    const stores = await Store.find();
    console.log(stores);
    res.render('stores', { title: 'Stores', stores });
};

exports.editStore = async (req, res) => {
    const store = await Store.findOne({ _id: req.params.id });
    res.render('editStore', {title: `Edit ${store.name}`, store});
};

exports.updateStore = async (req, res) => {
    const store = await Store.findOneAndUpdate({_id: req.params.id }, req.body, {
        new: true, // returns new store insted of the old one
        runValidators: true, // runs same validators that we defined in model for object creation
    }).exec(); // exec method ensures that query is runed
    req.flash('success', `Successfully updated ${store.name}. <a href=/store/${store.slug}>View Store</a>`);
    res.redirect(`/store/${store._id}/edit`);
};