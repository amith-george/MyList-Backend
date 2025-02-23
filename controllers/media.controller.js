const Media = require('../models/media.model');
const List = require('../models/list.model');
const axios = require('axios');


const TMDB_API_KEY = process.env.TMDB_API_KEY; // Accessing the API key from .env
const TMDB_BASE_URL = process.env.TMDB_BASE_URL; // Accessing the base URL from .env

// Add media to a list
exports.addMediaToList = async (req, res) => {
    try {
        // Extract values from request body and parameters
        const { tmdbId, title, type, rating, review, userId } = req.body;
        const listId = req.params.listId;

        // Retrieve the list and populate media items to check for duplicates
        const list = await List.findById(listId).populate('mediaItems');
        if (!list) {
            return res.status(404).json({ message: 'List not found' });
        }

        // Cast tmdbId to a number for comparison
        const numericTmdbId = Number(tmdbId);

        // Check if the media with the same tmdbId already exists in this list
        const duplicate = list.mediaItems.find(item => item.tmdbId === numericTmdbId);
        if (duplicate) {
            return res.status(400).json({ message: 'Media already exists in this list' });
        }

        // Create a new media entry (ensure rating is a number)
        const newMedia = new Media({
            tmdbId: numericTmdbId,
            title,
            type,
            rating: Number(rating),
            review,
            listId, // Associate with the specific list
            userId  // Associate with the user who added the media
        });
        await newMedia.save();

        // Add the new media item's ID to the list's mediaItems array and save the list
        list.mediaItems.push(newMedia._id);
        await list.save();

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

        const updatedMedia = await Media.findByIdAndUpdate(mediaId, {
            title,
            type,
            rating,
            review,
        }, { new: true });

        if (!updatedMedia) {
            return res.status(404).json({ message: 'Media not found' });
        }

        res.status(200).json({ message: 'Media updated successfully', media: updatedMedia });
    } catch (error) {
        res.status(400).json({ message: 'Error updating media', error: error.message });
    }
};


// Delete media from a list
exports.deleteMediaFromList = async (req, res) => {
    try {
        const { mediaId, listId } = req.params;

        // Remove the media item from the list
        await List.findByIdAndUpdate(listId, { $pull: { mediaItems: mediaId } });

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
        
        // Convert tmdbId to number and validate
        const numericTmdbId = parseInt(tmdbId, 10);
        if (isNaN(numericTmdbId)) {
            return res.status(400).json({ message: 'Invalid TMDB ID format' });
        }

        // Find list with populated mediaItems
        const list = await List.findById(listId).populate('mediaItems');
        if (!list) {
            return res.status(404).json({ message: 'List not found' });
        }

        // Find media item with numeric comparison
        const media = list.mediaItems.find(item => item.tmdbId === numericTmdbId);
        if (!media) {
            return res.status(404).json({ message: 'Media not found in this list' });
        }

        // Get TMDB data
        const mediaType = media.type;
        const [detailsResponse, videosResponse, creditsResponse] = await Promise.all([
            axios.get(`${TMDB_BASE_URL}/${mediaType}/${numericTmdbId}`, {
                params: { language: 'en-US' },
                headers: { Authorization: `Bearer ${TMDB_API_KEY}` }
            }),
            axios.get(`${TMDB_BASE_URL}/${mediaType}/${numericTmdbId}/videos`, {
                headers: { Authorization: `Bearer ${TMDB_API_KEY}` }
            }),
            axios.get(`${TMDB_BASE_URL}/${mediaType}/${numericTmdbId}/credits`, {
                headers: { Authorization: `Bearer ${TMDB_API_KEY}` }
            })
        ]);

        // Process responses
        const trailer = videosResponse.data.results.find(
            video => video.site === 'YouTube' && video.type === 'Trailer'
        );

        const responseData = {
            _id: media._id,
            type: mediaType,
            rating: media.rating,
            review: media.review,
            ...detailsResponse.data,
            trailer_key: trailer?.key,
            director: creditsResponse.data.crew.find(member => member.job === 'Director')?.name,
            cast: creditsResponse.data.cast.slice(0, 5).map(actor => ({
                name: actor.name,
                character: actor.character
            }))
        };

        if (mediaType === 'tv') {
            responseData.episode_count = detailsResponse.data.number_of_episodes;
        }

        res.status(200).json(responseData);

    } catch (error) {
        console.error('Error fetching media details:', error);
        const status = error.response?.status || 500;
        res.status(status).json({ 
            message: 'Error fetching media details',
            error: error.message 
        });
    }
};



// Get 15 latest media items of a given media type for a specific user
exports.getLatestMediaByType = async (req, res) => {
  try {
    // Expect userId and mediaType from URL parameters
    const { userId, mediaType } = req.params;
    const allowedTypes = ['movie', 'tv', 'anime'];
    if (!allowedTypes.includes(mediaType)) {
      return res.status(400).json({ message: 'Invalid media type' });
    }

    // Find media items with the specified type and userId,
    // sorted by createdAt descending, limiting to 12.
    const latestMedia = await Media.find({ type: mediaType, userId: userId })
      .sort({ createdAt: -1 })
      .limit(15);

    // Enrich each media item with the list name (if listId is present)
    const enrichedMedia = await Promise.all(
      latestMedia.map(async (mediaItem) => {
        const mediaObj = mediaItem.toObject();
        // Assume mediaObj.listId holds the ID of the list this media belongs to
        if (mediaObj.listId) {
          const listDetails = await List.findById(mediaObj.listId);
          mediaObj.listname = listDetails ? listDetails.title : null;
        }
        return mediaObj;
      })
    );

    res.status(200).json(enrichedMedia);
  } catch (error) {
    console.error('Error fetching latest media by type:', error);
    res.status(500).json({
      message: 'Error fetching latest media by type',
      error: error.message
    });
  }
};

