const mongoose = require('mongoose');
const axios = require('axios');
const pLimit = require('p-limit').default;
const List = require('../models/list.model');
const User = require('../models/user.model'); // Assuming you need to reference the User model
const Media = require('../models/media.model');

const limit = pLimit(40); // Limit to 40 concurrent TMDb API calls
const TMDB_API_KEY = process.env.TMDB_API_KEY; // Accessing the API key from .env
const TMDB_BASE_URL = process.env.TMDB_BASE_URL; // Accessing the base URL from .env

// Create a new list
exports.createList = async (req, res) => {
    try {
        const userId = req.params.userId; // Assuming userId is passed in the request parameters
        if (userId !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized action' });
        }

        const { title, description } = req.body;

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



// Update a list after verifying it belongs to the user
exports.updateList = async (req, res) => {
    try {
        const { userId, id: listId } = req.params;
        if (userId !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized action' });
        }

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
    if (userId !== req.user.id) {
        return res.status(403).json({ message: 'Unauthorized action' });
    }

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


// Get list media with details
exports.getListMediaWithDetails = async (req, res) => {
  try {
    const { userId, id: listId } = req.params;
    const { page = 1, limit: queryLimit = 28, sort, filter, search } = req.query;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.lists.includes(listId)) {
      return res.status(403).json({ message: 'List not associated with this user' });
    }

    const list = await List.findById(listId);
    if (!list) return res.status(404).json({ message: 'List not found' });

    const start = (page - 1) * queryLimit;
    const limitNum = parseInt(queryLimit);

    // 1. Build Match Query (Filter & Search)
    const matchQuery = { listId: list._id };
    if (filter === 'movie' || filter === 'tv') {
        matchQuery.type = filter;
    }
    if (search && search.trim() !== '') {
        const regex = { $regex: search.trim(), $options: 'i' };
        matchQuery.$or = [{ title: regex }, { name: regex }]; // Assuming `name` might exist instead of `title` for TV, or just searching title
    }

    // 2. Build Sort Query
    let sortQuery = { createdAt: -1 }; // Default: added-desc
    if (sort === 'added-asc') sortQuery = { createdAt: 1 };
    else if (sort === 'rating-desc') sortQuery = { rating: -1 };
    else if (sort === 'rating-asc') sortQuery = { rating: 1 };

    const totalItems = await Media.countDocuments(matchQuery);
    const paginatedItems = await Media.find(matchQuery)
        .sort(sortQuery)
        .skip(start)
        .limit(limitNum);

    // Map `type` to `media_type` as expected by the frontend
    const enrichedMedia = paginatedItems.map(item => ({
        ...item.toObject(),
        media_type: item.type
    }));

    res.status(200).json({
      list: {
        _id: list._id,
        title: list.title,
        description: list.description,
      },
      mediaItems: enrichedMedia,
      pagination: {
        page: Number(page),
        limit: limitNum,
        totalItems,
        totalPages: Math.ceil(totalItems / limitNum),
      },
    });
  } catch (err) {
    console.error('Error in getListMediaWithDetails:', err.message);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};