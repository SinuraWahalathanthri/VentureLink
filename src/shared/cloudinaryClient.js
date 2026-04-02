import { getAppConfig } from "./appConfig.js";

function assertCloudinaryConfigured() {
  const { cloudinary } = getAppConfig();
  if (!cloudinary.cloudName || !cloudinary.uploadPreset) {
    throw new Error(
      "Cloudinary config missing. Set window.__APP_CONFIG__.cloudinary (cloudName + uploadPreset).",
    );
  }
  return cloudinary;
}

export async function uploadToCloudinary(file, { folder, resourceType } = {}) {
  const cloudinary = assertCloudinaryConfigured();
  const url = `https://api.cloudinary.com/v1_1/${encodeURIComponent(
    cloudinary.cloudName,
  )}/${encodeURIComponent(resourceType || "auto")}/upload`;

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", cloudinary.uploadPreset);
  form.append("folder", folder || cloudinary.folder || "venturelink");

  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Cloudinary upload failed (${res.status}). ${text}`);
  }
  return await res.json(); // includes secure_url, public_id, resource_type, bytes...
}

