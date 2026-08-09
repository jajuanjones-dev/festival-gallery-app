import { google } from "googleapis";

// Auth is a service account, not your personal Google login - it's a
// machine identity you share a specific Drive folder with, so the server
// can read that folder without you signing in each time.
function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "";
  // Env vars can't store real line breaks, so the .env file keeps literal
  // "\n" sequences - swap them back into actual newlines here.
  const key = rawKey.replace(/\\n/g, "\n");

  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
}

function getDriveClient() {
  return google.drive({ version: "v3", auth: getAuth() });
}

// Lists image files sitting in the configured sync folder, newest first.
// This is the folder your phone's Google Drive/Photos auto-backup should
// point at.
export async function listFolderImages() {
  const drive = getDriveClient();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  const res = await drive.files.list({
    q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
    fields: "files(id, name, mimeType, createdTime, thumbnailLink)",
    orderBy: "createdTime desc",
    pageSize: 200,
  });

  return res.data.files || [];
}

// Downloads the raw bytes of a single Drive file - used when publishing a
// photo, to pull the original before generating the preview + full-res
// versions.
export async function downloadFile(fileId) {
  const drive = getDriveClient();
  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" }
  );
  return Buffer.from(res.data);
}
