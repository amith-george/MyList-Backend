const Media = require('../models/media.model');
const axios = require('axios');
const pLimit = require('p-limit').default;

const limit = pLimit(10); // Be gentle with TMDB rate limits
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL;

exports.migrateMedia = async (req, res) => {
    try {
        // Find all media items that don't have an overview (assuming unmigrated)
        const unmigratedMedia = await Media.find({ overview: { $exists: false } });
        
        if (unmigratedMedia.length === 0) {
            return res.status(200).json({ message: 'No media items to migrate' });
        }

        console.log(`Found ${unmigratedMedia.length} media items to migrate...`);

        const migrationResults = await Promise.all(
            unmigratedMedia.map(mediaItem => limit(async () => {
                try {
                    const { tmdbId, type } = mediaItem;
                    
                    const [details, videos, credits] = await Promise.all([
                        axios.get(`${TMDB_BASE_URL}/${type}/${tmdbId}`, {
                            params: { language: 'en-US' },
                            headers: { Authorization: `Bearer ${TMDB_API_KEY}` }
                        }),
                        axios.get(`${TMDB_BASE_URL}/${type}/${tmdbId}/videos`, {
                            headers: { Authorization: `Bearer ${TMDB_API_KEY}` }
                        }),
                        axios.get(`${TMDB_BASE_URL}/${type}/${tmdbId}/credits`, {
                            headers: { Authorization: `Bearer ${TMDB_API_KEY}` }
                        })
                    ]);

                    const trailer = videos.data.results.find(
                        video => video.site === 'YouTube' && video.type === 'Trailer'
                    );

                    mediaItem.overview = details.data.overview;
                    mediaItem.release_date = details.data.release_date || details.data.first_air_date;
                    mediaItem.vote_average = details.data.vote_average;
                    mediaItem.poster_path = details.data.poster_path;
                    mediaItem.trailer_key = trailer?.key || null;
                    mediaItem.director = credits.data.crew.find(c => c.job === 'Director')?.name || null;
                    mediaItem.cast = credits.data.cast.slice(0, 5).map(actor => ({
                        name: actor.name,
                        character: actor.character
                    }));

                    if (type === 'tv') {
                        mediaItem.episode_count = details.data.number_of_episodes;
                    }

                    await mediaItem.save();
                    return { id: mediaItem._id, status: 'success' };
                } catch (err) {
                    console.error(`Failed to migrate media ID ${mediaItem._id} (TMDB ID: ${mediaItem.tmdbId})`, err.message);
                    return { id: mediaItem._id, status: 'failed', error: err.message };
                }
            }))
        );

        const successes = migrationResults.filter(r => r.status === 'success').length;
        const failures = migrationResults.filter(r => r.status === 'failed').length;

        res.status(200).json({
            message: 'Migration completed',
            total: unmigratedMedia.length,
            successes,
            failures,
            details: migrationResults.filter(r => r.status === 'failed')
        });

    } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({ message: 'Migration failed', error: error.message });
    }
};
