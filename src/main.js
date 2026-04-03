import { uploadFileToCloudinary } from "./services/cloudinary.js";

const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const output = document.getElementById("output");

uploadBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];

  if (!file) {
    alert("Please select a file");
    return;
  }

  const isImage = file.type.startsWith("image/");

  output.innerHTML = "Uploading...";

  const url = await uploadFileToCloudinary(file, isImage);

  if (!url) {
    output.innerHTML = "Upload failed";
    return;
  }

  console.log("Uploaded URL:", url);

  output.innerHTML = "";

  // Show result like your React app style
  if (isImage) {
    const img = document.createElement("img");
    img.src = url;
    img.style.width = "200px";
    img.style.borderRadius = "10px";

    output.appendChild(img);
  } else {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.textContent = "Open PDF";
    link.style.display = "block";
    link.style.marginTop = "10px";

    output.appendChild(link);
  }
});
