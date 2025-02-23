const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['movie', 'tv', 'anime'],
        required: true,
    },
    rating: {
        type: Number,
        min: 1,
        max: 10,
    },
    review: {
        type: String,
    },
    tmdbId: {
        type: Number,
        required: true,
    },
    listId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'List',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});


mediaSchema.index({ tmdbId: 1, listId: 1 }, { unique: true });

const Media = mongoose.model('Media', mediaSchema);
module.exports = Media;
