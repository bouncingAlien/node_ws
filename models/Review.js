const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const reviewSchema = new mongoose.Schema({
    created: {
        type: Date,
        default: Date.now
    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'You must supply an author'
    },
    store: {
        type: mongoose.Schema.ObjectId,
        ref: 'Store',
        required: 'You must supply a store'
    },
    text: {
        type: String,
        required: 'Your review must have text!'
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    }
});

function autopopulate(next) {
    // set this.author with data from author (user) schema - the schema that it refers
    this.populate('author');
    next();
};

// every time find and finone method are called, call also autopopulate to replace author id with user data
reviewSchema.pre('find', autopopulate);
reviewSchema.pre('findOne', autopopulate);


module.exports = mongoose.model('Review', reviewSchema);