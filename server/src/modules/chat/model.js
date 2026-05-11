const mongoose = require("mongoose");

const MESSAGE_STATUS = {
  SENT: "sent",
  RECEIVED: "received",
  SEEN: "seen",
};

const ConversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
      default: "direct",
    },
    direct_key: {
      type: String,
      default: null,
      index: { unique: true, sparse: true },
    },
    last_message_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "conversations" }
);

const ConversationParticipantSchema = new mongoose.Schema(
  {
    conversation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    joined_at: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "conversation_participants" }
);

ConversationParticipantSchema.index(
  { conversation_id: 1, user_id: 1 },
  { unique: true, name: "uniq_conversation_participant" }
);

const MessageSchema = new mongoose.Schema(
  {
    conversation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    attachments: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    status: {
      type: String,
      enum: Object.values(MESSAGE_STATUS),
      default: MESSAGE_STATUS.SENT,
      required: true,
      index: true,
    },
    received_at: {
      type: Date,
      default: null,
    },
    seen_at: {
      type: Date,
      default: null,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "messages" }
);

MessageSchema.index({ conversation_id: 1, createdAt: -1 });
MessageSchema.index({ conversation_id: 1, sender_id: 1, status: 1 });

function updateTimestamp(next) {
  this.set({ updatedAt: Date.now() });
  next();
}

[ConversationSchema, ConversationParticipantSchema, MessageSchema].forEach((schema) => {
  schema.pre("save", function setTimestamps(next) {
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

const Conversation = mongoose.model("Conversation", ConversationSchema);
const ConversationParticipant = mongoose.model(
  "ConversationParticipant",
  ConversationParticipantSchema
);
const Message = mongoose.model("Message", MessageSchema);

module.exports = {
  Conversation,
  ConversationParticipant,
  Message,
  MESSAGE_STATUS,
};
