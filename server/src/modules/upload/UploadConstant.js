const UPLOAD_MESSAGES = {
  imageUploadedSuccess: 'Tải ảnh lên thành công.',
  missingImageFile: 'Vui lòng chọn tệp ảnh.',
  invalidImageType: 'Chỉ cho phép định dạng ảnh jpeg, png, webp và gif.',
  imageTooLarge: 'Dung lượng ảnh không được vượt quá 5MB.'
};

const IMAGE_UPLOAD_CONFIG = Object.freeze({
  fieldName: 'image',
  maxFileSizeBytes: 5 * 1024 * 1024,
  directory: 'uploads/images',
  allowedMimeTypes: {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif'
  }
});

module.exports = {
  IMAGE_UPLOAD_CONFIG,
  UPLOAD_MESSAGES
};
