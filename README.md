
# 🎬 MyList - Backend

> A full-stack media tracking and discovery REST API for managing personal watchlists of movies, TV shows, and anime, with enriched TMDb data.

---

## ⚙️ Technologies Used

- **Node.js** & **Express.js** – RESTful backend server
- **MongoDB** & **Mongoose** – NoSQL database and schema modeling
- **JWT (JSON Web Tokens)** – Secure authentication and authorization
- **TMDb API** – Enriched movie and TV metadata

---

## 📬 Contact

For questions, issues, or feature requests, feel free to reach out:

- 💻 GitHub: [github.com/amith-george](https://github.com/amith-george)
- 📧 Email: [amithgeorge130@gmail.com](mailto:amithgeorge130@gmail.com)


## 👤 User Routes (/users) 

| Endpoint                  | Method | Input                                                   | Output                                              |
| ------------------------- | ------ | ------------------------------------------------------- | --------------------------------------------------- |
| `/users/register`         | POST   | username, email, password                               | Creates a new user and default media lists          |
| `/users/login`            | POST   | email, password                                         | Returns JWT token and user info                     |
| `/users/reset-password`   | POST   | email, newPassword, confirmPassword                     | Resets the user's password                          |
| `/users/:id`              | PUT    | username, email, password, bio, avatar (requires token) | Updates user details                                |
| `/users/:id`              | DELETE | none (requires token)                                   | Deletes the user                                    |
| `/users/:id`              | GET    | none (requires token)                                   | Returns full user info                              |
| `/users/public/:username` | GET    | none                                                    | Returns public user profile (username, avatar, bio) |

## 🗂️ List Routes (/lists)

| Endpoint                        | Method | Input                      | Output                                                      |
| ------------------------------- | ------ | -------------------------- | ----------------------------------------------------------- |
| `/lists/:userId/create`         | POST   | title, description         | Creates a new list for the user                             |
| `/lists/:userId`                | GET    | none                       | Returns all lists created by the user                       |
| `/lists/:userId/:id/update`     | PUT    | title, description         | Updates the title and description of a list                 |
| `/lists/:userId/:id/delete`     | DELETE | none                       | Deletes a list and its associated media                     |
| `/lists/:userId/:listId/counts` | GET    | none                       | Returns media count in a list grouped by type (movie or tv) |
| `/lists/:userId/:id`            | GET    | page, limit (query params) | Returns a list and its media items enriched with TMDb data  |

## 🎬 Media Routes (/media)

| Endpoint                           | Method | Input                                       | Output                                                                      |
| ---------------------------------- | ------ | ------------------------------------------- | --------------------------------------------------------------------------- |
| `/media/:listId/add`               | POST   | tmdbId, title, type, rating, review, userId | Adds a media item to a specific list                                        |
| `/media/:mediaId/update`           | PUT    | title, type, rating, review                 | Updates a media item's info                                                 |
| `/media/:listId/:mediaId/delete`   | DELETE | none                                        | Deletes a media item from a list                                            |
| `/media/:listId/:tmdbId`           | GET    | none                                        | Returns full details of a media item from the list with TMDb enrichment     |
| `/media/latest/:userId/:mediaType` | GET    | none                                        | Returns 15 latest media items of a type for a user, enriched with TMDb data |

## 🎬 TMDb Routes (/tmdb)

| Endpoint                             | Method | Params / Query                             | Description                                             |
|--------------------------------------|--------|--------------------------------------------|---------------------------------------------------------|
| `/tmdb/movies/popular`               | GET    | ?page=<frontendPage>                       | Returns ~35 deduplicated popular movies                 |
| `/tmdb/movies/latest`                | GET    | —                                          | Returns 15 newly released movies (sorted by date)       |
| `/tmdb/movies/upcoming`              | GET    | —                                          | Returns 15 upcoming movies (sorted by popularity)       |
| `/tmdb/movies/top-rated`             | GET    | —                                          | Returns 15 top-rated movies globally                    |
| `/tmdb/movies/category/:category`    | GET    | :category (e.g., action, drama)            | Returns popular movies by genre                         |
| `/tmdb/tv/top-rated`                 | GET    | —                                          | Returns 15 top-rated TV shows                           |
| `/tmdb/media/search/:query`          | GET    | :query (search term)                       | Returns deduplicated search results (movie + TV)        |
| `/tmdb/:mediaType/:id`               | GET    | :mediaType (`movie` or `tv`), :id (TMDb ID)| Returns enriched media details incl. trailer, cast, etc.|
