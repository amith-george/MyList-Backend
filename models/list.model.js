const mongoose = require('mongoose');

const listSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    mediaItems: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Media',
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const listModel = mongoose.model('List', listSchema);
module.exports = listModel;