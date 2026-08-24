const express = require("express");
const cors = require("cors");
const { neon } = require("@neondatabase/serverless");

const app = express();

// Database Configuration - Neon Serverless
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_XhHsS97CiPBz@ep-odd-wave-ax22muhl-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(DATABASE_URL);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Flag to track if DB is initialized
let dbInitialized = false;

// ============ INITIALIZE DATABASE (One-time) ============
const initializeDatabase = async () => {
  if (dbInitialized) return;
  
  try {
    // Create videos table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS videos (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        url VARCHAR(500) NOT NULL UNIQUE,
        thumbnail VARCHAR(500),
        username VARCHAR(100),
        nickname VARCHAR(100),
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    dbInitialized = true;
    console.log("✅ Database table initialized");
  } catch (error) {
    console.error("⚠️ Database initialization error:", error.message);
    // Don't throw, allow app to continue
  }
};

// Initialize on startup
initializeDatabase().catch(err => console.error("Init error:", err));

// ============ HEALTH CHECK ============
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// ============ HOME PAGE ============
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Girledit API v2</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }
          .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
          h1 { color: #667eea; text-align: center; margin-bottom: 10px; font-size: 2.5em; }
          .status { color: green; text-align: center; font-weight: bold; margin-bottom: 30px; font-size: 1.1em; }
          .endpoints { list-style: none; padding: 0; }
          .endpoints li { padding: 15px; background: #f0f0f0; margin: 10px 0; border-radius: 8px; border-left: 4px solid #667eea; transition: 0.3s; }
          .endpoints li:hover { background: #e8e8ff; transform: translateX(5px); }
          .endpoints li strong { color: #667eea; }
          .db-info { background: #e3f2fd; padding: 20px; border-radius: 8px; margin-top: 30px; border-left: 4px solid #2196F3; }
          .section-title { color: #333; font-weight: bold; margin-top: 30px; margin-bottom: 15px; font-size: 1.3em; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎬 Girledit API v2</h1>
          <p class="status">✅ Server Running | 🗄️ PostgreSQL Connected</p>
          
          <div class="section-title">📍 Available Endpoints:</div>
          <ul class="endpoints">
            <li><strong>GET /</strong> - Home page</li>
            <li><strong>GET /health</strong> - Health check</li>
            <li><strong>GET /api/videos</strong> - Get all videos</li>
            <li><strong>GET /api/videos/:id</strong> - Get single video</li>
            <li><strong>POST /add</strong> - Add new video</li>
            <li><strong>POST /api/add/girl</strong> - Add girl video (admin)</li>
            <li><strong>POST /api/request/f</strong> - Get random video</li>
            <li><strong>PUT /api/videos/:id</strong> - Update video</li>
            <li><strong>DELETE /api/videos/:id</strong> - Delete video</li>
          </ul>

          <div class="db-info">
            <strong>🗄️ Database Info:</strong><br>
            Platform: Neon PostgreSQL (Serverless)<br>
            Status: ✅ Connected<br>
            Table: videos<br>
            Hosting: Vercel
          </div>
        </div>
      </body>
    </html>
  `);
});

// ============ GET ALL VIDEOS ============
app.get("/api/videos", async (req, res) => {
  try {
    const videos = await sql`SELECT * FROM videos ORDER BY created_at DESC`;
    res.json({
      success: true,
      count: videos.length,
      data: videos
    });
  } catch (error) {
    console.error("Error fetching videos:", error.message);
    res.status(500).json({
      success: false,
      error: "Error fetching videos",
      details: error.message
    });
  }
});

// ============ GET SINGLE VIDEO ============
app.get("/api/videos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid video ID"
      });
    }

    const video = await sql`SELECT * FROM videos WHERE id = ${parseInt(id)}`;

    if (video.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Video not found"
      });
    }

    res.json({
      success: true,
      data: video[0]
    });
  } catch (error) {
    console.error("Error fetching video:", error.message);
    res.status(500).json({
      success: false,
      error: "Error fetching video",
      details: error.message
    });
  }
});

// ============ ADD VIDEO (MAIN ENDPOINT) ============
app.post("/add", async (req, res) => {
  try {
    const { title, description, url, thumbnail, username, nickname } = req.body;

    // Validation
    if (!title || !url) {
      return res.status(400).json({
        success: false,
        message: "Title and URL are required"
      });
    }

    // Validate TikTok link
    if (!url.startsWith("https://www.tiktok.com/") && !url.startsWith("https://vt.tiktok.com/")) {
      return res.status(400).json({
        success: false,
        message: "Invalid TikTok link"
      });
    }

    // Insert into database
    const result = await sql`
      INSERT INTO videos (title, description, url, thumbnail, username, nickname)
      VALUES (${title}, ${description || null}, ${url}, ${thumbnail || 'https://via.placeholder.com/400x300?text=Video'}, ${username || null}, ${nickname || null})
      RETURNING *
    `;

    res.status(201).json({
      success: true,
      message: "Video added successfully",
      data: result[0]
    });

  } catch (error) {
    console.error("Error adding video:", error.message);
    
    if (error.message.includes("duplicate")) {
      return res.status(400).json({
        success: false,
        message: "This video URL already exists"
      });
    }

    res.status(500).json({
      success: false,
      error: "Error adding video",
      details: error.message
    });
  }
});

// ============ ADD GIRL VIDEO (ADMIN) ============
app.post("/api/add/girl", async (req, res) => {
  try {
    const ADMIN_UID = "61554201747411";
    const { uid, title, description, url, thumbnail, username, nickname } = req.body;

    // Authorization
    if (uid !== ADMIN_UID) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // Validation
    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL is required"
      });
    }

    if (!url.startsWith("https://www.tiktok.com/") && !url.startsWith("https://vt.tiktok.com/")) {
      return res.status(400).json({
        success: false,
        message: "Invalid TikTok link"
      });
    }

    // Insert into database
    const result = await sql`
      INSERT INTO videos (title, description, url, thumbnail, username, nickname)
      VALUES (${title || 'Video'}, ${description || null}, ${url}, ${thumbnail || 'https://via.placeholder.com/400x300?text=Video'}, ${username || null}, ${nickname || null})
      RETURNING *
    `;

    res.status(201).json({
      success: true,
      message: "Video added successfully",
      data: result[0]
    });

  } catch (error) {
    console.error("Error adding video:", error.message);
    
    if (error.message.includes("duplicate")) {
      return res.status(400).json({
        success: false,
        message: "This video URL already exists"
      });
    }

    res.status(500).json({
      success: false,
      error: "Error adding video",
      details: error.message
    });
  }
});

// ============ GET RANDOM VIDEO ============
app.post("/api/request/f", async (req, res) => {
  try {
    const videos = await sql`SELECT * FROM videos ORDER BY RANDOM() LIMIT 1`;

    if (videos.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No videos available"
      });
    }

    const video = videos[0];

    // Update views (async, don't wait)
    sql`UPDATE videos SET views = views + 1 WHERE id = ${video.id}`.catch(err => console.error("View update error:", err));

    res.json({
      success: true,
      data: video
    });

  } catch (error) {
    console.error("Error fetching random video:", error.message);
    res.status(500).json({
      success: false,
      error: "Error fetching video",
      details: error.message
    });
  }
});

// ============ UPDATE VIDEO ============
app.put("/api/videos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, url, thumbnail } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid video ID"
      });
    }

    const videoId = parseInt(id);

    // Get current video
    const currentVideo = await sql`SELECT * FROM videos WHERE id = ${videoId}`;
    if (currentVideo.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Video not found"
      });
    }

    // Update video
    const result = await sql`
      UPDATE videos 
      SET 
        title = ${title || currentVideo[0].title},
        description = ${description !== undefined ? description : currentVideo[0].description},
        url = ${url || currentVideo[0].url},
        thumbnail = ${thumbnail || currentVideo[0].thumbnail},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${videoId}
      RETURNING *
    `;

    res.json({
      success: true,
      message: "Video updated successfully",
      data: result[0]
    });

  } catch (error) {
    console.error("Error updating video:", error.message);
    res.status(500).json({
      success: false,
      error: "Error updating video",
      details: error.message
    });
  }
});

// ============ DELETE VIDEO ============
app.delete("/api/videos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid video ID"
      });
    }

    const result = await sql`DELETE FROM videos WHERE id = ${parseInt(id)} RETURNING *`;

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Video not found"
      });
    }

    res.json({
      success: true,
      message: "Video deleted successfully",
      data: result[0]
    });

  } catch (error) {
    console.error("Error deleting video:", error.message);
    res.status(500).json({
      success: false,
      error: "Error deleting video",
      details: error.message
    });
  }
});

// ============ 404 HANDLER ============
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found"
  });
});

// ============ ERROR HANDLER ============
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: err.message
  });
});

// ============ EXPORT FOR VERCEL ============
module.exports = app;

// ============ LOCAL SERVER (for development) ============
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`✅ Girledit API v2 running on port ${port}`);
    console.log(`📍 http://localhost:${port}`);
    console.log(`🗄️ Database: Neon PostgreSQL`);
  });
}
