const mongoose = require("mongoose");

// --- CONVERSATION MODEL ---
const ConversationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["direct", "group"], required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "conversations" }
);

// --- CONVERSATION PARTICIPANT MODEL ---
const ConversationParticipantSchema = new mongoose.Schema(
  {
    conversation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    joined_at: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "conversation_participants" }
);

// --- MESSAGE MODEL ---
const MessageSchema = new mongoose.Schema(
  {
    conversation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "messages" }
);

// Middleware logic
function updateTimestamp(next) {
  this.set({ updatedAt: Date.now() });
  next();
}

const schemas = [ConversationSchema, ConversationParticipantSchema, MessageSchema];

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

const Conversation = mongoose.model("Conversation", ConversationSchema);
const ConversationParticipant = mongoose.model("ConversationParticipant", ConversationParticipantSchema);
const Message = mongoose.model("Message", MessageSchema);

module.exports = { Conversation, ConversationParticipant, Message };
