const CLOUDINARY_URL_BASE = "https://api.cloudinary.com/v1_1/ddvlnblw7";
const IMAGE_UPLOAD_PRESET = "venturelink";
const PDF_UPLOAD_PRESET = "venturelink-docs";

export async function uploadFileToCloudinary(file, isImage = true) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append(
    "upload_preset",
    isImage ? IMAGE_UPLOAD_PRESET : PDF_UPLOAD_PRESET
  );

  formData.append("folder", isImage ? "images" : "docs");

  const res = await fetch(
    `${CLOUDINARY_URL_BASE}/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();

  if (!res.ok) {
    console.error(data);
    throw new Error(data.error?.message || "Upload failed");
  }

  return data.secure_url;
}