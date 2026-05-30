const { HTTP_STATUS } = require("../../constants");
const {
  validateObjectIdParam,
  validatePaginationQuery,
  validateCreateMatchRequestPayload,
  validateCreateDiscoverPostPayload,
  validateUpdateDiscoverPostPayload,
  validateDiscoverListQuery,
  validateCreateMatchRatingPayload,
} = require("../../validations/matching.validation");
const matchingService = require("./service");

class MatchingController {
  async createMatchRequest(req, res) {
    const { isValid, errors } = validateCreateMatchRequestPayload(req.body);
    // console.log("Validation result:", { isValid, errors });
    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await matchingService.createMatchRequest(req.user.id, req.body, req.app.get("io"));

      return res.status(HTTP_STATUS.CREATED).json({
        message: data.matched ? "Match found successfully." : "Match request created successfully.",
        data: {
          request: data.request,
          match: data.match,
          conversation: data.conversation,
          partner: data.partner,
        },
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async getMyMatchRequests(req, res) {
    try {
      const data = await matchingService.getMyMatchRequests(req.user.id);
      return res.status(HTTP_STATUS.OK).json({
        message: "Match requests fetched successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async getMyMatchRequestById(req, res) {
    const { isValid, errors } = validateObjectIdParam(req.params.requestId, "Match request");

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await matchingService.getMyMatchRequestById(req.params.requestId, req.user.id);
      return res.status(HTTP_STATUS.OK).json({
        message: "Match request fetched successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async cancelMatchRequest(req, res) {
    const { isValid, errors } = validateObjectIdParam(req.params.requestId, "Match request");

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await matchingService.cancelMatchRequest(req.params.requestId, req.user.id);
      return res.status(HTTP_STATUS.OK).json({
        message: "Match request cancelled successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async listMyMatches(req, res) {
    try {
      const data = await matchingService.listMyMatches(req.user.id);
      return res.status(HTTP_STATUS.OK).json({
        message: "Matches fetched successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async getMatchById(req, res) {
    const { isValid, errors } = validateObjectIdParam(req.params.matchId, "Match");

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await matchingService.getMatchById(req.params.matchId, req.user.id);
      return res.status(HTTP_STATUS.OK).json({
        message: "Match fetched successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async rateMatch(req, res) {
    const idValidation = validateObjectIdParam(req.params.matchId, "Match");
    const payloadValidation = validateCreateMatchRatingPayload(req.body);

    if (!idValidation.isValid || !payloadValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        errors: [...idValidation.errors, ...payloadValidation.errors],
      });
    }

    try {
      const data = await matchingService.rateMatch(
        req.params.matchId,
        req.user.id,
        payloadValidation.value.rating
      );
      return res.status(HTTP_STATUS.OK).json({
        message: "Match rating submitted successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async createDiscoverPost(req, res) {
    const { isValid, errors } = validateCreateDiscoverPostPayload(req.body);

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await matchingService.createDiscoverPost(req.user.id, req.body);
      return res.status(HTTP_STATUS.CREATED).json({
        message: "Discover post created successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async listDiscoverPosts(req, res) {
    const validation = validateDiscoverListQuery(req.query);

    if (!validation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors: validation.errors });
    }

    try {
      const data = await matchingService.listDiscoverPosts(
        req.user.id,
        req.query,
        validation.value.page,
        validation.value.limit
      );
      return res.status(HTTP_STATUS.OK).json({
        message: "Discover posts fetched successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async getDiscoverPostById(req, res) {
    const { isValid, errors } = validateObjectIdParam(req.params.postId, "Discover post");

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await matchingService.getDiscoverPostById(req.params.postId, req.user.id);
      return res.status(HTTP_STATUS.OK).json({
        message: "Discover post fetched successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async updateDiscoverPost(req, res) {
    const idValidation = validateObjectIdParam(req.params.postId, "Discover post");
    const payloadValidation = validateUpdateDiscoverPostPayload(req.body);

    if (!idValidation.isValid || !payloadValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        errors: [...idValidation.errors, ...payloadValidation.errors],
      });
    }

    try {
      const data = await matchingService.updateDiscoverPost(req.params.postId, req.user.id, req.body);
      return res.status(HTTP_STATUS.OK).json({
        message: "Discover post updated successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async closeDiscoverPost(req, res) {
    const { isValid, errors } = validateObjectIdParam(req.params.postId, "Discover post");

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await matchingService.closeDiscoverPost(req.params.postId, req.user.id);
      return res.status(HTTP_STATUS.OK).json({
        message: "Discover post closed successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async deleteDiscoverPost(req, res) {
    const { isValid, errors } = validateObjectIdParam(req.params.postId, "Discover post");

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const result = await matchingService.deleteDiscoverPost(req.params.postId, req.user.id);
      return res.status(HTTP_STATUS.OK).json({
        message: result.message,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async contactDiscoverPost(req, res) {
    const { isValid, errors } = validateObjectIdParam(req.params.postId, "Discover post");

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await matchingService.contactDiscoverPost(
        req.params.postId,
        req.user.id,
        req.app.get("io")
      );
      return res.status(HTTP_STATUS.OK).json({
        message: "Conversation ready.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }
}

module.exports = new MatchingController();
