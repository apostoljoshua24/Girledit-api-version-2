const fs = require("fs");
const express = require("express");
const axios = require("axios");
const path = require("path");
const app = express();
const port = 3000;

app.use(express.json());

app.get("/", async function (req, res) {
  res.sendFile(path.join(__dirname, "girledit/video.html"));
});


app.get("/docs", async function (req, res) {
res.sendFile(path.join(__dirname, "girledit/docs/docs.html"));
});

app.get("/api/add", async function (req, res) {
  res.sendFile(path.join(__dirname, "girledit/add.html"));
});

app.get("/api/link", async function (req, res) {
res.sendFile(path.join(__dirname, "girledit/GirlVids/girl.json"));
});

app.post("/api/request/f", async function (req, res) {
  const test = req.body.credits;
  
  try {
    const file = await fs.readFileSync(
      path.join(__dirname, "/girledit/GirlVids/girl.json"),
      "utf-8",
    );
    const links = JSON.parse(file);

    const link = links.girl[Math.floor(Math.random() * links.girl.length)];

    let response = await axios.get(`https://www.tikwm.com/api/?url=${link}`);
    const video = response.data.data.play;
    const username = response.data.data.author.unique_id;
    const nickname = response.data.data.author.nickname;
    const title = response.data.data.title || "No title";
    var totalvids = links.girl.length;
    res.json({
      url: video,
      username: username,
      nickname: nickname,
      title: title,
      totalvids: totalvids,
    });
  } catch (error) {
    console.error(error);
    res.json({ error: "error fetching girl api\n\n" + error });
  }
});

app.post("/api/add/girl", async function (req, res) {
  let godArray = ["61554201747411"];
  const god = req.body.uid;
  if (!godArray.includes(god)) {
      return res.json({message: "You are not authorized to use this endpoint"});
  }
  
  try {
    const link = req.body.link;
    if (!link.startsWith("https://www.tiktok.com/") && !link.startsWith("https://vt.tiktok.com/")) {
      return res.json({ message: "Invalid link" });
    }

    let filePath = path.join(__dirname, "/girledit/GirlVids/girl.json");

    if (!fs.existsSync(filePath))
      fs.writeFileSync(filePath, JSON.stringify({}));

    let data = JSON.parse(fs.readFileSync(filePath));

    if (!data["girl"]) data["girl"] = [];

    data["girl"].push(link);

    fs.writeFileSync(filePath, JSON.stringify(data, null, 4));

    res.json({ message: "Successfully added link " + link + " to random api" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
