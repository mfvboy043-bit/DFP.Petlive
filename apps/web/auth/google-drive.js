(function initPetLiveGoogleDrive(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  const GIS_SRC = "https://accounts.google.com/gsi/client";
  const DRIVE_API = "https://www.googleapis.com/drive/v3";
  const TOKEN_KEY = "petlive-google-token";
  const PROFILE_KEY = "petlive-google-profile";

  let driveTokenClient = null;
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

  function allScopes() {
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

  async function ensureDriveClient() {
    const id = clientId();
    if (!id) throw new Error("missing_client_id");
    await loadGis();
    if (!driveTokenClient) {
      driveTokenClient = global.google.accounts.oauth2.initTokenClient({
        client_id: id,
        scope: allScopes(),
        callback: () => {},
      });
    }
    return driveTokenClient;
  }

  function requestTokenFrom(clientPromise, prompt) {
    return clientPromise.then(
      (client) =>
        new Promise((resolve, reject) => {
          let settled = false;
          let timer = null;
          const finish = (fn, value) => {
            if (settled) return;
            settled = true;
            if (timer) {
              global.clearTimeout(timer);
              timer = null;
            }
            fn(value);
          };
          client.callback = (response) => {
            if (response.error) {
              finish(reject, new Error(response.error));
              return;
            }
            if (!response.access_token) {
              finish(reject, new Error("no_access_token"));
              return;
            }
            const expiresIn = Number(response.expires_in || 3600) * 1000;
            const token = {
              access_token: response.access_token,
              expires_at: Date.now() + expiresIn,
            };
            writeStoredToken(token);
            finish(resolve, token);
          };
          // GIS fires this when the popup/overlay closes without an OAuth response.
          client.error_callback = (err) => {
            const type = err?.type || err?.message || "popup_failed";
            finish(reject, new Error(String(type)));
          };
          timer = global.setTimeout(() => {
            finish(reject, new Error("auth_timeout"));
          }, 120_000);
          try {
            client.requestAccessToken({ prompt: prompt || "" });
          } catch (err) {
            finish(reject, err instanceof Error ? err : new Error(String(err)));
          }
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

  /**
   * One GIS popup: account chooser + Drive (if needed) in a single token request.
   * Do not chain a second requestAccessToken after this — that causes extra popups on mobile.
   */
  async function signIn() {
    const token = await requestTokenFrom(
      ensureDriveClient(),
      "select_account"
    );
    try {
      await fetchProfile(token.access_token);
    } catch {
      /* ignore — avatar/email can stay empty */
    }
    notify();
    return getSession();
  }

  /** Explicit Drive re-auth (owner-settings Sync). Avoid calling from silent backup. */
  async function ensureDriveAccess() {
    await requestTokenFrom(ensureDriveClient(), "");
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

  /**
   * @param {{ interactive?: boolean }} [opts]
   * interactive:false (default) — never open a popup; use stored token only.
   */
  async function ensureAccessToken(opts = {}) {
    const interactive = Boolean(opts.interactive);
    const token = readStoredToken();
    if (token?.access_token) return token.access_token;
    if (!interactive) throw new Error("not_signed_in");
    const next = await requestTokenFrom(ensureDriveClient(), "select_account");
    if (!readProfile()) {
      try {
        await fetchProfile(next.access_token);
      } catch {
        /* ignore */
      }
    }
    notify();
    return next.access_token;
  }

  async function driveFetch(path, options = {}) {
    const { interactive = false, ...fetchOptions } = options;
    const accessToken = await ensureAccessToken({ interactive: Boolean(interactive) });
    const res = await fetch(`${DRIVE_API}${path}`, {
      ...fetchOptions,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(fetchOptions.headers || {}),
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
      ensureDriveAccess,
      uploadJson,
      downloadJson,
      onSessionChange,
      loadGis,
      clientId,
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
