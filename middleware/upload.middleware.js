const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");

const multer = require("multer");
const sharp = require("sharp");

// ======================================
// CONFIG
// ======================================
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

/** Max raw upload before compression (allows phone photos to be optimized). */
const MAX_INPUT_BYTES = 5 * 1024 * 1024;

/** Max size of the final compressed .webp file. */
const MAX_OUTPUT_BYTES = 500 * 1024;

const MAX_WIDTH = 1200;
const WEBP_QUALITY = 70;
const MIN_WEBP_QUALITY = 40;

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);

// ======================================
// MEMORY STORAGE
// ======================================
const storage = multer.memoryStorage();

// ======================================
// FILE FILTER
// ======================================
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (
    ALLOWED_MIME_TYPES.includes(file.mimetype) &&
    ALLOWED_EXTENSIONS.has(ext)
  ) {
    cb(null, true);
    return;
  }

  const error = new Error(
    "Unsupported file type. Allowed formats: jpg, jpeg, png, webp."
  );
  error.status = 400;
  cb(error, false);
};

// ======================================
// MULTER
// ======================================
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_INPUT_BYTES,
  },
  fileFilter,
});

// ======================================
// HELPERS
// ======================================
const ensureUploadDir = async () => {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
};

const generateFileName = () =>
  `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.webp`;

const processImage = (buffer, quality) =>
  sharp(buffer)
    .rotate()
    .resize({
      width: MAX_WIDTH,
      withoutEnlargement: true,
    })
    .webp({
      quality,
      effort: 4,
    })
    .toBuffer();

const compressToTargetSize = async (buffer) => {
  let quality = WEBP_QUALITY;
  let output = await processImage(buffer, quality);

  while (
    output.length > MAX_OUTPUT_BYTES &&
    quality > MIN_WEBP_QUALITY
  ) {
    quality -= 10;
    output = await processImage(buffer, quality);
  }

  return output;
};

// ======================================
// MULTER ERROR HANDLER
// ======================================
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum upload size is ${MAX_INPUT_BYTES / (1024 * 1024)}MB before compression.`,
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message || "File upload failed.",
    });
  }

  if (err.status === 400) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  return next(err);
};

// ======================================
// SINGLE IMAGE UPLOAD (multer + errors)
// ======================================
const uploadSingleImage = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
};

// ======================================
// SHARP COMPRESSION
// ======================================
const compressImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    await ensureUploadDir();

    const outputBuffer = await compressToTargetSize(
      req.file.buffer
    );

    if (outputBuffer.length > MAX_OUTPUT_BYTES) {
      return res.status(400).json({
        success: false,
        message:
          "Image exceeds 500KB limit even after compression. Please upload a smaller image.",
      });
    }

    const filename = generateFileName();
    const absolutePath = path.join(UPLOAD_DIR, filename);

    await fs.writeFile(absolutePath, outputBuffer);

    req.file.buffer = outputBuffer;
    req.file.size = outputBuffer.length;
    req.file.mimetype = "image/webp";
    req.file.filename = filename;
    req.file.path = absolutePath;
    req.file.compressedPath = path
      .join("uploads", filename)
      .replace(/\\/g, "/");

    return next();
  } catch (error) {
    console.error("Image compression failed:", error);

    return res.status(500).json({
      success: false,
      message:
        "Image compression failed. Please try another image.",
    });
  }
};

module.exports = {
  upload,
  uploadSingleImage,
  compressImage,
  handleMulterError,
};
