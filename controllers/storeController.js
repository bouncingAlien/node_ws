const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
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
    req.body.author = req.user._id;
    const store = await (new Store(req.body)).save();
    req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);
    console.log('It worked!');
    res.redirect(`/store/${store.slug}`);
};

exports.getStores = async(req, res) => {
    const stores = await Store.find();
    // we can use ...find().populate('reviews') to get complete object that ref field is pointing, insted populate function that is defined on Store schema
    res.render('stores', { title: 'Stores', stores });
};

const confirmOwner = (store, user) => {
    if (!store.author.equals(user._id)) {
        throw Error('You must own a store in oreder to edit it!');
    }
}

exports.editStore = async(req, res) => {
    const store = await Store.findOne({ _id: req.params.id });
    confirmOwner(store, req.user);
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
    const store = await Store.findOne({ slug: req.params.slug }).populate('author reviews'); // populate to get complete object that ref field is pointing
    if (!store) return next();
    res.render('store', { store: store, title: store.name });
};

exports.getStoresByTag = async(req, res) => {
    const tag = req.params.tag;
    // if tag is empty, set it to propery that will return any object that has any value on tag property
    const tagQuery = tag || { $exists: true };
    // query both queries in same time, and they will return promise
    const tagsPromise = Store.getTagsList();
    const storesPromise = Store.find({ tags: tagQuery });
    // than await them until the slowest one is resolved, and destruckt array to separate variables
    const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
    // render tags page, and pass tags variable, title, current selected tag, and store with that tag(or all stores)
    res.render('tags', { tags, title: 'Tags', tag, stores });
};

exports.mapPage = (req, res) => {
    res.render('map', { title: 'Map' });
};

exports.hearts = async(req, res) => {
    const stores = await Store.find({ _id: { $in: req.user.hearts } });
    res.render('hearts', { title: 'Hearted', stores });
}

// API -------------------------------------------------------

exports.searchStores = async(req, res) => {
    const stores = await Store.find({ // find stores that respond to query
        $text: {
            $search: req.query.q
        }
    }, {
        score: { $meta: 'textScore' } // create virtual meta value for each store based on time that query word is repetet
    }).sort({ // mongodb built in method
        score: { $meta: 'textScore' } // sort stores by values in that virtual table
    }).limit(5);
    res.json(stores);
};

exports.mapStores = async(req, res) => {
    const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
    const q = {
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates
                },
                $maxDistance: 10000 //10000m or 10km
            }
        }
    }
    const stores = await Store.find(q).select('slug name description location photo').limit(10);
    res.json(stores);
};

exports.heartStore = async(req, res) => {
    // get all gearts from user, it is a list of objects in array
    const hearts = req.user.hearts.map(obj => obj.toString());
    // if user has that store id in hearts array, set operator to pull (remove), else set it to add (addtoset let it add only once)
    const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
    // find user and update
    const user = await User
        .findByIdAndUpdate(req.user._id, {
            // es6 passing value of operator, and adding or removing store id object from array depending on operator
            [operator]: { hearts: req.params.id }
        }, { new: true }); // new operator is making sure that user object that is passed as response, is one after findByIdAndUpdate method is done
    res.json(user);
}

exports.getTopStores = async(req, res) => {
    const stores = await Store.getTopStores();
    res.render('topStores', { stores, title: 'Top Stores!' });
}