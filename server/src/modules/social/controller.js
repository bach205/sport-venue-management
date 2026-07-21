const { HTTP_STATUS } = require("../../constants");
const socialService = require("./service");
const {
  validateCreatePostPayload,
  validateUpdatePostPayload,
  validateCreateCommentPayload,
  validateUpdateCommentPayload,
  validatePaginationQuery,
  validateObjectIdParam,
  validateSearchQuery,
} = require("../../validations/social.validation");

class SocialController {
  async createPost(req, res) {
    const { isValid, errors } = validateCreatePostPayload(req.body);

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await socialService.createPost(req.user.id, req.body);

      return res.status(HTTP_STATUS.CREATED).json({
        message: "Post created successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async getFeed(req, res) {
    const { isValid, errors, value } = validatePaginationQuery(req.query);

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const filters = {
        intentType: req.query.intentType,
        sport: req.query.sport,
        category: req.query.category,
        location: req.query.location,
        priceType: req.query.priceType,
        condition: req.query.condition,
        status: req.query.status,
        sort: req.query.sort,
      };

      const data = await socialService.getFeed(req.user.id, value.page, value.limit, filters);

      return res.status(HTTP_STATUS.OK).json({
        message: "Feed fetched successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async updatePost(req, res) {
    const idValidation = validateObjectIdParam(req.params.postId, "Post");
    const payloadValidation = validateUpdatePostPayload(req.body);

    if (!idValidation.isValid || !payloadValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        errors: [...idValidation.errors, ...payloadValidation.errors],
      });
    }

    try {
      const data = await socialService.updatePost(req.params.postId, req.user, req.body);

      return res.status(HTTP_STATUS.OK).json({
        message: "Post updated successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async getPostDetail(req, res) {
    const { isValid, errors } = validateObjectIdParam(req.params.postId, "Post");

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await socialService.getPostDetail(req.params.postId, req.user.id);

      return res.status(HTTP_STATUS.OK).json({
        message: "Post fetched successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async searchFeed(req, res) {
    const { isValid, errors, value } = validateSearchQuery(req.query);

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await socialService.searchFeed(req.user.id, value.q, value.page, value.limit);

      return res.status(HTTP_STATUS.OK).json({
        message: "Feed searched successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async deletePost(req, res) {
    const { isValid, errors } = validateObjectIdParam(req.params.postId, "Post");

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const result = await socialService.deletePost(req.params.postId, req.user);

      return res.status(HTTP_STATUS.OK).json({
        message: result.message,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async likePost(req, res) {
    const { isValid, errors } = validateObjectIdParam(req.params.postId, "Post");

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await socialService.likePost(req.params.postId, req.user.id);

      return res.status(HTTP_STATUS.OK).json({
        message: "Post liked successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async unlikePost(req, res) {
    const { isValid, errors } = validateObjectIdParam(req.params.postId, "Post");

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await socialService.unlikePost(req.params.postId, req.user.id);

      return res.status(HTTP_STATUS.OK).json({
        message: "Post unliked successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async createComment(req, res) {
    const idValidation = validateObjectIdParam(req.params.postId, "Post");
    const payloadValidation = validateCreateCommentPayload(req.body);

    if (!idValidation.isValid || !payloadValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        errors: [...idValidation.errors, ...payloadValidation.errors],
      });
    }

    try {
      const data = await socialService.createComment(req.params.postId, req.user.id, req.body);

      return res.status(HTTP_STATUS.CREATED).json({
        message: "Comment created successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async getPostComments(req, res) {
    const idValidation = validateObjectIdParam(req.params.postId, "Post");
    const paginationValidation = validatePaginationQuery(req.query);

    if (!idValidation.isValid || !paginationValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        errors: [...idValidation.errors, ...paginationValidation.errors],
      });
    }

    try {
      const data = await socialService.getPostComments(
        req.params.postId,
        req.user.id,
        paginationValidation.value.page,
        paginationValidation.value.limit
      );

      return res.status(HTTP_STATUS.OK).json({
        message: "Comments fetched successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async updateComment(req, res) {
    const idValidation = validateObjectIdParam(req.params.commentId, "Comment");
    const payloadValidation = validateUpdateCommentPayload(req.body);

    if (!idValidation.isValid || !payloadValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        errors: [...idValidation.errors, ...payloadValidation.errors],
      });
    }

    try {
      const data = await socialService.updateComment(
        req.params.commentId,
        req.user.id,
        req.body
      );

      return res.status(HTTP_STATUS.OK).json({
        message: "Comment updated successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async deleteComment(req, res) {
    const { isValid, errors } = validateObjectIdParam(req.params.commentId, "Comment");

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const result = await socialService.deleteComment(req.params.commentId, req.user.id);

      return res.status(HTTP_STATUS.OK).json({
        message: result.message,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }
}

module.exports = new SocialController();
