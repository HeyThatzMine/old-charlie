import fs from "fs";
import path from "path";
import fetch from "node-fetch";

// Load config
const config = JSON.parse(
  fs.readFileSync(path.resolve("config.json"), "utf8")
);

const DRIVE_FOLDER_ID = config.driveFolderId;

/**
 * Public Google Drive folder scan (no API)
 * Uses Drive "folder contents" endpoint
 */
export async function scanDriveForMP3s() {
  try {
    const url =
      `https://www.googleapis.com/drive/v3/files` +
      `?q='${DRIVE_FOLDER_ID}'+in+parents+and+mimeType='audio/mpeg'` +
      `&fields=files(id,name)` +
      `&supportsAllDrives=true`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Drive request failed: ${response.status}`);
    }

    const data = await response.json();
    const files = data.files || [];

    if (!files.length) {
      console.log("⚠️ Old Charlie: No MP3 files found.");
      return [];
    }

    const playlist = files.map(file => ({
      title: file.name.replace(/\.mp3$/i, "").trim(),
      url: `https://drive.google.com/uc?export=preview&id=${file.id}`
    }));

    console.log("🎵 Old Charlie found tracks:");
    playlist.forEach(t => console.log(`- ${t.title}`));

    return playlist;

  } catch (err) {
    console.error("❌ Drive scan error:", err.message);
    return [];
  }
}
