const { HTTP_STATUS } = require("../../constants");
const createHttpError = require("../../utils/createHttpError");
const { Feedback, FEEDBACK_STATUS } = require("./model");
const { Profile, User, UserRole } = require("../user/model");

const buildPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
});

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

class FeedbackService {
  async createFeedback(userId, payload) {
    const [user, profile, role] = await Promise.all([
      User.findById(userId).select("email status is_verified"),
      Profile.findOne({ user_id: userId }).select("name avatar_url"),
      UserRole.findOne({ user_id: userId }).select("role"),
    ]);

    if (!user) {
      throw createHttpError(HTTP_STATUS.NOT_FOUND, "User not found.");
    }

    const feedback = await Feedback.create({
      user_id: userId,
      category: payload.category,
      subject: payload.subject,
      message: payload.message,
      rating: payload.rating === undefined ? null : payload.rating,
      status: FEEDBACK_STATUS.NEW,
    });

    return this.formatFeedback(feedback, {
      user,
      profile,
      role: role?.role || "user",
    });
  }

  async getMyFeedbacks(userId, options = {}) {
    const page = options.page || 1;
    const limit = options.limit || 100;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Feedback.find({ user_id: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Feedback.countDocuments({ user_id: userId }),
    ]);

    const formatted = await this.formatFeedbackCollection(items);

    return {
      items: formatted,
      summary: this.buildSummary(formatted),
      pagination: buildPagination(page, limit, total),
    };
  }

  async listAdminFeedbacks(options = {}) {
    const page = options.page || 1;
    const limit = options.limit || 100;
    const skip = (page - 1) * limit;
    const query = {};

    if (options.status) {
      query.status = options.status;
    }

    if (options.q) {
      const searchRegex = new RegExp(escapeRegex(options.q), "i");
      const [matchedUsers, matchedProfiles] = await Promise.all([
        User.find({ email: searchRegex }).select("_id"),
        Profile.find({ name: searchRegex }).select("user_id"),
      ]);

      const matchedUserIds = [
        ...matchedUsers.map((user) => String(user._id)),
        ...matchedProfiles.map((profile) => String(profile.user_id)),
      ];

      const textConditions = [
        { subject: searchRegex },
        { message: searchRegex },
        { category: searchRegex },
      ];

      if (matchedUserIds.length > 0) {
        textConditions.push({ user_id: { $in: matchedUserIds } });
      }

      query.$or = textConditions;
    }

    const [items, total] = await Promise.all([
      Feedback.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Feedback.countDocuments(query),
    ]);

    const formatted = await this.formatFeedbackCollection(items);

    return {
      items: formatted,
      summary: this.buildSummary(formatted),
      pagination: buildPagination(page, limit, total),
    };
  }

  buildSummary(records) {
    const ratedRecords = records.filter((record) => typeof record.rating === "number");
    const totalRating = ratedRecords.reduce((sum, record) => sum + (record.rating || 0), 0);

    return {
      total: records.length,
      newCount: records.filter((record) => record.status === FEEDBACK_STATUS.NEW).length,
      reviewingCount: records.filter((record) => record.status === FEEDBACK_STATUS.REVIEWING).length,
      resolvedCount: records.filter((record) => record.status === FEEDBACK_STATUS.RESOLVED).length,
      averageRating: ratedRecords.length ? totalRating / ratedRecords.length : 0,
    };
  }

  async formatFeedbackCollection(records = []) {
    if (records.length === 0) {
      return [];
    }

    const userIds = [...new Set(records.map((record) => String(record.user_id)))];
    const [profiles, users, roles] = await Promise.all([
      Profile.find({ user_id: { $in: userIds } }).select("user_id name avatar_url"),
      User.find({ _id: { $in: userIds } }).select("email"),
      UserRole.find({ user_id: { $in: userIds } }).select("user_id role"),
    ]);

    const profileMap = new Map(
      profiles.map((profile) => [String(profile.user_id), profile])
    );
    const userMap = new Map(users.map((user) => [String(user._id), user]));
    const roleMap = new Map(roles.map((item) => [String(item.user_id), item.role]));

    return records.map((record) =>
      this.formatFeedback(record, {
        user: userMap.get(String(record.user_id)) || null,
        profile: profileMap.get(String(record.user_id)) || null,
        role: roleMap.get(String(record.user_id)) || "user",
      })
    );
  }

  formatFeedback(record, relations = {}) {
    if (!record) {
      return null;
    }

    const user = relations.user;
    const profile = relations.profile;
    const fallbackName = user?.email ? user.email.split("@")[0] : "User";

    return {
      id: String(record._id),
      user: {
        id: String(record.user_id),
        name: profile?.name || fallbackName,
        email: user?.email || "",
        avatar:
          profile?.avatar_url ||
          `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(
            profile?.name || fallbackName
          )}`,
        role: relations.role || "user",
      },
      category: record.category,
      subject: record.subject,
      message: record.message,
      rating: record.rating === null || record.rating === undefined ? undefined : record.rating,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      reviewedAt: record.reviewed_at,
      reviewedBy: record.reviewed_by ? String(record.reviewed_by) : null,
      adminNote: record.admin_note || "",
    };
  }
}

module.exports = new FeedbackService();
