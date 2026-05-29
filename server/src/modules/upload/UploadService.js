const { UPLOAD_MESSAGES } = require('./UploadConstant');
const createHttpError = require('../../utils/createHttpError');

function buildRequestBaseUrl(request) {
  return `${request.protocol}://${request.get('host')}`;
}

class UploadService {
  getImageUploadResult(request, imageFile) {
    if (!imageFile) {
      throw createHttpError(400, UPLOAD_MESSAGES.missingImageFile);
    }

    return {
      imageUrl: `${buildRequestBaseUrl(request)}/uploads/images/${imageFile.filename}`
    };
  }
}

module.exports = new UploadService();
