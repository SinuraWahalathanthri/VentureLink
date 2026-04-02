// Centralized runtime config for static HTML pages.
// Fill these via window.__APP_CONFIG__ before importing modules, e.g.:
// <script>
//   window.__APP_CONFIG__ = { firebase: {...}, cloudinary: {...} };
// </script>

export function getAppConfig() {
  const cfg = (typeof window !== "undefined" && window.__APP_CONFIG__) || {};
  const firebase = cfg.firebase || {};
  const cloudinary = cfg.cloudinary || {};

  return {
    firebase: {
      apiKey: firebase.apiKey || "",
      authDomain: firebase.authDomain || "",
      projectId: firebase.projectId || "",
      storageBucket: firebase.storageBucket || "",
      messagingSenderId: firebase.messagingSenderId || "",
      appId: firebase.appId || "",
    },
    cloudinary: {
      cloudName: cloudinary.cloudName || "",
      uploadPreset: cloudinary.uploadPreset || "",
      folder: cloudinary.folder || "venturelink",
    },
  };
}

