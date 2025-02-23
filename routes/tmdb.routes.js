const express = require('express');
const router = express.Router();
const tmdbController = require('../controllers/tmdb.controller');

router.get('/movies/popular', tmdbController.popularMovies);

router.get('/movies/latest', tmdbController.newlyReleased);

router.get('/movies/top-rated', tmdbController.topRatedMovies);

router.get('/movies/category/:category', tmdbController.categoryMovies);

router.get('/tv/top-rated', tmdbController.topRatedTV);

router.get('/media/search/:query', tmdbController.searchMedia);

router.get('/:mediaType/:id', tmdbController.getMediaDetails);

module.exports = router;