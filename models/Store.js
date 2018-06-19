const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: 'Please enter a store name!', // any value acts as a true, only this text replaces error msg
    },
    slug: String,
    description: {
        type: String,
        trim: true,
    },
    tags: [String], // to except array of strings
    created: {
        type: Date,
        default: Date.now
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: [{
            type: Number,
            required: 'You must supply coordinates!'
        }],
        address: {
            type: String,
            required: 'You must supply an address!'
        }
    },
    photo: String,
    // to create relationship with User table
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'You must supply an author.'
    }
});

// define indexes

storeSchema.index({
    name: 'text',
    description: 'text'
});

storeSchema.pre('save', async function(next) {
    // skip it
    if (!this.isModified('name')) {
        next();
        return;
    }
    // run only if this.name is modified
    this.slug = slug(this.name);
    // find does other stores have same slug
    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
    const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
    if (storesWithSlug.length) {
        this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
    }
    next();
});

// to add new methods to schema, we add them to statics object
// we have to use standard function, because we want this to be bound to Store model
storeSchema.statics.getTagsList = function() {
    return this.aggregate([
        // destruct every store by one element in tags array
        // every element create new istance of store with only that element as tag
        { $unwind: '$tags' },
        // for every tag property create object with that id and count property
        // group elements with same id, and increase count property by one
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        // sort them by the value of count property (1 for ascending, -1 descending)
        { $sort: { count: -1 } }
    ]);
};

module.exports = mongoose.model('Store', storeSchema);