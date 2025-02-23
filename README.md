# API Documentation

This document details the API endpoints for managing users, lists, media items, and TMDB data. Each section includes a description of the available endpoints, expected request parameters, sample request/response bodies, and error messages.

---

## User Routes

This section covers user-related functionality such as registration, login, password reset, retrieving user details, updating user data, and deleting a user account. Protected endpoints require a valid JWT token in the `Authorization` header.

### Endpoints

#### 1. **POST /users/register**

- **Description**:  
  Registers a new user by accepting a username, email, and password. The password is hashed before storage, and default lists are created for the user.
  
- **Request Body Example**:
  ```json
  {
    "username": "johnDoe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```
  
- **Successful Response**:
  - **Status Code**: `201 Created`
  - **Body**:
    ```json
    {
      "message": "User created successfully",
      "user": {
        "_id": "60eebc123abc1234567890",
        "username": "johnDoe",
        "email": "john@example.com",
        "lists": ["listId1", "listId2", "listId3", "listId4"]
      }
    }
    ```
  
- **Error Response**:
  - **Status Code**: `400 Bad Request`
  - **Body**:
    ```json
    {
      "message": "Error creating user",
      "error": "Detailed error message"
    }
    ```

---

#### 2. **POST /users/login**

- **Description**:  
  Authenticates a user by validating the email and password. On success, returns a JWT token to be used for subsequent requests.
  
- **Request Body Example**:
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
  
- **Successful Response**:
  - **Status Code**: `200 OK`
  - **Body**:
    ```json
    {
      "message": "Login successful",
      "token": "JWT_TOKEN_HERE",
      "user": {
        "username": "johnDoe",
        "email": "john@example.com"
      }
    }
    ```
  
- **Error Response**:
  - **Status Code**: `401 Unauthorized`
  - **Body**:
    ```json
    {
      "message": "Invalid email or password"
    }
    ```

---

#### 3. **PUT /users/reset-password**

- **Description**:  
  Resets the user’s password. The request must provide the user’s email, the new password, and a confirmation.
  
- **Request Body Example**:
  ```json
  {
    "email": "john@example.com",
    "newPassword": "newPassword123",
    "confirmPassword": "newPassword123"
  }
  ```
  
- **Successful Response**:
  - **Status Code**: `200 OK`
  - **Body**:
    ```json
    {
      "message": "Password reset successfully",
      "user": { /* user details excluding password */ }
    }
    ```
  
- **Error Response**:
  - **Status Code**: `500 Internal Server Error`
  - **Body**:
    ```json
    {
      "message": "Error resetting password",
      "error": "Detailed error message"
    }
    ```

---

#### 4. **GET /users/:id**

- **Description**:  
  Retrieves detailed information about a user by their unique ID. Requires a valid JWT token.
  
- **Headers**:
  ```
  Authorization: Bearer JWT_TOKEN_HERE
  ```
  
- **Successful Response**:
  - **Status Code**: `200 OK`
  - **Body**:
    ```json
    {
      "_id": "60eebc123abc1234567890",
      "username": "johnDoe",
      "email": "john@example.com",
      "lists": ["listId1", "listId2", "listId3", "listId4"]
    }
    ```
  
- **Error Response**:
  - **Status Code**: `404 Not Found`
  - **Body**:
    ```json
    {
      "message": "User not found"
    }
    ```

---

#### 5. **PUT /users/:id**

- **Description**:  
  Updates user details such as username, email, password, or bio. Requires authentication.
  
- **Headers**:
  ```
  Authorization: Bearer JWT_TOKEN_HERE
  ```
  
- **Request Body Example**:
  ```json
  {
    "username": "johnUpdated",
    "email": "john_new@example.com",
    "password": "newPassword123",
    "bio": "New bio information"
  }
  ```
  
- **Successful Response**:
  - **Status Code**: `200 OK`
  - **Body**:
    ```json
    {
      "message": "User updated successfully",
      "user": {
        "_id": "60eebc123abc1234567890",
        "username": "johnUpdated",
        "email": "john_new@example.com",
        "lists": ["listId1", "listId2", "listId3", "listId4"]
      }
    }
    ```
  
- **Error Response**:
  - **Status Code**: `404 Not Found`
  - **Body**:
    ```json
    {
      "message": "User not found"
    }
    ```

---

#### 6. **DELETE /users/:id**

- **Description**:  
  Deletes a user account by ID. Requires a valid JWT token.
  
- **Headers**:
  ```
  Authorization: Bearer JWT_TOKEN_HERE
  ```
  
- **Successful Response**:
  - **Status Code**: `200 OK`
  - **Body**:
    ```json
    {
      "message": "User deleted successfully"
    }
    ```
  
- **Error Response**:
  - **Status Code**: `404 Not Found`
  - **Body**:
    ```json
    {
      "message": "User not found"
    }
    ```

---

## List Routes

This section manages user-created lists. Each list is associated with a specific user and can hold multiple media items. Endpoints allow you to create, retrieve, update, and delete lists, as well as obtain media counts by type for a list.

### Endpoints

#### 1. **POST /lists/:userId**

- **Description**:  
  Creates a new list for the specified user.
  
- **URL Parameter**:
  - `userId`: The ID of the user creating the list.
  
- **Request Body Example**:
  ```json
  {
    "title": "My Favorite Movies",
    "description": "A list of my top movies."
  }
  ```
  
- **Successful Response**:
  - **Status Code**: `201 Created`
  - **Body**:
    ```json
    {
      "message": "List created successfully",
      "list": {
        "_id": "60eebc123abc1234567890",
        "title": "My Favorite Movies",
        "description": "A list of my top movies.",
        "user": "userId",
        "mediaItems": [],
        "createdAt": "2020-12-15T15:30:00.000Z"
      }
    }
    ```
  
- **Error Response**:
  - **Status Code**: `400 Bad Request`
  - **Body**:
    ```json
    {
      "message": "Error creating list",
      "error": "Detailed error message"
    }
    ```

---

#### 2. **GET /lists/user/:userId**

- **Description**:  
  Retrieves all lists associated with a specific user.
  
- **URL Parameter**:
  - `userId`: The user's ID.
  
- **Successful Response**:
  - **Status Code**: `200 OK`
  - **Body**:
    ```json
    [
      {
        "_id": "listId1",
        "title": "Completed",
        "description": "Your completed movies or TV shows.",
        "user": "userId",
        "mediaItems": [],
        "createdAt": "2020-12-15T15:30:00.000Z"
      },
      {
        "_id": "listId2",
        "title": "Currently Watching",
        "description": "Movies or TV shows you are currently watching.",
        "user": "userId",
        "mediaItems": [],
        "createdAt": "2020-12-15T15:30:00.000Z"
      }
      // More lists...
    ]
    ```
  
- **Error Response**:
  ```json
  {
    "message": "Error fetching lists",
    "error": "Detailed error message"
  }
  ```

---

#### 3. **GET /lists/:userId/:id**

- **Description**:  
  Retrieves a specific list by its ID, after verifying it belongs to the user. This endpoint populates the list’s media items.
  
- **URL Parameters**:
  - `userId`: The user’s ID.
  - `id`: The list’s ID.
  
- **Headers**:
  ```
  Authorization: Bearer JWT_TOKEN_HERE
  ```
  
- **Successful Response**:
  - **Status Code**: `200 OK`
  - **Body**:
    ```json
    {
      "_id": "listId",
      "title": "My Favorite Movies",
      "description": "A list of my top movies.",
      "user": "userId",
      "mediaItems": [ /* array of media items */ ],
      "createdAt": "2020-12-15T15:30:00.000Z"
    }
    ```
  
- **Error Response**:
  ```json
  {
    "message": "List not found"
  }
  ```

---

#### 4. **PUT /lists/:userId/:id**

- **Description**:  
  Updates a list’s title and/or description after confirming the list is associated with the user.
  
- **URL Parameters**:
  - `userId`: The user’s ID.
  - `id`: The list’s ID.
  
- **Headers**:
  ```
  Authorization: Bearer JWT_TOKEN_HERE
  ```
  
- **Request Body Example**:
  ```json
  {
    "title": "Updated List Title",
    "description": "Updated description for the list."
  }
  ```
  
- **Successful Response**:
  - **Status Code**: `200 OK`
  - **Body**:
    ```json
    {
      "message": "List updated successfully",
      "list": {
        "_id": "listId",
        "title": "Updated List Title",
        "description": "Updated description for the list.",
        "user": "userId",
        "mediaItems": [],
        "createdAt": "2020-12-15T15:30:00.000Z"
      }
    }
    ```
  
- **Error Response**:
  ```json
  {
    "message": "List not found"
  }
  ```

---

#### 5. **DELETE /lists/:userId/:id**

- **Description**:  
  Deletes a list (and its associated media items) after verifying ownership.
  
- **URL Parameters**:
  - `userId`: The user’s ID.
  - `id`: The list’s ID.
  
- **Headers**:
  ```
  Authorization: Bearer JWT_TOKEN_HERE
  ```
  
- **Successful Response**:
  - **Status Code**: `200 OK`
  - **Body**:
    ```json
    {
      "message": "List and associated media deleted successfully"
    }
    ```
  
- **Error Response**:
  ```json
  {
    "message": "List not found"
  }
  ```

---

#### 6. **GET /lists/:userId/:listId/media-count**

- **Description**:  
  Retrieves counts of media items by type (e.g., movie, tv, anime) for a specified list.
  
- **URL Parameters**:
  - `userId`: The user’s ID.
  - `listId`: The list’s ID.
  
- **Successful Response**:
  - **Status Code**: `200 OK`
  - **Body**:
    ```json
    {
      "message": "Media counts retrieved successfully",
      "counts": {
        "movie": 5,
        "tv": 3,
        "anime": 2
      }
    }
    ```
  
- **Error Response**:
  ```json
  {
    "message": "Error retrieving media counts",
    "error": "Detailed error message"
  }
  ```

---

## Media Routes

This section handles operations related to media items stored in user lists. Endpoints allow you to add, update, delete, and fetch details of media items, as well as retrieve the latest media entries by type.

### Endpoints

#### 1. **POST /media/:listId/add**

- **Description**:  
  Adds a media item (movie, TV show, or anime) to a specific list.
  
- **URL Parameter**:
  - `listId`: The ID of the list.
  
- **Request Body Example**:
  ```json
  {
    "tmdbId": 12345,
    "title": "Example Movie",
    "type": "movie",
    "rating": 8.5,
    "review": "Great movie!",
    "userId": "userId"
  }
  ```
  
- **Successful Response**:
  - **Status Code**: `201 Created`
  - **Body**:
    ```json
    {
      "message": "Media added to list successfully",
      "media": {
        "_id": "mediaId",
        "tmdbId": 12345,
        "title": "Example Movie",
        "type": "movie",
        "rating": 8.5,
        "review": "Great movie!"
      }
    }
    ```
  
- **Error Response**:
  ```json
  {
    "message": "Media already exists in this list"
  }
  ```

---

#### 2. **PUT /media/:mediaId/update**

- **Description**:  
  Updates details of an existing media item in a list.
  
- **URL Parameter**:
  - `mediaId`: The ID of the media item.
  
- **Request Body Example**:
  ```json
  {
    "title": "Updated Movie Title",
    "type": "movie",
    "rating": 9.0,
    "review": "An even better movie after rewatching!"
  }
  ```
  
- **Successful Response**:
  - **Status Code**: `200 OK`
  - **Body**:
    ```json
    {
      "message": "Media updated successfully",
      "media": {
        "_id": "mediaId",
        "tmdbId": 12345,
        "title": "Updated Movie Title",
        "type": "movie",
        "rating": 9.0,
        "review": "An even better movie after rewatching!"
      }
    }
    ```
  
- **Error Response**:
  ```json
  {
    "message": "Media not found"
  }
  ```

---

#### 3. **DELETE /media/:listId/:mediaId/delete**

- **Description**:  
  Deletes a media item from a list and removes it from the database.
  
- **URL Parameters**:
  - `listId`: The ID of the list.
  - `mediaId`: The ID of the media item.
  
- **Successful Response**:
  - **Status Code**: `200 OK`
  - **Body**:
    ```json
    {
      "message": "Media deleted successfully"
    }
    ```
  
- **Error Response**:
  ```json
  {
    "message": "Media not found"
  }
  ```

---

#### 4. **GET /media/:listId/:tmdbId**

- **Description**:  
  Retrieves details of a specific media item stored in the database. The response is enriched with TMDB data (e.g., trailer, director, cast).
  
- **URL Parameters**:
  - `listId`: The ID of the list.
  - `tmdbId`: The TMDB ID of the media item.
  
- **Successful Response**:
  - **Status Code**: `200 OK`
  - **Body**:
    ```json
    {
      "_id": "mediaId",
      "tmdbId": 12345,
      "title": "Example Movie",
      "type": "movie",
      "rating": 8.5,
      "review": "Great movie!",
      "trailer_key": "YOUTUBE_TRAILER_KEY",
      "director": "Director Name",
      "cast": [
        { "name": "Actor 1", "character": "Character 1" },
        { "name": "Actor 2", "character": "Character 2" }
      ]
    }
    ```
  
- **Error Response**:
  ```json
  {
    "message": "Media not found in this list"
  }
  ```

---

#### 5. **GET /media/:userId/:mediaType/latest**

- **Description**:  
  Retrieves the 15 latest media items of a given type (movie, tv, or anime) for a specific user. Each media item is enriched with the name of its associated list.
  
- **URL Parameters**:
  - `userId`: The user's ID.
  - `mediaType`: The type of media (e.g., `movie`, `tv`, `anime`).
  
- **Successful Response**:
  - **Status Code**: `200 OK`
  - **Body**:
    ```json
    [
      {
        "_id": "mediaId",
        "tmdbId": 12345,
        "title": "Example Movie",
        "type": "movie",
        "rating": 8.5,
        "review": "Great movie!",
        "listname": "My Favorite Movies",
        "createdAt": "2020-12-15T15:30:00.000Z"
      }
      // More media items...
    ]
    ```
  
- **Error Response**:
  ```json
  {
    "message": "Error fetching latest media by type",
    "error": "Detailed error message"
  }
  ```

---

## TMDB Routes

This section interacts with The Movie Database (TMDB) API. Endpoints fetch popular movies, newly released films, top-rated movies (from the current and previous year), movies by category, popular TV shows, and also include a search functionality. Additionally, detailed media information can be retrieved directly from TMDB.

### Endpoints

#### 1. **GET /movies/popular**

- **Description**:  
  Fetches popular movies by merging two pages of TMDB results, explicitly setting the media type to "movie" and removing duplicates. Results are limited to 36 items.
  
- **Query Parameters**:
  - `page` (optional): The starting page (defaults to 1).
  
- **Successful Response**:
  - **Status Code**: `200 OK`
  - **Body**:
    ```json
    {
      "currentPage": 1,
      "totalPages": 500,
      "results": [
        {
          "id": 12345,
          "title": "Popular Movie 1",
          "release_date": "2025-01-01",
          "media_type": "movie"
        }
        // Up to 36 movies...
      ]
    }
    ```
  
- **Error Response**:
  ```json
  {
    "message": "Error fetching popular movies",
    "error": "Detailed error message"
  }
  ```

---

#### 2. **GET /movies/latest**

- **Description**:  
  Retrieves newly released movies (now playing) sorted by release date in descending order. Only the latest 15 movies are returned.
  
- **Successful Response**:
  - **Status Code**: `200 OK`
  - **Body**:
    ```json
    [
      {
        "id": 12345,
        "title": "New Movie 1",
        "release_date": "2025-02-10",
        "overview": "This is a new movie description"
      }
      // Up to 15 movies...
    ]
    ```
  
- **Error Response**:
  ```json
  {
    "message": "Error fetching newly released movies",
    "error": "Detailed error message"
  }
  ```

---

#### 3. **GET /movies/top-rated**

- **Description**:  
  Fetches top-rated movies from both the current and previous year, sorted by vote count. Only the top 15 movies are returned.
  
- **Successful Response**:
  - **Status Code**: `200 OK`
  - **Body**:
    ```json
    [
      {
        "id": 12345,
        "title": "Top Rated Movie 1",
        "release_date": "2024-10-15",
        "vote_count": 1000,
        "vote_average": 8.5
      }
      // Up to 15 movies...
    ]
    ```
  
- **Error Response**:
  ```json
  {
    "message": "Error fetching movies for the current and previous year",
    "error": "Detailed error message"
  }
  ```

---

#### 4. **GET /movies/category/:category**

- **Description**:  
  Retrieves movies for a specific category (e.g., action, comedy, romance) from the current and previous year, sorted by vote count. Only the top 15 movies are returned.
  
- **URL Parameter**:
  - `category`: The movie genre.
  
- **Successful Response**:
  - **Status Code**: `200 OK`
  - **Body**:
    ```json
    [
      {
        "id": 12345,
        "title": "Action Movie 1",
        "release_date": "2024-05-20",
        "vote_count": 800,
        "vote_average": 7.8
      }
      // Up to 15 movies...
    ]
    ```
  
- **Error Response**:
  ```json
  {
    "message": "Error fetching action movies",
    "error": "Detailed error message"
  }
  ```

---

#### 5. **GET /tv/top-rated**

- **Description**:  
  Retrieves the top-rated TV shows from TMDB, sorted by popularity. Only the top 15 TV shows are returned.
  
- **Successful Response**:
  - **Status Code**: `200 OK`
  - **Body**:
    ```json
    [
      {
        "id": 12345,
        "title": "Top Rated TV Show 1",
        "release_date": "2024-03-15",
        "vote_count": 1000,
        "vote_average": 9.2
      }
      // Up to 15 TV shows...
    ]
    ```
  
- **Error Response**:
  ```json
  {
    "message": "Error fetching popular TV shows",
    "error": "Detailed error message"
  }
  ```

---

#### 6. **GET /movies/search/:query**

- **Description**:  
  Searches TMDB for movies and TV shows based on a given query string. Returns unique results filtered by media type.
  
- **URL Parameter**:
  - `query`: The search term.
  
- **Successful Response**:
  - **Status Code**: `200 OK`
  - **Body**:
    ```json
    [
      {
        "id": 12345,
        "title": "Inception",
        "release_date": "2010-07-16",
        "overview": "A mind-bending thriller",
        "media_type": "movie"
      }
      // More search results...
    ]
    ```
  
- **Error Response**:
  ```json
  {
    "message": "Error searching media",
    "error": "Detailed error message"
  }
  ```

---

#### 7. **GET /tmdb/:mediaType/:id**

- **Description**:  
  Fetches detailed information directly from TMDB for the specified media type (movie or tv) and TMDB ID. The response includes details such as a trailer key, director, cast, and—for TV shows—the episode count.
  
- **URL Parameters**:
  - `mediaType`: The type of media (`movie` or `tv`).
  - `id`: The TMDB ID of the media.
  
- **Successful Response**:
  - **Status Code**: `200 OK`
  - **Body**:
    ```json
    {
      "id": 12345,
      "title": "Example Title",
      "release_date": "2025-01-01",
      "overview": "Detailed overview of the media",
      "trailer_key": "YOUTUBE_TRAILER_KEY",
      "director": "Director Name",
      "cast": [
        { "name": "Actor 1", "character": "Character 1" },
        { "name": "Actor 2", "character": "Character 2" }
      ],
      "episode_count": 10
    }
    ```
    > *Note: The `episode_count` field is included only if `mediaType` is `tv`.*
  
- **Error Response**:
  ```json
  {
    "message": "Error fetching media details",
    "error": "Detailed error message"
  }
  ```

---

