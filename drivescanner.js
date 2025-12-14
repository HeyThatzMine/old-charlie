import { google } from "googleapis";
import fetch from "node-fetch";
import { charliepersonality } from "./charliepersonality.js";
import fs from "fs";
import path from "path";

// Loads config
const config = JSON.parse(
  fs.readFileSync(path.resolve("config.json"), "utf8")
);

const DRIVE_FOLDER_ID = config.driveFolderId;

// Google Drive client setup (no auth needed for public folder)
const drive = google.drive({
  version: "v3",
  auth: undefined
});

export async function scanDriveForMP3s() {
  try {
    const response = await drive.files.list({
      q: `'${DRIVE_FOLDER_ID}' in parents and mimeType='audio/mpeg'`,
      fields: "files(id, name)"
    });

    const files = response.data.files || [];

    if (!files.length) {
      console.log("⚠️ Old Charlie: No MP3 files found in the Drive folder.");
      return [];
    }

    // Convert file IDs into preview streaming URLs
    const playlist = files.map(file => ({
      title: file.name.replace(".mp3", "").trim(),
      url: `https://drive.google.com/uc?export=preview&id=${file.id}`
    };

    console.log("🎵 Old Charlie found the following tracks:");
    playlist.forEach(track => console.log(`- ${track.title}`));

    return playlist;

  } catch (err) {
    console.error("❌ Error scanning Google Drive:", err.message);
    return [];
  }
};
