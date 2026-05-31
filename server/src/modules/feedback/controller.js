const { HTTP_STATUS } = require("../../constants");
const feedbackService = require("./service");
const {
  validateCreateFeedbackPayload,
  validateFeedbackListQuery,
} = require("../../validations/feedback.validation");

class FeedbackController {
  async createFeedback(req, res) {
    const { isValid, errors, value } = validateCreateFeedbackPayload(req.body);

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await feedbackService.createFeedback(req.user.id, value);

      return res.status(HTTP_STATUS.CREATED).json({
        message: "Feedback submitted successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async getMyFeedbacks(req, res) {
    const { isValid, errors, value } = validateFeedbackListQuery(req.query);

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await feedbackService.getMyFeedbacks(req.user.id, value);

      return res.status(HTTP_STATUS.OK).json({
        message: "Feedback fetched successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async listAdminFeedbacks(req, res) {
    const { isValid, errors, value } = validateFeedbackListQuery(req.query);

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await feedbackService.listAdminFeedbacks(value);

      return res.status(HTTP_STATUS.OK).json({
        message: "Feedback fetched successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }
}

module.exports = new FeedbackController();
