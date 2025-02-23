const mongoose = require('mongoose');

// Function to connect to the database
function connectDB() {
    mongoose.connect(process.env.DB_CONNECT)
        .then(() => {
            console.log('Connected to the database!');
        })
        .catch((err) => {
            console.log('Database connection error:', err);
        });
}

// Export the connectDB function
module.exports = connectDB;