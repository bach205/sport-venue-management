const mongoose = require("mongoose");

const EmailVerificationTokenSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    token_hash: {
      type: String,
      required: true,
      unique: true,
    },
    expires_at: {
      type: Date,
      required: true,
      index: true,
    },
    used_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, collection: "email_verification_tokens" }
);

const EmailVerificationToken = mongoose.model(
  "EmailVerificationToken",
  EmailVerificationTokenSchema
);

module.exports = {
  EmailVerificationToken,
};
