const dotenv = require("dotenv");
dotenv.config();
const connectDB = require('./database/seed'); // Import the connectDB function
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const statusRoutes = require('./routes/status.routes');
const userRoutes = require('./routes/user.routes'); // Import user routes
const listRoutes = require('./routes/list.routes'); // Import list routes
const mediaRoutes = require('./routes/media.routes'); // Import media routes
const tmdbRoutes = require('./routes/tmdb.routes'); // Import tmdb routes

const app = express();

connectDB(); // Call the connectDB function

// Middleware
app.use(helmet());

// Rate Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

app.use(limiter);
app.use(cors());
app.use(bodyParser.json());


// Define a welcome route
app.get('/', (req, res) => {
    res.send('Welcome to the Personal Media Database API');
});


// Define routes
app.use('/status', statusRoutes); // Status routes
app.use('/users', userRoutes); // User routes
app.use('/lists', listRoutes); // List routes
app.use('/media', mediaRoutes); // Media routes
app.use('/tmdb', tmdbRoutes); // TMDB routes

// Export the app
module.exports = app;