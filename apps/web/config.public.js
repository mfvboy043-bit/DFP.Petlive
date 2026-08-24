/**
 * Public runtime config — safe to commit.
 * Paste your Google OAuth Web Client ID (no client secret in the browser).
 */
window.PETLIVE_CONFIG = {
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
