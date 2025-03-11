const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// ❌ Vercel does NOT persist local files, so local music storage won't work
// ✅ You should host songs on an external platform (e.g., Firebase, S3, GitHub)
const MUSIC_DIR = path.join(__dirname, "playlists");

app.use(cors());

// ✅ Add a test route to confirm the backend is running
app.get("/", (req, res) => {
  res.send("🎵 Spotify Backend is running on Vercel!");
});

// ✅ Get list of playlists (Folders in `playlists/`)
app.get("/playlists", (req, res) => {
  fs.readdir(MUSIC_DIR, (err, folders) => {
    if (err) return res.status(500).json({ error: "Error reading playlists" });

    // ❌ This won't work on Vercel (Vercel does NOT keep local files)
    res.json(
      folders.filter((folder) =>
        fs.statSync(path.join(MUSIC_DIR, folder)).isDirectory()
      )
    );
  });
});

// ✅ Get songs inside a playlist
app.get("/playlist/:name", (req, res) => {
  const playlistPath = path.join(MUSIC_DIR, req.params.name);
  fs.readdir(playlistPath, (err, files) => {
    if (err) return res.status(500).json({ error: "Error reading playlist" });

    const songs = files
      .filter((file) => file.endsWith(".mp3"))
      .map((file) => ({
        name: path.parse(file).name,
        url: `${req.protocol}://${req.get("host")}/songs/${encodeURIComponent(
          req.params.name
        )}/${encodeURIComponent(file)}`, // Encoded URL
      }));

    res.json(songs);
  });
});

// ❌ This will NOT work on Vercel because local files are deleted
// ✅ Instead, you should store songs in S3, Firebase Storage, or GitHub
app.use(
  "/songs",
  express.static(MUSIC_DIR, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".mp3")) {
        res.setHeader("Content-Type", "audio/mpeg");
      }
    },
  })
);

app.listen(PORT, () => console.log(`✅ Server running on Port: ${PORT}`));
