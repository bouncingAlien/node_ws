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
    },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// define indexes

storeSchema.index({
    name: 'text',
    description: 'text'
});

storeSchema.index({ location: '2dsphere' });

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

storeSchema.statics.getTopStores = function() {
    return this.aggregate([
        // lookup stores and populate their reviews
        {
            $lookup: {
                from: 'reviews', // mongodb alone lovercase schema name (ref) and adds 's' to end
                localField: '_id', // which local filed to try to match
                foreignField: 'store', // which foreign field to try to match
                as: 'reviews' // name of virtual field
            }
        },
        // filter for only items that have 2 or more reviews
        {
            $match: {
                'reviews.1': { $exists: true } // .1 to access things that are index based in mongodb (.0 - first, .1 - second...)
            }
        },
        // add the average reviews field
        {
            $addFields: { // add new virtual field
                averageRating: { // named averageRating
                    $avg: '$reviews.rating' // avg is math operator, and $ in front of reviews it means that is a property being piped in from previous method
                }
            }
        },
        // sort it by our new field, highest average first
        {
            $sort: {
                averageRating: -1 // 1 or -1
            }
        },
        // limit it to 10
        { $limit: 10 }
    ]);
};

// virtual is mongoose method, not avaliable on mongodb
storeSchema.virtual('reviews', {
    ref: 'Review', // name of model to make connection
    localField: '_id', // which field on store - local field shold match:
    foreignField: 'store' // which field on Review - foreign field, to make connection
});

function autopopulate(next) {
    this.populate('reviews');
    next();
}

storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Store', storeSchema);