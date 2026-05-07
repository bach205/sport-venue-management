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

class SocialService {
  async createPost(userId, payload) {
    const post = await Post.create({
      user_id: userId,
      content: String(payload.content).trim(),
    });

    return this.getFeedItemByPost(post._id, userId);
  }

  async getFeed(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find({})
        .populate("user_id", "email status is_verified createdAt updatedAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments({}),
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

  async updatePost(postId, userId, payload) {
    const post = await this.getPostOrThrow(postId);
    this.assertOwnership(post.user_id, userId, "You can only update your own posts.");

    if (payload.content !== undefined) {
      post.content = String(payload.content).trim();
    }

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
    };
  }

  formatFeedItem(post, viewerUserId, context) {
    const authorId = String(post.user_id?._id || post.user_id);
    const profile = context.profileMap.get(authorId);
    const postId = String(post._id);

    return {
      id: postId,
      content: post.content,
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
