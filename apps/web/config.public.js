/**
 * Public runtime config — safe to commit.
 * Google: Web Client ID only (no client secret in the browser).
 * Supabase: Project URL + publishable/anon key (public; not service_role).
 */
window.PETLIVE_CONFIG = {
  supabaseUrl: "https://qclciqohfwbjkuwxibke.supabase.co",
  /** Paste from Supabase → Settings → API Keys → Publishable (or Legacy anon). */
  supabaseAnonKey: "sb_publishable_-O50CXlTVOhoV5_w63QlHQ_h-1Asc2n",
  googleClientId: "298264643433-a3jba44pt51j0k919428lus7qnspnba8.apps.googleusercontent.com",
  driveFolderName: "火龍果護照",
  driveFileName: "petlive-passport.json",
  /** GIS + Drive scopes for owner-held backup */
  googleScopes: [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/drive.file",
  ].join(" "),
};
