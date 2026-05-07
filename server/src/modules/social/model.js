const mongoose = require("mongoose");
const { Schema } = mongoose;

// --- POST MODEL ---
const PostSchema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "posts" }
);

// --- COMMENT MODEL ---
const CommentSchema = new Schema(
  {
    post_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "comments" }
);

// --- LIKE MODEL ---
const LikeSchema = new Schema(
  {
    post_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "likes" }
);

// Middleware logic
function updateTimestamp(next) {
  this.set({ updatedAt: Date.now() });
  next();
}

PostSchema.index({ createdAt: -1 });
CommentSchema.index({ post_id: 1, createdAt: -1 });
LikeSchema.index({ post_id: 1 });
LikeSchema.index({ user_id: 1, post_id: 1 }, { unique: true });

const schemas = [PostSchema, CommentSchema, LikeSchema];

schemas.forEach((schema) => {
  schema.pre("save", function (next) {
    if (this.isNew) {
      this.createdAt = Date.now();
    }
    this.updatedAt = Date.now();
    next();
  });

  schema.pre("findOneAndUpdate", updateTimestamp);
  schema.pre("updateOne", updateTimestamp);
  schema.pre("updateMany", updateTimestamp);
  schema.pre("findByIdAndUpdate", updateTimestamp);
});

const Post = mongoose.model("Post", PostSchema);
const Comment = mongoose.model("Comment", CommentSchema);
const Like = mongoose.model("Like", LikeSchema);

module.exports = { Post, Comment, Like };
