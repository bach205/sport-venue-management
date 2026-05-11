const { HTTP_STATUS } = require("../../constants");
const {
  validateObjectIdParam,
  validatePaginationQuery,
  validateCreateDirectConversationPayload,
  validateSendMessagePayload,
} = require("../../validations/chat.validation");
const chatService = require("./service");

class ChatController {
  async createOrGetDirectConversation(req, res) {
    const { isValid, errors } = validateCreateDirectConversationPayload(req.body);

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await chatService.createOrGetDirectConversation(
        req.user.id,
        req.body.target_user_id
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

  async listConversations(req, res) {
    try {
      const data = await chatService.listConversations(req.user.id);

      return res.status(HTTP_STATUS.OK).json({
        message: "Conversations fetched successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async getMessages(req, res) {
    const idValidation = validateObjectIdParam(req.params.conversationId, "Conversation");
    const paginationValidation = validatePaginationQuery(req.query);

    if (!idValidation.isValid || !paginationValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        errors: [...idValidation.errors, ...paginationValidation.errors],
      });
    }

    try {
      const data = await chatService.getMessages(
        req.params.conversationId,
        req.user.id,
        paginationValidation.value.page,
        paginationValidation.value.limit
      );

      return res.status(HTTP_STATUS.OK).json({
        message: "Messages fetched successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async sendMessage(req, res) {
    const idValidation = validateObjectIdParam(req.params.conversationId, "Conversation");
    const payloadValidation = validateSendMessagePayload(req.body);

    if (!idValidation.isValid || !payloadValidation.isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        errors: [...idValidation.errors, ...payloadValidation.errors],
      });
    }

    try {
      const data = await chatService.sendMessage(req.params.conversationId, req.user.id, req.body);

      return res.status(HTTP_STATUS.CREATED).json({
        message: "Message sent successfully.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }

  async markSeen(req, res) {
    const { isValid, errors } = validateObjectIdParam(req.params.conversationId, "Conversation");

    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
    }

    try {
      const data = await chatService.markConversationSeen(req.params.conversationId, req.user.id);

      return res.status(HTTP_STATUS.OK).json({
        message: "Messages marked as seen.",
        data,
      });
    } catch (error) {
      return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
        message: error.message,
      });
    }
  }
}

module.exports = new ChatController();
