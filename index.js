const fs = require("fs");
const express = require("express");
const axios = require("axios");
const path = require("path");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "girledit")));

// Ensure directories exist
const girlVidsDir = path.join(__dirname, "/girledit/GirlVids");
if (!fs.existsSync(girlVidsDir)) {
  fs.mkdirSync(girlVidsDir, { recursive: true });
}

// Ensure girl.json exists
const girlJsonPath = path.join(girlVidsDir, "girl.json");
if (!fs.existsSync(girlJsonPath)) {
  fs.writeFileSync(girlJsonPath, JSON.stringify({ girl: [] }, null, 2));
}

// ============ HOME PAGE ============
app.get("/", async function (req, res) {
  try {
    const htmlPath = path.join(__dirname, "girledit/video.html");
    if (fs.existsSync(htmlPath)) {
      res.sendFile(htmlPath);
    } else {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Girledit API v2</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
              .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
              h1 { color: #333; }
              .status { color: green; font-weight: bold; }
              .endpoints { list-style: none; padding: 0; }
              .endpoints li { padding: 10px; background: #f0f0f0; margin: 5px 0; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🎬 Girledit API v2</h1>
              <p class="status">✅ Server is running!</p>
              <h3>Available Endpoints:</h3>
              <ul class="endpoints">
                <li><strong>GET /</strong> - Home page</li>
                <li><strong>GET /docs</strong> - API Documentation</li>
                <li><strong>GET /api/link</strong> - Get all video links</li>
                <li><strong>POST /add</strong> - Add new video link</li>
                <li><strong>POST /api/add/girl</strong> - Add girl video (admin only)</li>
                <li><strong>POST /api/request/f</strong> - Get random girl video</li>
              </ul>
            </div>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error("Home page error:", error);
    res.status(500).json({ error: "Error loading home page" });
  }
});

// ============ DOCS PAGE ============
app.get("/docs", async function (req, res) {
  try {
    const docsPath = path.join(__dirname, "girledit/docs/docs.html");
    if (fs.existsSync(docsPath)) {
      res.sendFile(docsPath);
    } else {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>API Documentation</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
              .container { max-width: 900px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
              h1 { color: #333; }
              .endpoint { background: #f9f9f9; padding: 15px; margin: 20px 0; border-left: 4px solid #007bff; }
              .method { display: inline-block; padding: 5px 10px; border-radius: 3px; color: white; font-weight: bold; }
              .get { background: #28a745; }
              .post { background: #007bff; }
              code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>📖 Girledit API v2 - Documentation</h1>
              
              <div class="endpoint">
                <span class="method get">GET</span> <code>/api/link</code>
                <p>Get all video links in JSON format</p>
              </div>

              <div class="endpoint">
                <span class="method post">POST</span> <code>/add</code>
                <p>Add new video link</p>
                <strong>Body:</strong><pre>{ "link": "https://www.tiktok.com/..." }</pre>
              </div>

              <div class="endpoint">
                <span class="method post">POST</span> <code>/api/add/girl</code>
                <p>Add girl video (Admin only)</p>
                <strong>Body:</strong><pre>{ "uid": "61554201747411", "link": "https://www.tiktok.com/..." }</pre>
              </div>

              <div class="endpoint">
                <span class="method post">POST</span> <code>/api/request/f</code>
                <p>Get random girl video with details</p>
                <strong>Body:</strong><pre>{ "credits": true }</pre>
              </div>
            </div>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error("Docs page error:", error);
    res.status(500).json({ error: "Error loading docs" });
  }
});

// ============ ADD PAGE (HTML FORM) ============
app.get("/api/add", async function (req, res) {
  try {
    const addPath = path.join(__dirname, "girledit/add.html");
    if (fs.existsSync(addPath)) {
      res.sendFile(addPath);
    } else {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Add Video - Girledit</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
              h1 { color: #667eea; text-align: center; }
              .form-group { margin: 20px 0; }
              label { display: block; margin-bottom: 8px; color: #333; font-weight: bold; }
              input, textarea { width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px; box-sizing: border-box; }
              input:focus, textarea:focus { outline: none; border-color: #667eea; box-shadow: 0 0 5px rgba(102, 126, 234, 0.3); }
              button { width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; transition: 0.3s; }
              button:hover { background: #764ba2; }
              .success { color: green; text-align: center; }
              .error { color: red; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🎥 Add Video Link</h1>
              <form id="addForm">
                <div class="form-group">
                  <label for="link">TikTok URL:</label>
                  <input type="url" id="link" name="link" required placeholder="https://www.tiktok.com/...">
                </div>
                <button type="submit">Add Video</button>
              </form>
              <div id="message"></div>
            </div>

            <script>
              document.getElementById('addForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const link = document.getElementById('link').value;
                const messageDiv = document.getElementById('message');
                
                try {
                  const response = await fetch('/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ link })
                  });
                  
                  const data = await response.json();
                  
                  if (data.success) {
                    messageDiv.className = 'success';
                    messageDiv.textContent = '✅ ' + data.message;
                    document.getElementById('addForm').reset();
                  } else {
                    messageDiv.className = 'error';
                    messageDiv.textContent = '❌ ' + data.message;
                  }
                } catch (error) {
                  messageDiv.className = 'error';
                  messageDiv.textContent = '❌ Error: ' + error.message;
                }
              });
            </script>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error("Add page error:", error);
    res.status(500).json({ error: "Error loading add page" });
  }
});

// ============ GET ALL LINKS ============
app.get("/api/link", async function (req, res) {
  try {
    const file = await fs.readFileSync(girlJsonPath, "utf-8");
    const links = JSON.parse(file);
    res.json(links);
  } catch (error) {
    console.error("Error reading links:", error);
    res.status(500).json({ error: "Error reading links", details: error.message });
  }
});

// ============ MAIN: POST /add ENDPOINT ============
app.post("/add", async function (req, res) {
  try {
    const { link } = req.body;

    // Validation
    if (!link) {
      return res.status(400).json({
        success: false,
        message: "Link is required"
      });
    }

    // Validate TikTok link
    if (!link.startsWith("https://www.tiktok.com/") && !link.startsWith("https://vt.tiktok.com/")) {
      return res.status(400).json({
        success: false,
        message: "Invalid TikTok link. Must start with https://www.tiktok.com/ or https://vt.tiktok.com/"
      });
    }

    // Read existing data
    let data = {};
    if (fs.existsSync(girlJsonPath)) {
      data = JSON.parse(fs.readFileSync(girlJsonPath, "utf-8"));
    }

    // Initialize array if needed
    if (!data["girl"]) {
      data["girl"] = [];
    }

    // Check if link already exists
    if (data["girl"].includes(link)) {
      return res.status(400).json({
        success: false,
        message: "Link already exists"
      });
    }

    // Add link
    data["girl"].push(link);

    // Write to file
    fs.writeFileSync(girlJsonPath, JSON.stringify(data, null, 2));

    res.status(201).json({
      success: true,
      message: "Successfully added video link",
      link: link,
      totalLinks: data["girl"].length
    });

  } catch (error) {
    console.error("Error adding link:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      details: error.message
    });
  }
});

// ============ ADMIN: ADD GIRL VIDEO ============
app.post("/api/add/girl", async function (req, res) {
  try {
    const godArray = ["61554201747411"];
    const { uid, link } = req.body;

    // Authorization check
    if (!godArray.includes(uid)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to use this endpoint"
      });
    }

    // Validation
    if (!link) {
      return res.status(400).json({
        success: false,
        message: "Link is required"
      });
    }

    if (!link.startsWith("https://www.tiktok.com/") && !link.startsWith("https://vt.tiktok.com/")) {
      return res.status(400).json({
        success: false,
        message: "Invalid link. Must be a TikTok video"
      });
    }

    // Read existing data
    let data = {};
    if (fs.existsSync(girlJsonPath)) {
      data = JSON.parse(fs.readFileSync(girlJsonPath, "utf-8"));
    }

    if (!data["girl"]) data["girl"] = [];

    // Check if already exists
    if (data["girl"].includes(link)) {
      return res.status(400).json({
        success: false,
        message: "Link already exists"
      });
    }

    // Add link
    data["girl"].push(link);
    fs.writeFileSync(girlJsonPath, JSON.stringify(data, null, 2));

    res.status(201).json({
      success: true,
      message: "Successfully added girl video link",
      link: link,
      totalLinks: data["girl"].length
    });

  } catch (error) {
    console.error("Error adding girl video:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      details: error.message
    });
  }
});

// ============ GET RANDOM VIDEO ============
app.post("/api/request/f", async function (req, res) {
  try {
    const file = await fs.readFileSync(girlJsonPath, "utf-8");
    const links = JSON.parse(file);

    if (!links.girl || links.girl.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No videos available"
      });
    }

    const randomLink = links.girl[Math.floor(Math.random() * links.girl.length)];

    try {
      let response = await axios.get(`https://www.tikwm.com/api/?url=${randomLink}`);
      const video = response.data.data.play;
      const username = response.data.data.author.unique_id;
      const nickname = response.data.data.author.nickname;
      const title = response.data.data.title || "No title";
      const totalvids = links.girl.length;

      res.json({
        success: true,
        url: video,
        username: username,
        nickname: nickname,
        title: title,
        totalvids: totalvids
      });
    } catch (apiError) {
      console.error("TikTok API error:", apiError.message);
      res.status(500).json({
        success: false,
        error: "Error fetching video from TikTok API",
        details: apiError.message
      });
    }

  } catch (error) {
    console.error("Error getting random video:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching video",
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
      "GET /docs",
      "GET /api/link",
      "POST /add",
      "POST /api/add/girl",
      "POST /api/request/f"
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
  console.log(`📖 Docs: http://localhost:${port}/docs`);
  console.log(`➕ Add video: http://localhost:${port}/api/add`);
});
