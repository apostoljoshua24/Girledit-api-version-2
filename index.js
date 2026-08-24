const express = require("express");
const cors = require("cors");
const { neon } = require("@neondatabase/serverless");

const app = express();
const port = process.env.PORT || 3000;

// Database Configuration
const DATABASE_URL = 'postgresql://neondb_owner:npg_XhHsS97CiPBz@ep-odd-wave-ax22muhl-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(DATABASE_URL);

// Middleware
app.use(cors());
app.use(express.json());

// ============ INITIALIZE DATABASE ============
const initializeDatabase = async () => {
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
    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("❌ Database initialization error:", error);
  }
};

// Initialize on startup
initializeDatabase();

// ============ HOME PAGE ============
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Girledit API v2</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
          .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
          h1 { color: #667eea; text-align: center; margin-bottom: 10px; }
          .status { color: green; text-align: center; font-weight: bold; margin-bottom: 30px; }
          .endpoints { list-style: none; padding: 0; }
          .endpoints li { padding: 12px; background: #f0f0f0; margin: 8px 0; border-radius: 5px; border-left: 4px solid #667eea; }
          .endpoints li strong { color: #667eea; }
          .db-info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin-top: 20px; border-left: 4px solid #2196F3; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎬 Girledit API v2 - Powered by Neon PostgreSQL</h1>
          <p class="status">✅ Server is running! | 📊 Connected to PostgreSQL Database</p>
          
          <h3>📍 Available Endpoints:</h3>
          <ul class="endpoints">
            <li><strong>GET /</strong> - Home page</li>
            <li><strong>GET /api/videos</strong> - Get all videos</li>
            <li><strong>GET /api/videos/:id</strong> - Get single video</li>
            <li><strong>POST /add</strong> - Add new video link</li>
            <li><strong>POST /api/add/girl</strong> - Add girl video (admin only)</li>
            <li><strong>POST /api/request/f</strong> - Get random girl video</li>
            <li><strong>PUT /api/videos/:id</strong> - Update video</li>
            <li><strong>DELETE /api/videos/:id</strong> - Delete video</li>
          </ul>

          <div class="db-info">
            <strong>🗄️ Database Info:</strong><br>
            Database: Neon PostgreSQL<br>
            Status: ✅ Connected<br>
            Tables: videos
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
    console.error("Error fetching videos:", error);
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
    const video = await sql`SELECT * FROM videos WHERE id = ${id}`;

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
    console.error("Error fetching video:", error);
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
        message: "Invalid TikTok link. Must start with https://www.tiktok.com/ or https://vt.tiktok.com/"
      });
    }

    // Insert into database
    const result = await sql`
      INSERT INTO videos (title, description, url, thumbnail, username, nickname)
      VALUES (${title}, ${description || null}, ${url}, ${thumbnail || 'https://via.placeholder.com/400x300?text=No+Thumbnail'}, ${username || null}, ${nickname || null})
      RETURNING *
    `;

    res.status(201).json({
      success: true,
      message: "Video added successfully",
      data: result[0]
    });

  } catch (error) {
    console.error("Error adding video:", error);
    
    // Check if it's a duplicate URL error
    if (error.message.includes("duplicate key")) {
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
        message: "You are not authorized to use this endpoint"
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
      VALUES (${title || 'Girl Video'}, ${description || null}, ${url}, ${thumbnail || 'https://via.placeholder.com/400x300?text=Girl+Video'}, ${username || null}, ${nickname || null})
      RETURNING *
    `;

    res.status(201).json({
      success: true,
      message: "Girl video added successfully",
      data: result[0]
    });

  } catch (error) {
    console.error("Error adding girl video:", error);
    
    if (error.message.includes("duplicate key")) {
      return res.status(400).json({
        success: false,
        message: "This video URL already exists"
      });
    }

    res.status(500).json({
      success: false,
      error: "Error adding girl video",
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

    // Update views
    await sql`UPDATE videos SET views = views + 1 WHERE id = ${video.id}`;

    res.json({
      success: true,
      data: video
    });

  } catch (error) {
    console.error("Error fetching random video:", error);
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
    const { title, description, url, thumbnail, username, nickname } = req.body;

    // Get current video
    const currentVideo = await sql`SELECT * FROM videos WHERE id = ${id}`;
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
        username = ${username || currentVideo[0].username},
        nickname = ${nickname || currentVideo[0].nickname},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    res.json({
      success: true,
      message: "Video updated successfully",
      data: result[0]
    });

  } catch (error) {
    console.error("Error updating video:", error);
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

    const result = await sql`DELETE FROM videos WHERE id = ${id} RETURNING *`;

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
    console.error("Error deleting video:", error);
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
    error: "Endpoint not found",
    availableEndpoints: [
      "GET /",
      "GET /api/videos",
      "GET /api/videos/:id",
      "POST /add",
      "POST /api/add/girl",
      "POST /api/request/f",
      "PUT /api/videos/:id",
      "DELETE /api/videos/:id"
    ]
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

// ============ START SERVER ============
app.listen(port, () => {
  console.log(`✅ Girledit API v2 is running on port ${port}`);
  console.log(`📍 http://localhost:${port}`);
  console.log(`🗄️ Connected to Neon PostgreSQL`);
});
