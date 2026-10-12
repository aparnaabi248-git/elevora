const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Resolve a writable temp directory on every call so Vercel serverless
// functions never depend on a persistent local ./uploads folder.
const getUploadDir = () => {
  const uploadDir = process.env.VERCEL
    ? path.join(os.tmpdir(), 'elevora-uploads')
    : path.join(__dirname, '../uploads');
  fs.mkdirSync(uploadDir, { recursive: true });
  return uploadDir;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      cb(null, getUploadDir());
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix =
      Date.now() + '-' + Math.round(Math.random() * 1e9);

    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    const error = new Error(
      'Only PDF, DOC, and DOCX files are allowed. Please upload a valid resume file.'
    );
    error.status = 400;
    error.code = 'INVALID_RESUME_FILE';
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

upload.getUploadDir = getUploadDir;

module.exports = upload;
