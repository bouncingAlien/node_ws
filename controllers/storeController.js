const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter: function(req, file, next) {
        const isPhoto = file.mimetype.startsWith('image/');
        if (isPhoto) {
            next(null, true);
        } else {
            next('This file type isn\'t allowed', null);
        }
    }
}

exports.homePage = (req, res) => {
    res.render('index');
};

exports.addStore = (req, res) => {
    res.render('editStore', { title: 'Add Store' });
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async(req, res, next) => {
    // check is there a file
    if (!req.file) {
        next();
        return;
    }
    // split mimetype to get extension example 'image/jpg'
    const extension = req.file.mimetype.split('/')[1];
    // rename photo to unique name
    req.body.photo = `${uuid.v4()}.${extension}`;
    // now resize
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);
    // when we write photo to disk, keep going
    next();
}

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

exports.editStore = async(req, res) => {
    const store = await Store.findOne({ _id: req.params.id });
    res.render('editStore', { title: `Edit ${store.name}`, store });
};

exports.updateStore = async(req, res) => {
    // set location data to be point (for address update)
    req.body.location.type = 'Point';
    const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true, // returns new store insted of the old one
        runValidators: true, // runs same validators that we defined in model for object creation
    }).exec(); // exec method ensures that query is runed
    req.flash('success', `Successfully updated ${store.name}. <a href=/store/${store.slug}>View Store</a>`);
    res.redirect(`/store/${store._id}/edit`);
};

exports.getStoreBySlug = async(req, res) => {
    const store = await Store.findOne({ slug: req.params.slug });
    if (!store) return next();
    res.render('store', { store: store, title: store.name });
};

exports.getStoresByTag = async(req, res) => {
    const tags = await Store.getTagsList();
    const tag = req.params.tag;
    res.render('tags', { tags: tags, title: 'Tags', tag: tag });
};