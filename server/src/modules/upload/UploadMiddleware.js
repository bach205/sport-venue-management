const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { IMAGE_UPLOAD_CONFIG, UPLOAD_MESSAGES } = require('./UploadConstant');
const createHttpError = require('../../utils/createHttpError');

function createUploadError(message) {
  return createHttpError(400, message);
}

function createImageFileName(mimeType) {
  const extension = IMAGE_UPLOAD_CONFIG.allowedMimeTypes[mimeType];
  const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

  return `image-${uniqueSuffix}${extension}`;
}

function ensureUploadDirectoryExists(uploadDirectory, callback) {
  fs.mkdir(uploadDirectory, { recursive: true }, (error) => {
    callback(error, uploadDirectory);
  });
}

function validateImageFile(request, file, callback) {
  if (!IMAGE_UPLOAD_CONFIG.allowedMimeTypes[file.mimetype]) {
    callback(createUploadError(UPLOAD_MESSAGES.invalidImageType));
    return;
  }

  callback(null, true);
}

const imageStorage = multer.diskStorage({
  destination(request, file, callback) {
    const uploadDirectory = path.join(process.cwd(), IMAGE_UPLOAD_CONFIG.directory);

    ensureUploadDirectoryExists(uploadDirectory, callback);
  },
  filename(request, file, callback) {
    callback(null, createImageFileName(file.mimetype));
  }
});

const uploadImage = multer({
  storage: imageStorage,
  fileFilter: validateImageFile,
  limits: {
    fileSize: IMAGE_UPLOAD_CONFIG.maxFileSizeBytes,
    files: 1
  }
}).single(IMAGE_UPLOAD_CONFIG.fieldName);

function mapMulterError(error) {
  if (!error) {
    return null;
  }

  if (error.statusCode) {
    return error;
  }

  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return createUploadError(UPLOAD_MESSAGES.imageTooLarge);
  }

  if (error instanceof multer.MulterError) {
    return createUploadError(error.message);
  }

  return error;
}

function receiveSingleImageUpload(request, response, next) {
  uploadImage(request, response, (error) => {
    const uploadError = mapMulterError(error);

    if (uploadError) {
      return next(uploadError);
    }

    if (!request.file) {
      return next(createUploadError(UPLOAD_MESSAGES.missingImageFile));
    }

    return next();
  });
}

module.exports = {
  receiveSingleImageUpload
};
