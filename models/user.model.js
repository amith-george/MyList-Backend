const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [30, 'Username cannot be more than 30 characters'],
    },
    email: {
        type: String,
        unique: true,
        required: true,
        minlength: [5, 'Email must be at least 5 characters long'],
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    bio: { 
        type: String,
        maxlength: [150, 'Bio cannot exceed 150 characters'], 
        default: '' 
    },
    avatar: {
        type: String,
        default: 'boy1.png',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    lists: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'List',
    }],
});

userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.statics.hashPassword = async function(password) {
    return await bcrypt.hash(password, 10);
}

const userModel = mongoose.model('User', userSchema);
module.exports = userModel;