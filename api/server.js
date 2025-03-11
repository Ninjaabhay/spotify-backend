const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure GOOGLE_APPLICATION_CREDENTIALS is correctly set
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error(
    "❌ GOOGLE_APPLICATION_CREDENTIALS is missing! Set it in Vercel."
  );
  process.exit(1);
}

// ✅ Decode Base64 JSON Key
const serviceAccount = JSON.parse(
  Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS, "base64").toString(
    "utf-8"
  )
);

// ✅ Google Auth Configuration
const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});

const drive = google.drive({ version: "v3", auth });

// ✅ Home Route (to test if backend is running)
app.get("/", (req, res) => {
  res.send("🎵 Sangeet Backend is running on Vercel!");
});

// ✅ Get list of playlists (Google Drive folders)
app.get("/playlists", async (req, res) => {
  try {
    const parentFolderId = "1LctVT8qLRY1lsL4dCcVTIXX2GKeGEDVP"; // Replace with your actual folder ID
    const authClient = await auth.getClient();

    const response = await drive.files.list({
      auth: authClient,
      q: `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder'`,
      fields: "files(id, name)",
    });

    const playlists = response.data.files.map((folder) => ({
      name: folder.name,
      id: folder.id,
    }));

    res.json(playlists);
  } catch (error) {
    console.error("Error fetching playlists:", error);
    res
      .status(500)
      .json({ error: "Error fetching playlists from Google Drive" });
  }
});

// ✅ Get list of songs in a selected playlist (Google Drive folder)
app.get("/playlist/:id", async (req, res) => {
  try {
    const playlistFolderId = req.params.id;
    const authClient = await auth.getClient();

    const response = await drive.files.list({
      auth: authClient,
      q: `'${playlistFolderId}' in parents and mimeType contains 'audio/mpeg'`,
      fields: "files(id, name)",
    });

    const songs = response.data.files.map((file) => ({
      name: file.name.replace(".mp3", ""),
      url: `https://drive.google.com/uc?export=download&id=${file.id}`,
    }));

    res.json(songs);
  } catch (error) {
    console.error("Error fetching songs:", error);
    res.status(500).json({ error: "Error fetching songs from Google Drive" });
  }
});

app.use(
  cors({
    origin: "*", // Allow all domains (or specify frontend URL)
    methods: ["GET"],
    allowedHeaders: ["Content-Type"],
  })
);

// 🚀 Start the Server
app.listen(PORT, () => console.log(`✅ Server running on Port: ${PORT}`));
