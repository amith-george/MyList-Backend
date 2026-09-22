const Media = require('../models/media.model');
const List = require('../models/list.model');
const axios = require('axios');
const mongoose = require('mongoose');
const pLimit = require('p-limit').default;

const limit = pLimit(40);
const TMDB_API_KEY = process.env.TMDB_API_KEY; // Accessing the API key from .env
const TMDB_BASE_URL = process.env.TMDB_BASE_URL; // Accessing the base URL from .env

// Add media to a list
exports.addMediaToList = async (req, res) => {
    try {
        const { tmdbId, title, type, rating, review } = req.body;
        const listId = req.params.listId;
        const userId = req.user.id; // Use authenticated user ID instead of body

        const list = await List.findById(listId);
        if (!list) return res.status(404).json({ message: 'List not found' });
        if (list.user.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized action' });

        const numericTmdbId = Number(tmdbId);
        const duplicate = await Media.findOne({ listId, tmdbId: numericTmdbId });
        if (duplicate) return res.status(400).json({ message: 'Media already exists in this list' });

        // Fetch TMDB data to cache it permanently
        let tmdbData = {};
        try {
            const [details, videos, credits] = await Promise.all([
                axios.get(`${TMDB_BASE_URL}/${type}/${numericTmdbId}`, { params: { language: 'en-US' }, headers: { Authorization: `Bearer ${TMDB_API_KEY}` } }),
                axios.get(`${TMDB_BASE_URL}/${type}/${numericTmdbId}/videos`, { headers: { Authorization: `Bearer ${TMDB_API_KEY}` } }),
                axios.get(`${TMDB_BASE_URL}/${type}/${numericTmdbId}/credits`, { headers: { Authorization: `Bearer ${TMDB_API_KEY}` } })
            ]);
            const trailer = videos.data.results.find(video => video.site === 'YouTube' && video.type === 'Trailer');
            
            tmdbData = {
                overview: details.data.overview,
                release_date: details.data.release_date || details.data.first_air_date,
                vote_average: details.data.vote_average,
                poster_path: details.data.poster_path,
                trailer_key: trailer?.key || null,
                director: credits.data.crew.find(c => c.job === 'Director')?.name || null,
                cast: credits.data.cast.slice(0, 5).map(actor => ({ name: actor.name, character: actor.character })),
            };
            if (type === 'tv') tmdbData.episode_count = details.data.number_of_episodes;
        } catch (err) {
            console.error('Failed to fetch TMDB data during addMedia:', err.message);
        }

        const newMedia = new Media({
            tmdbId: numericTmdbId, title, type, rating: Number(rating), review, listId, userId, ...tmdbData
        });
        await newMedia.save();

        res.status(201).json({ message: 'Media added to list successfully', media: newMedia });
    } catch (error) {
        res.status(400).json({ message: 'Error adding media to list', error: error.message });
    }
};



// Update media in a list
exports.updateMediaInList = async (req, res) => {
    try {
        const { mediaId } = req.params;
        const { title, type, rating, review } = req.body;

        const media = await Media.findById(mediaId);
        if (!media) {
            return res.status(404).json({ message: 'Media not found' });
        }

        if (media.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized action' });
        }

        const updatedMedia = await Media.findByIdAndUpdate(mediaId, {
            title,
            type,
            rating,
            review,
        }, { new: true, runValidators: true });

        res.status(200).json({ message: 'Media updated successfully', media: updatedMedia });
    } catch (error) {
        res.status(400).json({ message: 'Error updating media', error: error.message });
    }
};


// Delete media from a list
exports.deleteMediaFromList = async (req, res) => {
    try {
        const { mediaId, listId } = req.params;

        const list = await List.findById(listId);
        if (!list) {
             return res.status(404).json({ message: 'List not found' });
        }
        if (list.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized action' });
        }

        // Delete the media item from the database
        const deletedMedia = await Media.findByIdAndDelete(mediaId);
        if (!deletedMedia) {
            return res.status(404).json({ message: 'Media not found' });
        }

        res.status(200).json({ message: 'Media deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: 'Error deleting media', error: error.message });
    }
};


// Get details of Movie stored in Database
exports.getMediaDetails = async (req, res) => {
    try {
        const { listId, tmdbId } = req.params;
        const numericTmdbId = parseInt(tmdbId, 10);
        if (isNaN(numericTmdbId)) return res.status(400).json({ message: 'Invalid TMDB ID format' });

        const media = await Media.findOne({ listId, tmdbId: numericTmdbId });
        if (!media) return res.status(404).json({ message: 'Media not found in this list' });

        // Since we migrated, we can just return it from the DB instantly
        const responseData = {
            ...media.toObject(),
            media_type: media.type
        };

        res.status(200).json(responseData);
    } catch (error) {
        console.error('Error fetching media details:', error);
        res.status(500).json({ message: 'Error fetching media details', error: error.message });
    }
};


// Get 15 latest media items of a given media type for a specific user
exports.getLatestMediaByType = async (req, res) => {
    try {
      const { userId, mediaType } = req.params;
      const allowedTypes = ['movie', 'tv', 'anime'];
      if (!allowedTypes.includes(mediaType)) return res.status(400).json({ message: 'Invalid media type' });
  
      const latestMedia = await Media.find({ type: mediaType, userId })
        .sort({ createdAt: -1 })
        .limit(15)
        .populate('listId', 'title');
  
      const enrichedMedia = latestMedia.map(media => ({
          ...media.toObject(),
          media_type: media.type,
          listname: media.listId ? media.listId.title : null,
      }));
  
      res.status(200).json(enrichedMedia);
    } catch (error) {
      console.error('Error fetching latest media by type:', error);
      res.status(500).json({ message: 'Error fetching latest media by type', error: error.message });
    }
};


// Get stats for a user's media (only rated media)
exports.getMediaStats = async (req, res) => {
    try {
        const { userId } = req.params;

        const stats = await Media.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId), rating: { $gt: 0 } } },
            { 
                $facet: {
                    counts: [
                        { $group: { _id: "$type", count: { $sum: 1 } } }
                    ],
                    averages: [
                        { $group: { _id: null, avgRating: { $avg: "$rating" }, totalRating: { $sum: "$rating" }, count: { $sum: 1 } } }
                    ],
                    mostUsedList: [
                        { $group: { _id: "$listId", count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                        { $limit: 1 }
                    ]
                }
            }
        ]);

        const result = stats[0];
        const movieCount = result.counts.find(c => c._id === 'movie')?.count || 0;
        const tvCount = result.counts.find(c => c._id === 'tv')?.count || 0;
        
        const avgRatingObj = result.averages[0];
        const averageRating = avgRatingObj ? Number(avgRatingObj.avgRating.toFixed(2)) : 0;

        let mostUsedList = null;
        if (result.mostUsedList.length > 0) {
            const listId = result.mostUsedList[0]._id;
            const count = result.mostUsedList[0].count;
            const list = await List.findById(listId);
            if (list) {
                mostUsedList = { listId: list._id, title: list.title, count };
            }
        }

        res.status(200).json({
            totalRatedMovies: movieCount,
            totalRatedTVShows: tvCount,
            averageRating,
            mostUsedList
        });
    } catch (error) {
        console.error('Error getting media stats:', error);
        res.status(500).json({ message: 'Error getting media stats', error: error.message });
    }
};
