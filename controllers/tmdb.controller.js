require('dotenv').config();
const axios = require('axios');

const TMDB_API_KEY = process.env.TMDB_API_KEY; // Accessing the API key from .env
const TMDB_BASE_URL = process.env.TMDB_BASE_URL; // Accessing the base URL from .env


// Function to fetch popular movies from TMDb
exports.popularMovies = async (req, res) => {
    // Get the starting page from the query, default to 1
    const page = Number(req.query.page) || 1;
    const secondPage = page + 1;

    try {
        const url = `${TMDB_BASE_URL}/movie/popular`;
        console.log('Requesting URL:', url, 'Pages:', page, 'and', secondPage);

        // Fetch two pages concurrently
        const [response1, response2] = await Promise.all([
            axios.get(url, {
                params: {
                    language: 'en-US',
                    page: page,
                },
                headers: {
                    accept: 'application/json',
                    Authorization: `Bearer ${TMDB_API_KEY}`
                }
            }),
            axios.get(url, {
                params: {
                    language: 'en-US',
                    page: secondPage,
                },
                headers: {
                    accept: 'application/json',
                    Authorization: `Bearer ${TMDB_API_KEY}`
                }
            })
        ]);

        // Merge results from both pages
        const combinedResults = [
            ...response1.data.results,
            ...response2.data.results
        ];

        // Add media_type and remove duplicates
        const uniqueResults = combinedResults
            .map(item => ({ ...item, media_type: 'movie' })) // Explicitly set media_type
            .filter((item, index, self) =>
                self.findIndex(t => t.id === item.id) === index
            )
            .slice(0, 36); // Limit to 36 items

        res.status(200).json({
            currentPage: page,
            totalPages: response1.data.total_pages,
            results: uniqueResults
        });
    } catch (error) {
        console.error('Error fetching popular movies:', error);
        res.status(500).json({ 
            message: 'Error fetching popular movies', 
            error: error.message 
        });
    }
};




// Function to fetch newly released movies
exports.newlyReleased = async (req, res) => {
    const page = 1; // Fetch one page of results

    try {
        const url = `${TMDB_BASE_URL}/movie/now_playing`;
        console.log('Requesting URL:', url, 'Page:', page); // Log the full URL and page number

        const response = await axios.get(url, {
            params: {
                language: 'en-US',
                page: page, // Fetch the current page
            },
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${TMDB_API_KEY}` // Use the API key as a Bearer token
            }
        });

        // Sort the movies by full release date (year-month-day) in descending order
        const sortedMovies = response.data.results.sort((a, b) => {
            const dateA = new Date(a.release_date);
            const dateB = new Date(b.release_date);
            return dateB - dateA; // Compare dates in descending order (latest first)
        });

        const newMovies = sortedMovies.slice(0, 15);

        // Return the sorted movies
        res.status(200).json(newMovies);
    } catch (error) {
        console.error('Error details:', error); // Log the error details for debugging
        res.status(500).json({ message: 'Error fetching newly released movies', error: error.message });
    }
};





// Function to fetch all movies released in the current year and the previous year, sorted by vote count with a minimum vote count
exports.topRatedMovies = async (req, res) => {
    const currentYear = new Date().getFullYear(); // Get the current year
    const previousYear = currentYear - 1; // Get the previous year
    const years = [previousYear, currentYear]; // Array of years to check
    const allMovies = []; // Array to hold all movies

    try {
        for (const year of years) {
            const url = `${TMDB_BASE_URL}/discover/movie`;
            console.log('Requesting URL:', url, 'Year:', year); // Log the full URL and year

            const response = await axios.get(url, {
                params: {
                    language: 'en-US',
                    sort_by: 'vote_count.desc', // Sort by vote count (highest first)
                    primary_release_year: year, // Filter by release year
                    page: 1 // You can adjust the page number as needed
                },
                headers: {
                    accept: 'application/json',
                    Authorization: `Bearer ${TMDB_API_KEY}` // Use the API key as a Bearer token
                }
            });

            // Add the results from the current year to the allMovies array
            allMovies.push(...response.data.results);
        }

        // Sort the combined movies by rating (vote_average) in descending order
        const sortedMovies = allMovies.sort((a, b) => b.vote_count - a.vote_count);

        // Get the first 10 movies
        const top10Movies = sortedMovies.slice(0, 15);

        res.status(200).json(top10Movies);
    } catch (error) {
        console.error('Error details:', error); // Log the error details for debugging
        res.status(500).json({ message: 'Error fetching movies for the current and previous year', error: error.message });
    }
};



// Function to fetch movies by category for the current year and the previous year
exports.categoryMovies = async (req, res) => {
    const { category } = req.params; // category should be 'action', 'comedy', or 'romance'
    const currentYear = new Date().getFullYear(); // Get the current year
    const previousYear = currentYear - 1; // Get the previous year
    const years = [previousYear, currentYear]; // Array of years to check
    const allMovies = []; // Array to hold all movies

    try {
        // Fetch genre ID based on the category
        const genreResponse = await axios.get(`${TMDB_BASE_URL}/genre/movie/list`, {
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${TMDB_API_KEY}`
            }
        });

        const genreId = genreResponse.data.genres.find(genre => genre.name.toLowerCase() === category.toLowerCase()).id;

        // Fetch movies for each year in the specified category
        for (const year of years) {
            const moviesResponse = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
                params: {
                    with_genres: genreId,
                    sort_by: 'vote_count.desc', // Sort by vote count (highest first)
                    primary_release_year: year, // Filter by release year
                    language: 'en-US'
                },
                headers: {
                    accept: 'application/json',
                    Authorization: `Bearer ${TMDB_API_KEY}`
                }
            });

            // Add the results from the current year to the allMovies array
            allMovies.push(...moviesResponse.data.results);
        }

        // Sort the combined movies by vote count in descending order
        const sortedMovies = allMovies.sort((a, b) => b.vote_count - a.vote_count);

        // Get the first 10 movies
        const top10Movies = sortedMovies.slice(0, 15);

        res.status(200).json(top10Movies);
    } catch (error) {
        console.error('Error details:', error); // Log the error details for debugging
        res.status(500).json({ message: `Error fetching ${category} movies`, error: error.message });
    }
};


// Function to fetch TV shows sorted by popularity
exports.topRatedTV = async (req, res) => {
    try {
        const url = `${TMDB_BASE_URL}/tv/top_rated`;
        console.log('Requesting URL:', url); // Log the full URL

        const response = await axios.get(url, {
            params: {
                language: 'en-US',
                page: 1
            },
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${TMDB_API_KEY}`
            }
        });

        const topTV = response.data.results.slice(0, 15);
        
        res.status(200).json(topTV);
    } catch (error) {
        console.error('Error details:', error); // Log the error details for debugging
        res.status(500).json({ message: 'Error fetching popular TV shows', error: error.message });
    }
};


// Function to search for movies based on user input
exports.searchMedia = async (req, res) => {
    const { query } = req.params;

    try {
        const url = `${TMDB_BASE_URL}/search/multi`;
        console.log('Requesting URL:', url, 'Query:', query);

        const response = await axios.get(url, {
            params: {
                language: 'en-US',
                query: query,
                page: 1,
            },
            headers: {
                accept: 'application/json',
                Authorization: `Bearer ${TMDB_API_KEY}`
            }
        });

        // Filter results to only include movies and TV shows
        const filteredResults = response.data.results.filter(item => 
            item.media_type === 'movie' || item.media_type === 'tv'
        );

        // Remove duplicates by combining ID and media_type
        const uniqueResults = filteredResults.filter(
            (item, index, self) =>
                self.findIndex(t => 
                    t.id === item.id && t.media_type === item.media_type
                ) === index
        );

        res.status(200).json(uniqueResults);
    } catch (error) {
        console.error('Error details:', error);
        res.status(500).json({ 
            message: 'Error searching media', 
            error: error.message 
        });
    }
};

// tmdbController.js
exports.getMediaDetails = async (req, res) => {
    try {
        const { mediaType, id } = req.params;
        
        // Fetch main details
        const detailsResponse = await axios.get(`${TMDB_BASE_URL}/${mediaType}/${id}`, {
            params: { language: 'en-US' },
            headers: { accept: 'application/json', Authorization: `Bearer ${TMDB_API_KEY}` }
        });

        // Fetch videos
        const videosResponse = await axios.get(`${TMDB_BASE_URL}/${mediaType}/${id}/videos`, {
            headers: { accept: 'application/json', Authorization: `Bearer ${TMDB_API_KEY}` }
        });

        // Fetch credits
        const creditsResponse = await axios.get(`${TMDB_BASE_URL}/${mediaType}/${id}/credits`, {
            headers: { accept: 'application/json', Authorization: `Bearer ${TMDB_API_KEY}` }
        });

        const trailer = videosResponse.data.results.find(
            video => video.site === 'YouTube' && video.type === 'Trailer'
        );

        const responseData = {
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
        res.status(500).json({ 
            message: 'Error fetching media details', 
            error: error.message 
        });
    }
};