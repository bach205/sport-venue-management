const { HTTP_STATUS } = require("../../constants");
const createHttpError = require("../../utils/createHttpError");
const { Post, Comment, Like } = require("./model");
const { Profile } = require("../user/model");

const buildPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
});

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

class SocialService {
  async createPost(userId, payload) {
    const post = await Post.create({
      user_id: userId,
      content: payload.content ? String(payload.content).trim() : "",
      image_url: payload.image_url ? String(payload.image_url).trim() : undefined,
      intentType: payload.intentType,
      sport: payload.sport,
      category: payload.category,
      title: payload.title,
      details: payload.details,
      quantity: payload.quantity,
      priceType: payload.priceType,
      priceMin: payload.priceMin,
      priceMax: payload.priceMax,
      currency: payload.currency || "VND",
      condition: payload.condition,
      location: payload.location,
      status: "open",
    });

    return this.getFeedItemByPost(post._id, userId);
  }

  async getFeed(userId, page = 1, limit = 20, filters = {}) {
    const skip = (page - 1) * limit;

    const query = {};
    if (filters.intentType) query.intentType = filters.intentType;
    if (filters.sport) query.sport = filters.sport;
    if (filters.category) query.category = filters.category;
    if (filters.location) query.location = filters.location;
    if (filters.priceType) query.priceType = filters.priceType;
    if (filters.condition) query.condition = filters.condition;
    
    // Prefer open items, hide expired or closed if not explicitly requested
    if (filters.status) {
      query.status = filters.status;
    }

    let sortOption = { createdAt: -1 };
    if (filters.sort === "price_asc") sortOption = { priceMin: 1, createdAt: -1 };
    if (filters.sort === "price_desc") sortOption = { priceMin: -1, createdAt: -1 };

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate("user_id", "email status is_verified createdAt updatedAt")
        .sort(sortOption)
        .skip(skip)
        .limit(limit),
      Post.countDocuments(query),
    ]);

    const postIds = posts.map((post) => post._id);
    const [likeCounts, commentCounts, viewerLikes] = await Promise.all([
      Like.aggregate([
        { $match: { post_id: { $in: postIds } } },
        { $group: { _id: "$post_id", count: { $sum: 1 } } },
      ]),
      Comment.aggregate([
        { $match: { post_id: { $in: postIds } } },
        { $group: { _id: "$post_id", count: { $sum: 1 } } },
      ]),
      Like.find({ post_id: { $in: postIds }, user_id: userId }).select("post_id"),
    ]);

    const authorIds = posts.map((post) => post.user_id?._id || post.user_id).filter(Boolean);
    const authorProfiles = await Profile.find({ user_id: { $in: authorIds } });

    const profileMap = new Map(authorProfiles.map((profile) => [String(profile.user_id), profile]));
    const likeCountMap = new Map(likeCounts.map((item) => [String(item._id), item.count]));
    const commentCountMap = new Map(commentCounts.map((item) => [String(item._id), item.count]));
    const viewerLikeSet = new Set(viewerLikes.map((like) => String(like.post_id)));

    const items = posts.map((post) =>
      this.formatFeedItem(post, userId, {
        profileMap,
        likeCountMap,
        commentCountMap,
        viewerLikeSet,
      })
    );

    return {
      items,
      pagination: buildPagination(page, limit, total),
      meta: {
        scope: "global",
      },
    };
  }

  async searchFeed(userId, query, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const filter = query
      ? {
          content: { $regex: escapeRegex(query), $options: "i" },
        }
      : {};

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate("user_id", "email status is_verified createdAt updatedAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments(filter),
    ]);

    const postIds = posts.map((post) => post._id);
    const [likeCounts, commentCounts, viewerLikes] = await Promise.all([
      Like.aggregate([
        { $match: { post_id: { $in: postIds } } },
        { $group: { _id: "$post_id", count: { $sum: 1 } } },
      ]),
      Comment.aggregate([
        { $match: { post_id: { $in: postIds } } },
        { $group: { _id: "$post_id", count: { $sum: 1 } } },
      ]),
      Like.find({ post_id: { $in: postIds }, user_id: userId }).select("post_id"),
    ]);

    const authorIds = posts.map((post) => post.user_id?._id || post.user_id).filter(Boolean);
    const authorProfiles = await Profile.find({ user_id: { $in: authorIds } });

    const profileMap = new Map(authorProfiles.map((profile) => [String(profile.user_id), profile]));
    const likeCountMap = new Map(likeCounts.map((item) => [String(item._id), item.count]));
    const commentCountMap = new Map(commentCounts.map((item) => [String(item._id), item.count]));
    const viewerLikeSet = new Set(viewerLikes.map((like) => String(like.post_id)));

    const items = posts.map((post) =>
      this.formatFeedItem(post, userId, {
        profileMap,
        likeCountMap,
        commentCountMap,
        viewerLikeSet,
      })
    );

    return {
      items,
      pagination: buildPagination(page, limit, total),
      meta: {
        scope: "search",
        query,
      },
    };
  }

  async updatePost(postId, userId, payload) {
    const post = await this.getPostOrThrow(postId);
    this.assertOwnership(post.user_id, userId, "You can only update your own posts.");

    if (payload.content !== undefined) post.content = String(payload.content).trim();
    if (payload.image_url !== undefined) post.image_url = payload.image_url ? String(payload.image_url).trim() : undefined;
    if (payload.title !== undefined) post.title = payload.title;
    if (payload.details !== undefined) post.details = payload.details;
    if (payload.quantity !== undefined) post.quantity = payload.quantity;
    if (payload.priceType !== undefined) post.priceType = payload.priceType;
    if (payload.priceMin !== undefined) post.priceMin = payload.priceMin;
    if (payload.priceMax !== undefined) post.priceMax = payload.priceMax;
    if (payload.location !== undefined) post.location = payload.location;
    if (payload.condition !== undefined) post.condition = payload.condition;
    if (payload.status !== undefined) post.status = payload.status;

    await post.save();

    return this.getFeedItemByPost(post._id, userId);
  }

  async deletePost(postId, userId) {
    const post = await this.getPostOrThrow(postId);
    this.assertOwnership(post.user_id, userId, "You can only delete your own posts.");

    await Promise.all([
      Comment.deleteMany({ post_id: post._id }),
      Like.deleteMany({ post_id: post._id }),
      Post.deleteOne({ _id: post._id }),
    ]);

    return { message: "Post deleted successfully." };
  }

  async getPostDetail(postId, viewerUserId) {
    return this.getFeedItemByPost(postId, viewerUserId);
  }

  async likePost(postId, userId) {
    await this.getPostOrThrow(postId);

    const existingLike = await Like.findOne({ post_id: postId, user_id: userId });
    if (existingLike) {
      throw createHttpError(HTTP_STATUS.BAD_REQUEST, "Post already liked.");
    }

    try {
      await Like.create({ post_id: postId, user_id: userId });
    } catch (error) {
      if (error?.code === 11000) {
        throw createHttpError(HTTP_STATUS.BAD_REQUEST, "Post already liked.");
      }

      throw error;
    }

    return this.getFeedItemByPost(postId, userId);
  }

  async unlikePost(postId, userId) {
    await this.getPostOrThrow(postId);

    const deletedLike = await Like.findOneAndDelete({ post_id: postId, user_id: userId });

    if (!deletedLike) {
      throw createHttpError(HTTP_STATUS.BAD_REQUEST, "Post is not liked yet.");
    }

    return this.getFeedItemByPost(postId, userId);
  }

  async createComment(postId, userId, payload) {
    await this.getPostOrThrow(postId);

    const comment = await Comment.create({
      post_id: postId,
      user_id: userId,
      content: String(payload.content).trim(),
    });

    return this.getCommentById(comment._id, userId);
  }

  async getPostComments(postId, viewerUserId, page = 1, limit = 20) {
    await this.getPostOrThrow(postId);

    const skip = (page - 1) * limit;
    const [comments, total] = await Promise.all([
      Comment.find({ post_id: postId })
        .populate("user_id", "email status is_verified createdAt updatedAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Comment.countDocuments({ post_id: postId }),
    ]);

    const authorIds = comments.map((comment) => comment.user_id?._id || comment.user_id).filter(Boolean);
    const profiles = await Profile.find({ user_id: { $in: authorIds } });
    const profileMap = new Map(profiles.map((profile) => [String(profile.user_id), profile]));

    return {
      items: comments.map((comment) => this.formatComment(comment, profileMap, viewerUserId)),
      pagination: buildPagination(page, limit, total),
    };
  }

  async updateComment(commentId, userId, payload) {
    const comment = await this.getCommentOrThrow(commentId);
    this.assertOwnership(comment.user_id, userId, "You can only update your own comments.");

    if (payload.content !== undefined) {
      comment.content = String(payload.content).trim();
    }

    await comment.save();

    return this.getCommentById(comment._id, userId);
  }

  async deleteComment(commentId, userId) {
    const comment = await this.getCommentOrThrow(commentId);
    this.assertOwnership(comment.user_id, userId, "You can only delete your own comments.");

    await Comment.deleteOne({ _id: comment._id });

    return { message: "Comment deleted successfully." };
  }

  async getFeedItemByPost(postId, viewerUserId) {
    const post = await Post.findById(postId).populate(
      "user_id",
      "email status is_verified createdAt updatedAt"
    );

    if (!post) {
      throw createHttpError(HTTP_STATUS.NOT_FOUND, "Post not found.");
    }

    const [profile, likeCount, commentCount, viewerLike] = await Promise.all([
      Profile.findOne({ user_id: post.user_id?._id || post.user_id }),
      Like.countDocuments({ post_id: post._id }),
      Comment.countDocuments({ post_id: post._id }),
      Like.findOne({ post_id: post._id, user_id: viewerUserId }),
    ]);

    return this.formatFeedItem(post, viewerUserId, {
      profileMap: new Map(profile ? [[String(profile.user_id), profile]] : []),
      likeCountMap: new Map([[String(post._id), likeCount]]),
      commentCountMap: new Map([[String(post._id), commentCount]]),
      viewerLikeSet: new Set(viewerLike ? [String(post._id)] : []),
    });
  }

  async getCommentById(commentId, viewerUserId) {
    const comment = await Comment.findById(commentId).populate(
      "user_id",
      "email status is_verified createdAt updatedAt"
    );

    if (!comment) {
      throw createHttpError(HTTP_STATUS.NOT_FOUND, "Comment not found.");
    }

    const profile = await Profile.findOne({ user_id: comment.user_id?._id || comment.user_id });
    const profileMap = new Map(profile ? [[String(profile.user_id), profile]] : []);

    return this.formatComment(comment, profileMap, viewerUserId);
  }

  async getPostOrThrow(postId) {
    const post = await Post.findById(postId);

    if (!post) {
      throw createHttpError(HTTP_STATUS.NOT_FOUND, "Post not found.");
    }

    return post;
  }

  async getCommentOrThrow(commentId) {
    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw createHttpError(HTTP_STATUS.NOT_FOUND, "Comment not found.");
    }

    return comment;
  }

  assertOwnership(ownerId, userId, message) {
    if (String(ownerId) !== String(userId)) {
      throw createHttpError(HTTP_STATUS.FORBIDDEN, message);
    }
  }

  formatAuthor(user, profile) {
    if (!user) {
      return null;
    }

    const userJson = typeof user.toJSON === "function" ? user.toJSON() : user;

    return {
      id: String(userJson._id),
      email: userJson.email,
      name: profile?.name || null,
      avatarUrl: profile?.avatar_url || null,
    };
  }

  formatFeedItem(post, viewerUserId, context) {
    const authorId = String(post.user_id?._id || post.user_id);
    const profile = context.profileMap.get(authorId);
    const postId = String(post._id);

    return {
      id: postId,
      content: post.content,
      imageUrl: post.image_url || null,
      intentType: post.intentType,
      sport: post.sport,
      category: post.category,
      title: post.title,
      details: post.details,
      quantity: post.quantity,
      priceType: post.priceType,
      priceMin: post.priceMin,
      priceMax: post.priceMax,
      currency: post.currency,
      condition: post.condition,
      location: post.location,
      status: post.status,
      author: this.formatAuthor(post.user_id, profile),
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      likeCount: context.likeCountMap.get(postId) || 0,
      commentCount: context.commentCountMap.get(postId) || 0,
      isOwner: authorId === String(viewerUserId),
      hasLiked: context.viewerLikeSet.has(postId),
    };
  }

  formatComment(comment, profileMap, viewerUserId) {
    const authorId = String(comment.user_id?._id || comment.user_id);
    const profile = profileMap.get(authorId);

    return {
      id: String(comment._id),
      postId: String(comment.post_id),
      content: comment.content,
      author: this.formatAuthor(comment.user_id, profile),
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      isOwner: String(viewerUserId) === authorId,
    };
  }
}

module.exports = new SocialService();
