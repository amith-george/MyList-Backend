const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const List = require('../models/list.model');


// Create a new user and default lists
exports.registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if a user with the provided email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Hash the password before saving
        const hashedPassword = await User.hashPassword(password);

        // Create the new user (Mongoose will validate username and bio according to our schema)
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
        });
        await newUser.save();

        // Define the default lists to create for the user
        const defaultLists = [
            { title: 'Completed', description: 'Your completed movies or TV shows.' },
            { title: 'Currently Watching', description: 'Movies or TV shows you are currently watching.' },
            { title: 'Plan to watch', description: 'Movies or TV shows you plan to watch.' },
            { title: 'Dropped', description: 'Movies or TV shows you have dropped.' },
        ];

        // Create each list and save its _id
        const createdLists = await Promise.all(
            defaultLists.map(async (listData) => {
                const newList = new List({
                    ...listData,
                    user: newUser._id,
                });
                await newList.save();
                return newList._id;
            })
        );

        // Update the user's lists array with the new list IDs
        newUser.lists = createdLists;
        await newUser.save();

        res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (error) {
        res.status(400).json({ message: 'Error creating user', error: error.message });
    }
};



// User login
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email and include the password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '10d' } // Token expires in 1 hour. Adjust as needed.
    );

    // Return the token along with user info (excluding password)
    res.status(200).json({
      message: 'Login successful',
      token,
      user: { username: user.username, email: user.email }
    });
  } catch (error) {
    res.status(400).json({ message: 'Error logging in', error: error.message });
  }
};


// In your user controller file
exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User with this email not found' });
        }

        // Hash and update password
        const hashedPassword = await User.hashPassword(newPassword);
        const updatedUser = await User.findOneAndUpdate(
            { email },
            { password: hashedPassword },
            { new: true }
        ).select('-password');

        res.status(200).json({ 
            message: 'Password reset successfully',
            user: updatedUser 
        });
        
    } catch (error) {
        res.status(500).json({ 
            message: 'Error resetting password',
            error: error.message 
        });
    }
};



// Get user information by ID
exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password'); // Exclude password from response
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(400).json({ message: 'Error retrieving user', error: error.message });
    }
};



// Update user information
exports.updateUser = async (req, res) => {
    try {
        const { username, email, password, bio } = req.body;
        const updateData = { username, email, bio }; // Include bio in the update

        // Hash the new password if provided
        if (password) {
            updateData.password = await User.hashPassword(password);
        }

        const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User updated successfully', user });
    } catch (error) {
        res.status(400).json({ message: 'Error updating user', error: error.message });
    }
};



// Delete a user
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: 'Error deleting user', error: error.message });
    }
};