const { HTTP_STATUS } = require("../../constants");
const createHttpError = require("../../utils/createHttpError");
const { isUserOnline } = require("../../sockets/presence");
const { Profile, User } = require("../user/model");
const {
  Conversation,
  ConversationParticipant,
  Message,
  MESSAGE_STATUS,
} = require("./model");

const buildPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
});

class ChatService {
  async createOrGetDirectConversation(userId, targetUserId, options = {}) {
    const session = options.session || null;

    if (String(userId) === String(targetUserId)) {
      throw createHttpError(HTTP_STATUS.BAD_REQUEST, "You cannot chat with yourself.");
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(userId).select("_id").session(session),
      User.findById(targetUserId).select("_id email").session(session),
    ]);

    if (!currentUser || !targetUser) {
      throw createHttpError(HTTP_STATUS.NOT_FOUND, "Target user not found.");
    }

    const directKey = this.buildDirectKey(userId, targetUserId);

    let conversation = await Conversation.findOne({
      type: "direct",
      direct_key: directKey,
    })
      .session(session)
      .populate("last_message_id");

    if (!conversation) {
      try {
        const createdConversations = await Conversation.create(
          [
            {
              type: "direct",
              direct_key: directKey,
            },
          ],
          session ? { session } : {}
        );

        conversation = createdConversations[0];

        await ConversationParticipant.insertMany(
          [
            { conversation_id: conversation._id, user_id: userId },
            { conversation_id: conversation._id, user_id: targetUserId },
          ],
          session ? { session } : {}
        );
      } catch (error) {
        if (error?.code === 11000) {
          conversation = await Conversation.findOne({
            type: "direct",
            direct_key: directKey,
          })
            .session(session)
            .populate("last_message_id");
        } else {
          throw error;
        }
      }
    }

    return this.getConversationSummaryById(conversation._id, userId, options);
  }

  async listConversations(userId) {
    const participantRows = await ConversationParticipant.find({ user_id: userId })
      .select("conversation_id")
      .lean();

    const conversationIds = participantRows.map((item) => item.conversation_id);
    if (conversationIds.length === 0) {
      return { items: [] };
    }

    const conversations = await Conversation.find({
      _id: { $in: conversationIds },
      type: "direct",
    })
      .populate("last_message_id")
      .sort({ updatedAt: -1 });

    const summaries = await Promise.all(
      conversations.map((conversation) => this.getConversationSummary(conversation, userId))
    );

    return { items: summaries };
  }

  async getMessages(conversationId, userId, page = 1, limit = 20) {
    const conversation = await this.getConversationOrThrow(conversationId);
    await this.assertParticipant(conversation._id, userId);

    const now = new Date();
    await Message.updateMany(
      {
        conversation_id: conversation._id,
        sender_id: { $ne: userId },
        status: MESSAGE_STATUS.SENT,
      },
      {
        $set: {
          status: MESSAGE_STATUS.RECEIVED,
          received_at: now,
        },
      }
    );

    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      Message.find({ conversation_id: conversation._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Message.countDocuments({ conversation_id: conversation._id }),
    ]);

    return {
      items: messages.map((message) => this.formatMessage(message, userId)),
      pagination: buildPagination(page, limit, total),
    };
  }

  async sendMessage(conversationId, userId, payload) {
    const conversation = await this.getConversationOrThrow(conversationId);
    await this.assertParticipant(conversation._id, userId);

    const message = await Message.create({
      conversation_id: conversation._id,
      sender_id: userId,
      content: String(payload.content).trim(),
      attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
      status: MESSAGE_STATUS.SENT,
    });

    conversation.last_message_id = message._id;
    await conversation.save();

    return this.formatMessage(message, userId);
  }

  async markConversationSeen(conversationId, userId) {
    const conversation = await this.getConversationOrThrow(conversationId);
    await this.assertParticipant(conversation._id, userId);

    const now = new Date();
    const sentResult = await Message.updateMany(
      {
        conversation_id: conversation._id,
        sender_id: { $ne: userId },
        status: MESSAGE_STATUS.SENT,
      },
      {
        $set: {
          status: MESSAGE_STATUS.SEEN,
          received_at: now,
          seen_at: now,
        },
      }
    );

    const receivedResult = await Message.updateMany(
      {
        conversation_id: conversation._id,
        sender_id: { $ne: userId },
        status: MESSAGE_STATUS.RECEIVED,
      },
      {
        $set: {
          status: MESSAGE_STATUS.SEEN,
          seen_at: now,
        },
      }
    );

    return {
      updatedCount: (sentResult.modifiedCount || 0) + (receivedResult.modifiedCount || 0),
    };
  }

  async getConversationSummaryById(conversationId, userId, options = {}) {
    const session = options.session || null;
    const conversation = await Conversation.findById(conversationId)
      .session(session)
      .populate("last_message_id");

    if (!conversation) {
      throw createHttpError(HTTP_STATUS.NOT_FOUND, "Conversation not found.");
    }

    await this.assertParticipant(conversation._id, userId, options);
    return this.getConversationSummary(conversation, userId, options);
  }

  async getConversationSummary(conversation, userId, options = {}) {
    const session = options.session || null;
    const participants = await ConversationParticipant.find({
      conversation_id: conversation._id,
    })
      .session(session)
      .select("user_id")
      .lean();

    const participantIds = participants.map((item) => item.user_id);
    const peerUserId = participantIds.find((participantId) => String(participantId) !== String(userId));
    const [peerUser, peerProfile, unseenCount] = await Promise.all([
      User.findById(peerUserId).select("email").session(session),
      Profile.findOne({ user_id: peerUserId }).select("name").session(session),
      Message.countDocuments({
        conversation_id: conversation._id,
        sender_id: { $ne: userId },
        status: { $ne: MESSAGE_STATUS.SEEN },
      }).session(session),
    ]);

    return {
      id: String(conversation._id),
      type: conversation.type,
      peerUser: peerUser
        ? {
            id: String(peerUser._id),
            email: peerUser.email,
            name: peerProfile?.name || null,
            isOnline: isUserOnline(peerUser._id),
          }
        : null,
      lastMessage: conversation.last_message_id
        ? this.formatMessage(conversation.last_message_id, userId)
        : null,
      unseenCount,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  async getConversationOrThrow(conversationId) {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation || conversation.type !== "direct") {
      throw createHttpError(HTTP_STATUS.NOT_FOUND, "Conversation not found.");
    }

    return conversation;
  }

  async assertParticipant(conversationId, userId, options = {}) {
    const session = options.session || null;
    const participant = await ConversationParticipant.findOne({
      conversation_id: conversationId,
      user_id: userId,
    })
      .session(session)
      .select("_id");

    if (!participant) {
      throw createHttpError(
        HTTP_STATUS.FORBIDDEN,
        "You are not allowed to access this conversation."
      );
    }
  }

  formatMessage(message, viewerUserId) {
    return {
      id: String(message._id),
      conversationId: String(message.conversation_id),
      senderId: String(message.sender_id),
      content: message.content,
      attachments: Array.isArray(message.attachments) ? message.attachments : [],
      status: message.status,
      receivedAt: message.received_at,
      seenAt: message.seen_at,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      isOwner: String(message.sender_id) === String(viewerUserId),
    };
  }

  buildDirectKey(userAId, userBId) {
    return [String(userAId), String(userBId)].sort().join(":");
  }
}

module.exports = new ChatService();
