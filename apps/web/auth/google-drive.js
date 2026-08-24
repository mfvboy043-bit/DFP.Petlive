(function initPetLiveGoogleDrive(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  const GIS_SRC = "https://accounts.google.com/gsi/client";
  const DRIVE_API = "https://www.googleapis.com/drive/v3";
  const TOKEN_KEY = "petlive-google-token";
  const PROFILE_KEY = "petlive-google-profile";

  let tokenClient = null;
  let gisReady = null;
  let listeners = new Set();

  function cfg() {
    return global.PETLIVE_CONFIG || {};
  }

  function clientId() {
    return String(cfg().googleClientId || "").trim();
  }

  function folderName() {
    return cfg().driveFolderName || "火龍果護照";
  }

  function fileName() {
    return cfg().driveFileName || "petlive-passport.json";
  }

  function scopes() {
    return (
      cfg().googleScopes ||
      "openid email profile https://www.googleapis.com/auth/drive.file"
    );
  }

  function notify() {
    const snap = getSession();
    listeners.forEach((fn) => {
      try {
        fn(snap);
      } catch {
        /* ignore listener errors */
      }
    });
  }

  function readStoredToken() {
    try {
      const raw = global.sessionStorage.getItem(TOKEN_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.access_token) return null;
      if (parsed.expires_at && Date.now() > parsed.expires_at - 30_000) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  function writeStoredToken(token) {
    try {
      if (!token) {
        global.sessionStorage.removeItem(TOKEN_KEY);
        return;
      }
      global.sessionStorage.setItem(TOKEN_KEY, JSON.stringify(token));
    } catch {
      /* quota / private mode */
    }
  }

  function readProfile() {
    try {
      const raw = global.sessionStorage.getItem(PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function writeProfile(profile) {
    try {
      if (!profile) global.sessionStorage.removeItem(PROFILE_KEY);
      else global.sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {
      /* ignore */
    }
  }

  function getSession() {
    const token = readStoredToken();
    const profile = readProfile();
    return {
      configured: Boolean(clientId()),
      signedIn: Boolean(token?.access_token),
      accessToken: token?.access_token || null,
      profile,
    };
  }

  function loadGis() {
    if (gisReady) return gisReady;
    gisReady = new Promise((resolve, reject) => {
      if (global.google?.accounts?.oauth2) {
        resolve();
        return;
      }
      const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () =>
          reject(new Error("GIS script failed"))
        );
        return;
      }
      const script = document.createElement("script");
      script.src = GIS_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("GIS script failed"));
      document.head.appendChild(script);
    });
    return gisReady;
  }

  async function ensureTokenClient() {
    const id = clientId();
    if (!id) {
      throw new Error("missing_client_id");
    }
    await loadGis();
    if (!tokenClient) {
      tokenClient = global.google.accounts.oauth2.initTokenClient({
        client_id: id,
        scope: scopes(),
        callback: () => {},
      });
    }
    return tokenClient;
  }

  function requestToken(prompt) {
    return ensureTokenClient().then(
      (client) =>
        new Promise((resolve, reject) => {
          client.callback = (response) => {
            if (response.error) {
              reject(new Error(response.error));
              return;
            }
            const expiresIn = Number(response.expires_in || 3600) * 1000;
            const token = {
              access_token: response.access_token,
              expires_at: Date.now() + expiresIn,
            };
            writeStoredToken(token);
            resolve(token);
          };
          client.requestAccessToken({ prompt: prompt || "" });
        })
    );
  }

  async function fetchProfile(accessToken) {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error("profile_failed");
    const data = await res.json();
    const profile = {
      email: data.email || "",
      name: data.name || "",
      picture: data.picture || "",
      sub: data.sub || "",
    };
    writeProfile(profile);
    return profile;
  }

  async function signIn() {
    const token = await requestToken("consent");
    await fetchProfile(token.access_token);
    notify();
    return getSession();
  }

  function signOut() {
    const token = readStoredToken();
    if (token?.access_token && global.google?.accounts?.oauth2) {
      try {
        global.google.accounts.oauth2.revoke(token.access_token, () => {});
      } catch {
        /* ignore */
      }
    }
    writeStoredToken(null);
    writeProfile(null);
    notify();
  }

  async function ensureAccessToken() {
    let token = readStoredToken();
    if (token?.access_token) return token.access_token;
    token = await requestToken("");
    if (!readProfile()) await fetchProfile(token.access_token);
    notify();
    return token.access_token;
  }

  async function driveFetch(path, options = {}) {
    const accessToken = await ensureAccessToken();
    const res = await fetch(`${DRIVE_API}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(options.headers || {}),
      },
    });
    if (res.status === 401) {
      writeStoredToken(null);
      throw new Error("unauthorized");
    }
    return res;
  }

  async function findFolderId() {
    const name = folderName().replace(/'/g, "\\'");
    const q = encodeURIComponent(
      `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
    );
    const res = await driveFetch(`/files?q=${q}&spaces=drive&fields=files(id,name)`);
    if (!res.ok) throw new Error("folder_list_failed");
    const data = await res.json();
    return data.files?.[0]?.id || null;
  }

  async function createFolder() {
    const res = await driveFetch("/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: folderName(),
        mimeType: "application/vnd.google-apps.folder",
      }),
    });
    if (!res.ok) throw new Error("folder_create_failed");
    const data = await res.json();
    return data.id;
  }

  async function ensureFolderId() {
    return (await findFolderId()) || (await createFolder());
  }

  async function findFileId(folderId) {
    const name = fileName().replace(/'/g, "\\'");
    const q = encodeURIComponent(
      `name='${name}' and '${folderId}' in parents and trashed=false`
    );
    const res = await driveFetch(`/files?q=${q}&spaces=drive&fields=files(id,name)`);
    if (!res.ok) throw new Error("file_list_failed");
    const data = await res.json();
    return data.files?.[0]?.id || null;
  }

  async function uploadJson(payload) {
    const folderId = await ensureFolderId();
    const existingId = await findFileId(folderId);
    const body = JSON.stringify(payload);
    const accessToken = await ensureAccessToken();

    if (existingId) {
      const res = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=media`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body,
        }
      );
      if (!res.ok) throw new Error("upload_failed");
      return res.json();
    }

    const metadata = {
      name: fileName(),
      mimeType: "application/json",
      parents: [folderId],
    };
    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    form.append("file", new Blob([body], { type: "application/json" }));

    const res = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      }
    );
    if (!res.ok) throw new Error("upload_failed");
    return res.json();
  }

  async function downloadJson() {
    const folderId = await findFolderId();
    if (!folderId) return null;
    const fileId = await findFileId(folderId);
    if (!fileId) return null;
    const res = await driveFetch(`/files/${fileId}?alt=media`);
    if (!res.ok) throw new Error("download_failed");
    return res.json();
  }

  function onSessionChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  root.auth = {
    ...(root.auth || {}),
    googleDrive: {
      getSession,
      signIn,
      signOut,
      uploadJson,
      downloadJson,
      onSessionChange,
      loadGis,
      clientId,
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
