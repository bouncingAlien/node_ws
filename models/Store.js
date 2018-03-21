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
    tags: [String] // to except array of strings
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