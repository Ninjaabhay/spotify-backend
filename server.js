const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000; // Change 3000 to dynamic
const MUSIC_DIR = path.join(__dirname, "playlists");

app.use(cors());

// Get list of playlists (folders in MUSIC_DIR)
app.get("/playlists", (req, res) => {
  fs.readdir(MUSIC_DIR, (err, folders) => {
    if (err) return res.status(500).json({ error: "Error reading playlists" });
    res.json(
      folders.filter((folder) =>
        fs.statSync(path.join(MUSIC_DIR, folder)).isDirectory()
      )
    );
  });
});

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
        )}/${encodeURIComponent(file)}`, //fixed url encoding
      }));

    res.json(songs);
  });
});

// Serve song files
// app.use("/songs", express.static(MUSIC_DIR));

app.use(
  "/songs",
  express.static(MUSIC_DIR, {
    setHeaders: (res, path) => {
      if (path.endsWith(".mp3")) {
        res.setHeader("Content-Type", "audio/mpeg");
      }
    },
  })
);

app.listen(PORT, () => console.log(`Server running on Port :${PORT}`));
