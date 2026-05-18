const fs = require("fs/promises");
const path = require("path");

const cloudinary = require("../config/cloudinary");

const CLOUDINARY_FOLDER = "GHMProject";

const isCloudinaryUrl = (value) =>
  /res\.cloudinary\.com/i.test(value);

const isHttpUrl = (value) =>
  /^https?:\/\//i.test(value);

/**
 * Upload CSV image value to Cloudinary.
 * - Already Cloudinary URL → returned as-is
 * - http(s) URL → fetched and uploaded
 * - Local file path → uploaded from disk
 * - Invalid / failed → null (row still imports without image)
 */
const uploadCsvImageToCloudinary = async (imageValue) => {
  if (imageValue == null || imageValue === "") {
    return null;
  }

  const trimmed = String(imageValue).trim();
  if (!trimmed) {
    return null;
  }

  if (isCloudinaryUrl(trimmed)) {
    return trimmed;
  }

  try {
    let uploadSource = trimmed;

    if (!isHttpUrl(trimmed)) {
      const resolved = path.isAbsolute(trimmed)
        ? trimmed
        : path.resolve(process.cwd(), trimmed);

      await fs.access(resolved);
      uploadSource = resolved;
    }

    const result = await cloudinary.uploader.upload(
      uploadSource,
      {
        folder: CLOUDINARY_FOLDER,
        resource_type: "image",
      }
    );

    return result.secure_url;
  } catch (error) {
    console.error(
      "CSV Cloudinary upload failed:",
      trimmed,
      error.message
    );
    return null;
  }
};

module.exports = {
  uploadCsvImageToCloudinary,
};
