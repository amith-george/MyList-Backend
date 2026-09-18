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
    overview: { type: String },
    release_date: { type: String },
    vote_average: { type: Number },
    poster_path: { type: String },
    trailer_key: { type: String },
    director: { type: String },
    episode_count: { type: Number },
    cast: [{
        name: { type: String },
        character: { type: String }
    }],
});


mediaSchema.index({ tmdbId: 1, listId: 1 }, { unique: true });
mediaSchema.index({ listId: 1, type: 1, createdAt: -1 });
mediaSchema.index({ userId: 1, type: 1, createdAt: -1 });
const Media = mongoose.model('Media', mediaSchema);
module.exports = Media;
