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
    photo: String
});

storeSchema.pre('save', function(next) {
    // skip it
    if (!this.isModified('name')) {
        next();
        return;
    }
    // run only if this.name is modified
    this.slug = slug(this.name);
    next();
});

module.exports = mongoose.model('Store', storeSchema);