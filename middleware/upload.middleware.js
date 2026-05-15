const multer = require("multer");


// ======================================
// MEMORY STORAGE
// ======================================
const storage = multer.memoryStorage();


// ======================================
// FILE FILTER
// ======================================
const fileFilter = (
  req,
  file,
  cb
) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (
    allowedTypes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type"),
      false
    );
  }
};


// ======================================
// MULTER
// ======================================
const upload = multer({
  storage,

  limits: {
    fileSize: 2 * 1024 * 1024,
  },

  fileFilter,
});

module.exports = upload;