# Project Structure

This document describes the directory structure of the Matchill backend and the purpose of each component.

## Root Directory
- `app.js`: Initializes the Express application and attaches core middlewares.
- `server.js`: The application entry point. It connects to the database, initializes the socket server, and starts the HTTP server.
- `route.v1.js`: The main router for API version 1. It aggregates routes from all modules.
- `.env`: Contains sensitive environment variables like database URIs and JWT secrets.
- `package.json`: Manages project dependencies and defines npm scripts.

## /docs
Contains technical documentation, including:
- `database.md`: Collection schemas and entity relationships.
- `project_structure.md`: This file.

## /src
The main source code directory.

### /configs
Global configuration files for external services.
- `db.js`: MongoDB connection logic using Mongoose.
- `redis.js`: Redis connection configuration (currently a mock).
- `socket.js`: Socket.io server initialization.

### /constants
Static values used throughout the application, such as HTTP status codes and socket event names.

### /middlewares
Custom Express middlewares.
- `auth.middleware.js`: Verifies JWT tokens and attaches user data to requests.
- `error.middleware.js`: Centralized error handler for all routes.

### /modules
The core business logic, organized by feature. Each module typically contains:
- `model.js`: Mongoose schema definitions.
- `service.js`: Reusable business logic and database operations.
- `controller.js`: Request handling and response formatting.
- `route.js`: Module-specific route definitions.

**Existing Modules:**
- `user`: Handles user accounts, roles, and profiles.
- `auth`: Manages registration and login processes.
- `chat`: Implements messaging, conversations, and participants.
- `matching`: Facilitates match requests and partner discovery.
- `social`: Manages posts, comments, and likes.
- `venue`: Handles sports facilities, booking slots, and payments.

### /sockets
Socket.io event handlers for real-time features like chat notifications.

### /utils
Shared helper functions.
- `jwt.js`: Utility for signing and verifying JSON Web Tokens.
- `asyncHandler.js`: Wrapper for async Express routes to catch errors automatically.

### /validations
Logic for validating incoming request payloads, ensuring data integrity before processing.
