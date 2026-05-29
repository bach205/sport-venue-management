const express = require('express');
const authMiddleware = require('../../middlewares/auth.middleware');
const asyncHandler = require('../../utils/asyncHandler');
const uploadController = require('./UploadController');
const { receiveSingleImageUpload } = require('./UploadMiddleware');

function createUploadRouter() {
  const router = express.Router();

  router.post(
    '/uploads/images',
    asyncHandler(authMiddleware),
    asyncHandler(receiveSingleImageUpload),
    asyncHandler(uploadController.uploadImage)
  );

  return router;
}

function registerUploadRoute(router) {
  router.use(createUploadRouter());
}

module.exports = {
  createUploadRouter,
  registerUploadRoute
};
