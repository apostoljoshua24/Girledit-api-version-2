# 🎬 Girledit API v2

A powerful Express.js API for managing TikTok video links with a beautiful web interface.

## Features

✅ **Complete /add endpoint** - Add TikTok videos  
✅ **No errors** - Full error handling  
✅ **CORS enabled** - Cross-origin requests supported  
✅ **Beautiful UI** - Auto-generated HTML pages  
✅ **Admin controls** - Authorized video management  
✅ **Random video fetching** - Get random videos with full details

## Installation

```bash
npm install
```

## Running the Server

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

Server will run on `http://localhost:3000`

## API Endpoints

### 1. Home Page
```
GET /
```
Returns the home page with all available endpoints.

### 2. Documentation
```
GET /docs
```
Full API documentation in browser.

### 3. Add Video Page (HTML Form)
```
GET /api/add
```
Beautiful web form to add TikTok videos.

### 4. Get All Links
```
GET /api/link
```
Returns all video links in JSON format.

**Response:**
```json
{
  "girl": ["https://www.tiktok.com/...", "https://vt.tiktok.com/..."]
}
```

### 5. Add Video Link ⭐ (Main Endpoint)
```
POST /add
Content-Type: application/json

{
  "link": "https://www.tiktok.com/v/7123456789"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Successfully added video link",
  "link": "https://www.tiktok.com/v/7123456789",
  "totalLinks": 42
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid TikTok link. Must start with https://www.tiktok.com/ or https://vt.tiktok.com/"
}
```

### 6. Admin: Add Girl Video
```
POST /api/add/girl
Content-Type: application/json

{
  "uid": "61554201747411",
  "link": "https://www.tiktok.com/v/7123456789"
}
```

**Requires authorization UID**: `61554201747411`

### 7. Get Random Video with Details
```
POST /api/request/f
Content-Type: application/json

{
  "credits": true
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://..../video.mp4",
  "username": "tiktok_user",
  "nickname": "User Nickname",
  "title": "Video Title",
  "totalvids": 42
}
```

## Testing the API

### Using cURL

**Add a video:**
```bash
curl -X POST http://localhost:3000/add \
  -H "Content-Type: application/json" \
  -d '{"link":"https://www.tiktok.com/v/7123456789"}'
```

**Get all links:**
```bash
curl http://localhost:3000/api/link
```

**Get random video:**
```bash
curl -X POST http://localhost:3000/api/request/f \
  -H "Content-Type: application/json" \
  -d '{"credits":true}'
```

### Using Postman

1. Import the endpoints above
2. Set `Content-Type: application/json` for POST requests
3. Test each endpoint

## File Structure

```
Girledit-api-version-2/
├── index.js                 # Main API server
├── package.json            # Dependencies
├── .env                    # Environment variables
├── .gitignore             # Git ignore rules
├── README.md              # This file
└── girledit/
    └── GirlVids/
        └── girl.json      # Video links storage (auto-created)
```

## Error Handling

All endpoints include comprehensive error handling:

- ✅ Validation errors (400)
- ✅ Authorization errors (403)
- ✅ Not found errors (404)
- ✅ Server errors (500)
- ✅ Detailed error messages

## Environment Variables

Create a `.env` file:

```env
PORT=3000
NODE_ENV=development
```

## Dependencies

- **express** - Web framework
- **axios** - HTTP client for TikTok API
- **cors** - Cross-origin resource sharing
- **nodemon** (dev) - Auto-reload server

## Future Improvements

🚀 Add video metadata caching  
🚀 Add database integration (MongoDB)  
🚀 Add user authentication  
🚀 Add video statistics/analytics  
🚀 Add video deletion endpoint  
🚀 Add search/filter functionality

## License

ISC

---

**Made with ❤️ for Girledit**
