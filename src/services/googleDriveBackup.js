/**
 * Google Drive Backup Service
 * Uses Google Identity Services (GIS) + Drive REST API v3
 * to backup/restore Focus app data to the user's Google Drive appDataFolder.
 */

// Replace with your real Google Cloud OAuth2 Client ID
const CLIENT_ID = '693319619112-9qudji2r7dr3bpkjgd9n08kjeae2v807.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
const BACKUP_FILENAME = 'focus_backup.json';
const DRIVE_API = 'https://www.googleapis.com/';

let tokenClient = null;
let accessToken = null;

// Dynamically load the GIS SDK script
function loadGisScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

// Request an OAuth2 access token via popup
function requestAccessToken() {
  return new Promise(async (resolve, reject) => {
    try {
      await loadGisScript();

      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          accessToken = response.access_token;
          resolve(accessToken);
        },
        error_callback: (err) => {
          reject(new Error(err.message || 'OAuth error'));
        },
      });

      tokenClient.requestAccessToken();
    } catch (e) {
      reject(e);
    }
  });
}

// Ensure we have a valid token
async function ensureToken() {
  if (accessToken) return accessToken;
  return await requestAccessToken();
}

// Find existing backup file ID in appDataFolder
async function findBackupFileId(token) {
  const res = await fetch(
    `${DRIVE_API}drive/v3/files?spaces=appDataFolder&q=name='${BACKUP_FILENAME}'&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc&pageSize=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Drive list failed: ${res.status}`);
  const data = await res.json();
  return data.files?.[0] || null;
}

/**
 * Upload backup data to Google Drive appDataFolder.
 * Creates or updates focus_backup.json.
 */
export async function backupToDrive(jsonData) {
  const token = await ensureToken();
  const existing = await findBackupFileId(token);

  const metadata = {
    name: BACKUP_FILENAME,
    mimeType: 'application/json',
  };

  // Only set parents for new files (not updates)
  if (!existing) {
    metadata.parents = ['appDataFolder'];
  }

  const body = JSON.stringify(jsonData);
  const boundary = '----FocusBackupBoundary';
  const multipart =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${body}\r\n` +
    `--${boundary}--`;

  const url = existing
    ? `${DRIVE_API}upload/drive/v3/files/${existing.id}?uploadType=multipart`
    : `${DRIVE_API}upload/drive/v3/files?uploadType=multipart`;

  const method = existing ? 'PATCH' : 'POST';

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipart,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Backup upload failed: ${res.status} ${errText}`);
  }

  return await res.json();
}

/**
 * Restore backup data from Google Drive appDataFolder.
 * Downloads and parses focus_backup.json.
 */
export async function restoreFromDrive() {
  const token = await ensureToken();
  const file = await findBackupFileId(token);

  if (!file) {
    throw new Error('No backup found on Google Drive');
  }

  const res = await fetch(
    `${DRIVE_API}drive/v3/files/${file.id}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) throw new Error(`Backup download failed: ${res.status}`);

  const data = await res.json();
  return data;
}

/**
 * Check if a backup exists and return its metadata.
 * Returns { exists, modifiedTime } or { exists: false }.
 */
export async function getBackupInfo() {
  try {
    const token = await ensureToken();
    const file = await findBackupFileId(token);
    if (file) {
      return { exists: true, modifiedTime: file.modifiedTime };
    }
    return { exists: false };
  } catch (e) {
    return { exists: false, error: e.message };
  }
}

/**
 * Sign out / revoke current token.
 */
export function signOut() {
  if (accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(accessToken);
  }
  accessToken = null;
}
