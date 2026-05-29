const uploadService = require('./UploadService');
const { UPLOAD_MESSAGES } = require('./UploadConstant');

async function uploadImage(request, response) {
  const uploadResult = uploadService.getImageUploadResult(request, request.file);

  return response.status(200).json({
    message: UPLOAD_MESSAGES.imageUploadedSuccess,
    data: uploadResult
  });
}

module.exports = {
  uploadImage
};
