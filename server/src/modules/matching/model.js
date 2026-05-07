const mongoose = require("mongoose");

// --- MATCH REQUEST MODEL ---
const MatchRequestSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sport: { type: String, required: true },
    location: { type: String, required: true },
    time: { type: Date, required: true },
    time_type: { type: String, enum: ["fixed", "flexible"], required: true },
    skill_level: { type: String, required: true },
    number_of_players: { type: Number, required: true },
    match_type: { type: String, enum: ["teammate", "opponent"], required: true },
    status: { type: String, enum: ["pending", "matched", "cancelled"], default: "pending", required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "match_requests" }
);

// --- MATCH MODEL ---
const MatchSchema = new mongoose.Schema(
  {
    sport: { type: String, required: true },
    location: { type: String, required: true },
    time: { type: Date, required: true },
    status: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "matches" }
);

// --- MATCH PARTICIPANT MODEL ---
const MatchParticipantSchema = new mongoose.Schema(
  {
    match_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
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
  { timestamps: true, collection: "match_participants" }
);

// --- DISCOVER POST MODEL ---
const DiscoverPostSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sport: { type: String, required: true },
    location: { type: String, required: true },
    time: { type: Date, required: true },
    time_type: { type: String, enum: ["fixed", "flexible"], required: true },
    skill_level: { type: String, required: true },
    number_of_players: { type: Number, required: true },
    match_type: { type: String, enum: ["teammate", "opponent"], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "discover_posts" }
);

// Middleware logic
function updateTimestamp(next) {
  this.set({ updatedAt: Date.now() });
  next();
}

const schemas = [MatchRequestSchema, MatchSchema, MatchParticipantSchema, DiscoverPostSchema];

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

const MatchRequest = mongoose.model("MatchRequest", MatchRequestSchema);
const Match = mongoose.model("Match", MatchSchema);
const MatchParticipant = mongoose.model("MatchParticipant", MatchParticipantSchema);
const DiscoverPost = mongoose.model("DiscoverPost", DiscoverPostSchema);

module.exports = { MatchRequest, Match, MatchParticipant, DiscoverPost };
