export const SITE_URL = "https://koevoice.xyz";
export const SITE_NAME = "Koe";
export const SITE_TITLE = "Koe - Voice Dictation for Desktop and Mobile";
export const SITE_DESCRIPTION =
  "Lightning-fast voice dictation for desktop and mobile. Free with your own API key, or use managed cloud processing when you want Koe to handle the key.";
export const GITHUB_REPO_URL = "https://github.com/JStaRFilms/Koe";

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}
