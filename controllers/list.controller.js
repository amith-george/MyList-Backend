const mongoose = require('mongoose');
const List = require('../models/list.model');
const User = require('../models/user.model'); // Assuming you need to reference the User model
const Media = require('../models/media.model');

// Create a new list
exports.createList = async (req, res) => {
    try {
        const { title, description } = req.body;
        const userId = req.params.userId; // Assuming userId is passed in the request parameters

        const newList = new List({
            title,
            description,
            user: userId,
        });

        await newList.save();

        // Optionally, you can add the list ID to the user's lists array
        await User.findByIdAndUpdate(userId, { $push: { lists: newList._id } });

        res.status(201).json({ message: 'List created successfully', list: newList });
    } catch (error) {
        res.status(400).json({ message: 'Error creating list', error: error.message });
    }
};


// Get all lists by user
exports.getListsByUser = async (req, res) => {
    try {
      const lists = await List.find({ user: req.params.userId });
      res.status(200).json(lists);
    } catch (error) {
      res.status(400).json({ message: 'Error fetching lists', error: error.message });
    }
};



// Get a list by ID and verify it belongs to the user
exports.getListMedia = async (req, res) => {
    try {
        const { userId, id: listId } = req.params;

        // Find the user to verify their list array
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the listId exists in the user's lists array
        if (!user.lists.some(list => list.toString() === listId)) {
            return res.status(403).json({ message: 'List not associated with this user' });
        }

        // Fetch the list with populated media items
        const list = await List.findById(listId).populate('mediaItems');
        if (!list) {
            return res.status(404).json({ message: 'List not found' });
        }
        res.status(200).json(list);
    } catch (error) {
        res.status(400).json({ message: 'Error retrieving list', error: error.message });
    }
};



// Update a list after verifying it belongs to the user
exports.updateList = async (req, res) => {
    try {
        const { userId, id: listId } = req.params;

        // Find the user to verify their list array
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify the list is associated with this user
        if (!user.lists.some(list => list.toString() === listId)) {
            return res.status(403).json({ message: 'List not associated with this user' });
        }

        const { title, description } = req.body;
        const updateData = { title, description };

        // Update the list and return the new document
        const list = await List.findByIdAndUpdate(listId, updateData, { new: true });
        if (!list) {
            return res.status(404).json({ message: 'List not found' });
        }
        res.status(200).json({ message: 'List updated successfully', list });
    } catch (error) {
        res.status(400).json({ message: 'Error updating list', error: error.message });
    }
};


// Delete a list after verifying it belongs to the user
exports.deleteList = async (req, res) => {
  try {
    const { userId, id: listId } = req.params;

    // Find the user to verify their list array
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify the list is associated with this user
    if (!user.lists.some(list => list.toString() === listId)) {
      return res.status(403).json({ message: 'List not associated with this user' });
    }

    // Delete the list
    const list = await List.findByIdAndDelete(listId);
    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    // Delete all media items associated with the deleted list
    await Media.deleteMany({ listId: list._id });

    // Optionally, remove the list ID from the user's lists array
    await User.findByIdAndUpdate(list.user, { $pull: { lists: list._id } });

    res.status(200).json({ message: 'List and associated media deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting list', error: error.message });
  }
};


// Get media counts by type for a given list
exports.getMediaCountByType = async (req, res) => {
  try {
    const { userId, listId } = req.params;

    // Verify that the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify the list is associated with this user
    if (!user.lists.some(list => list.toString() === listId)) {
      return res.status(403).json({ message: 'List not associated with this user' });
    }

    // Check that the list exists
    const list = await List.findById(listId);
    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }

    // Use aggregation to count media items by type for the list
    const counts = await Media.aggregate([
      { $match: { listId: new mongoose.Types.ObjectId(listId) } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // Convert aggregation result into an object
    const result = {};
    counts.forEach(item => {
      result[item._id] = item.count;
    });

    res.status(200).json({
      message: 'Media counts retrieved successfully',
      counts: result
    });
  } catch (error) {
    console.error('Error retrieving media counts:', error);
    res.status(500).json({
      message: 'Error retrieving media counts',
      error: error.message
    });
  }
};
