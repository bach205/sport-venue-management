# MongoDB Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)

## Installation Steps

### 1. Install Required Packages

```bash
npm install mongoose bcryptjs
```

**Package Details:**
- **mongoose**: MongoDB object modeling for Node.js
- **bcryptjs**: Password hashing library for secure password storage

### 2. Configure MongoDB Connection

#### Option A: Local MongoDB
1. Install MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Start MongoDB service:
   ```bash
   # On Windows
   mongod
   
   # On macOS
   brew services start mongodb-community
   
   # On Linux
   sudo systemctl start mongod
   ```
3. Set environment variable:
   ```
   MONGODB_URI=mongodb://localhost:27017/matchill
   ```

#### Option B: MongoDB Atlas (Cloud)
1. Create account at [mongodb.com/cloud](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/matchill
   ```

### 3. Environment Variables

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Then edit `.env`:
```
MONGODB_URI=mongodb://localhost:27017/matchill
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
```

### 4. Start the Server

```bash
npm start
# or for development
npm run dev
```

## Database Models

### User (Auth)
- email (unique)
- password (hashed)
- name
- avatar
- bio
- isActive

### UserProfile
- userId (reference to User)
- name
- avatar
- bio
- phone
- location

### ChatRoom
- name
- description
- createdBy (reference to User)
- members (array of User references)
- isPrivate
- lastMessage (reference to ChatMessage)

### ChatMessage
- roomId (reference to ChatRoom)
- userId (reference to User)
- message
- attachments (array)

## Testing the API

### 1. Register User
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### 2. Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "message": "Login successful.",
  "token": "eyJhbGc...",
  "user": {
    "_id": "...",
    "email": "user@example.com"
  }
}
```

### 3. Use Token for Protected Routes
Add the token to Authorization header:
```
Authorization: Bearer eyJhbGc...
```

## Class-Based Architecture

### Services (Business Logic)
- Located in `modules/*/service.js`
- Exported as singleton instances
- Contains all database operations

### Controllers (HTTP Handlers)
- Located in `modules/*/controller.js`
- Exported as singleton instances
- Handles request/response validation

### Models (Database Schemas)
- Located in `modules/*/model.js`
- Mongoose schemas with validations
- Password hashing on save (User model)

### Routes
- Located in `modules/*/route.js`
- Express router with middleware
- Calls controller methods

## Troubleshooting

### MongoDB Connection Error
```
✗ MongoDB connection failed: connect ECONNREFUSED
```
- Ensure MongoDB is running
- Check MONGODB_URI in .env

### Duplicate Key Error
```
E11000 duplicate key error
```
- User email already exists
- Use unique email for registration

### Password Comparison Error
```
comparePassword is not a function
```
- Ensure bcryptjs is installed
- Restart the server
