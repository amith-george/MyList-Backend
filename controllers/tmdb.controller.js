require('dotenv').config();
const axios = require('axios');

const TMDB_API_KEY = process.env.TMDB_API_KEY; // Accessing the API key from .env
const TMDB_BASE_URL = process.env.TMDB_BASE_URL; // Accessing the base URL from .env


// Function to fetch popular movies from TMDb for search page
exports.popularMovies = async (req, res) => {
    const frontendPage = Number(req.query.page) || 1;
  
    // Calculate TMDb pages to fetch based on frontend page
    const tmdbPage1 = (frontendPage - 1) * 2 + 1;
    const tmdbPage2 = tmdbPage1 + 1;
  
    try {
      const url = `${TMDB_BASE_URL}/movie/popular`;
      console.log('Requesting TMDb pages:', tmdbPage1, 'and', tmdbPage2);
  
      const [response1, response2] = await Promise.all([
        axios.get(url, {
          params: { language: 'en-US', page: tmdbPage1 },
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${TMDB_API_KEY}`,
          },
        }),
        axios.get(url, {
          params: { language: 'en-US', page: tmdbPage2 },
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${TMDB_API_KEY}`,
          },
        }),
      ]);
  
      // Merge and deduplicate
      const combinedResults = [
        ...response1.data.results,
        ...response2.data.results,
      ];
  
      const uniqueResults = combinedResults
        .map((item) => ({ ...item, media_type: 'movie' }))
        .filter(
          (item, index, self) =>
            self.findIndex((t) => t.id === item.id) === index
        );
  
      // Return 35 results for this page, carry over 5
      const results = uniqueResults.slice(0, 35);
      const carryOver = uniqueResults.slice(35, 40); // remaining 5
  
      res.status(200).json({
        currentPage: frontendPage,
        totalPages: Math.ceil(response1.data.total_pages / 2),
        results,
        carryOver,
      });
    } catch (error) {
      console.error('Error fetching popular movies:', error);
      res.status(500).json({
        message: 'Error fetching popular movies',
        error: error.message,
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



// Function to fetch top-rated movies globally (without year filtering)
exports.topRatedMovies = async (req, res) => {
    try {
      const url = `${TMDB_BASE_URL}/movie/top_rated`;
      console.log('Requesting URL:', url);
  
      const response = await axios.get(url, {
        params: {
          language: 'en-US',
          page: 1, // First page of top-rated movies
        },
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${TMDB_API_KEY}`,
        },
      });
  
      const topMovies = response.data.results.slice(0, 15);
  
      res.status(200).json(topMovies);
    } catch (error) {
      console.error('Error details:', error);
      res.status(500).json({
        message: 'Error fetching top-rated movies',
        error: error.message,
      });
    }
  };


  exports.upcomingMovies = async (req, res) => {
    try {
      const today = new Date();
      const maxPages = 5; // Try up to 5 pages
      let page = 1;
      const collected = [];
  
      while (collected.length < 15 && page <= maxPages) {
        const url = `${TMDB_BASE_URL}/movie/upcoming`;
        console.log(`Fetching page ${page} from upcoming movies...`);
  
        const response = await axios.get(url, {
          params: {
            language: 'en-US',
            page,
          },
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${TMDB_API_KEY}`,
          },
        });
  
        // Filter future releases
        const futureOnly = response.data.results.filter((movie) => {
          const releaseDate = new Date(movie.release_date);
          return releaseDate > today;
        });
  
        collected.push(...futureOnly);
        page += 1;
  
        if (response.data.total_pages && page > response.data.total_pages) break;
      }
  
      // Sort collected movies by popularity descending
      const sorted = collected
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 15); // Take top 15
  
      res.status(200).json(sorted);
    } catch (error) {
      console.error('Error fetching upcoming movies:', error);
      res.status(500).json({
        message: 'Error fetching upcoming movies',
        error: error.message,
      });
    }
  };
  

// Function to fetch popular movies by genre (no year filtering)
exports.categoryMovies = async (req, res) => {
    const { category } = req.params;
  
    try {
      // Fetch genre list to find matching genre ID
      const genreResponse = await axios.get(`${TMDB_BASE_URL}/genre/movie/list`, {
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${TMDB_API_KEY}`,
        },
      });
  
      const genre = genreResponse.data.genres.find(
        (g) => g.name.toLowerCase() === category.toLowerCase()
      );
  
      if (!genre) {
        return res.status(404).json({ message: `Genre '${category}' not found` });
      }
  
      // Fetch popular movies in this genre
      const moviesResponse = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
        params: {
          with_genres: genre.id,
          sort_by: 'popularity.desc',
          language: 'en-US',
        },
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${TMDB_API_KEY}`,
        },
      });
  
      res.status(200).json(moviesResponse.data.results);
    } catch (error) {
      console.error('Error fetching genre movies:', error);
      res.status(500).json({
        message: `Error fetching ${category} movies`,
        error: error.message,
      });
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