(function initPetLiveSupabaseAuth(global) {
  "use strict";

  const root = (global.PetLiveWeb = global.PetLiveWeb || {});
  const SUPABASE_CDN =
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";

  let client = null;
  let listeners = new Set();
  let authInFlight = false;
  let cachedSession = null;
  let initPromise = null;

  function cfg() {
    return global.PETLIVE_CONFIG || {};
  }

  function supabaseUrl() {
    return String(cfg().supabaseUrl || "").trim();
  }

  function supabaseAnonKey() {
    return String(cfg().supabaseAnonKey || "").trim();
  }

  function isConfigured() {
    return Boolean(supabaseUrl() && supabaseAnonKey());
  }

  function profileFromUser(user) {
    if (!user) return null;
    const meta = user.user_metadata || {};
    return {
      email: user.email || meta.email || "",
      name: meta.full_name || meta.name || user.email || "",
      picture: meta.avatar_url || meta.picture || "",
    };
  }

  function snapFromAuthSession(session) {
    if (!session?.user) {
      return {
        configured: isConfigured(),
        signedIn: false,
        profile: null,
        authBusy: authInFlight,
      };
    }
    return {
      configured: isConfigured(),
      signedIn: true,
      profile: profileFromUser(session.user),
      authBusy: authInFlight,
    };
  }

  function getSession() {
    if (cachedSession) {
      return { ...cachedSession, authBusy: authInFlight };
    }
    return {
      configured: isConfigured(),
      signedIn: false,
      profile: null,
      authBusy: authInFlight,
    };
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

  function isAuthBusy() {
    return Boolean(authInFlight);
  }

  function beginAuth() {
    if (authInFlight) return false;
    authInFlight = true;
    notify();
    return true;
  }

  function endAuth() {
    if (!authInFlight) return;
    authInFlight = false;
    notify();
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = global.document?.querySelector?.(`script[src="${src}"]`);
      if (existing) {
        if (global.supabase?.createClient) {
          resolve();
          return;
        }
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("supabase_cdn_load_failed")), {
          once: true,
        });
        return;
      }
      const el = global.document.createElement("script");
      el.src = src;
      el.async = true;
      el.onload = () => resolve();
      el.onerror = () => reject(new Error("supabase_cdn_load_failed"));
      global.document.head.appendChild(el);
    });
  }

  async function ensureClient() {
    if (!isConfigured()) return null;
    if (client) return client;
    if (!global.supabase?.createClient) {
      await loadScript(SUPABASE_CDN);
    }
    const lib = global.supabase;
    if (!lib?.createClient) throw new Error("supabase_lib_missing");
    client = lib.createClient(supabaseUrl(), supabaseAnonKey(), {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    });
    client.auth.onAuthStateChange((_event, session) => {
      cachedSession = snapFromAuthSession(session);
      notify();
    });
    return client;
  }

  function redirectTo() {
    try {
      const u = new URL(global.location.href);
      u.hash = "";
      ["code", "error", "error_description"].forEach((k) => u.searchParams.delete(k));
      return u.toString();
    } catch {
      return global.location.origin + global.location.pathname;
    }
  }

  function cleanAuthUrl() {
    try {
      const u = new URL(global.location.href);
      if (!u.hash && !u.searchParams.has("code")) return;
      u.hash = "";
      u.searchParams.delete("code");
      u.searchParams.delete("error");
      u.searchParams.delete("error_description");
      global.history.replaceState({}, "", u.toString());
    } catch {
      /* ignore */
    }
  }

  async function init() {
    if (!isConfigured()) {
      cachedSession = getSession();
      return getSession();
    }
    if (!initPromise) {
      initPromise = (async () => {
        try {
          const c = await ensureClient();
          if (!c) return getSession();
          const { data, error } = await c.auth.getSession();
          if (error) throw error;
          cachedSession = snapFromAuthSession(data.session);
          if (data.session) cleanAuthUrl();
          notify();
          return getSession();
        } catch {
          cachedSession = {
            configured: true,
            signedIn: false,
            profile: null,
            authBusy: false,
          };
          return getSession();
        }
      })();
    }
    return initPromise;
  }

  async function signInWithGoogle() {
    if (!beginAuth()) throw new Error("auth_busy");
    try {
      const c = await ensureClient();
      if (!c) throw new Error("missing_config");
      const { error } = await c.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectTo() },
      });
      if (error) throw error;
    } finally {
      endAuth();
    }
  }

  async function signOut() {
    try {
      const c = await ensureClient();
      if (c) await c.auth.signOut();
    } catch {
      /* ignore */
    }
    cachedSession = {
      configured: isConfigured(),
      signedIn: false,
      profile: null,
      authBusy: false,
    };
    notify();
  }

  function onSessionChange(fn) {
    if (typeof fn !== "function") return () => {};
    listeners.add(fn);
    try {
      fn(getSession());
    } catch {
      /* ignore */
    }
    return () => listeners.delete(fn);
  }

  root.auth = root.auth || {};
  root.auth.supabase = {
    init,
    isConfigured,
    getSession,
    signInWithGoogle,
    signOut,
    onSessionChange,
    isAuthBusy,
  };
})(typeof window !== "undefined" ? window : globalThis);
