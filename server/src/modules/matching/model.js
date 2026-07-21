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
    location_lat: { type: Number },
    location_lng: { type: Number },
    search_radius_km: { type: Number, default: 5 },
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
    location_lat: { type: Number },
    location_lng: { type: Number },
    search_radius_km: { type: Number, default: 5 },
    time: { type: Date, required: true },
    status: { type: String, enum: ["matched", "cancelled"], required: true, default: "matched" },
    conversation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      default: null,
    },
    request_ids: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "MatchRequest",
      default: [],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length <= 2;
        },
        message: "A match can reference up to two requests.",
      },
    },
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

// --- MATCH RATING MODEL ---
const MatchRatingSchema = new mongoose.Schema(
  {
    match_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true,
    },
    reviewer_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rated_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true, collection: "match_ratings" }
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
    current_players: { type: Number, default: 1 },
    match_type: { type: String, enum: ["teammate", "opponent"], required: true },
    content: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "closed", "cancelled"],
      default: "open",
      required: true,
    },
    is_match: { type: Boolean, default: false },
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

const schemas = [
  MatchRequestSchema,
  MatchSchema,
  MatchParticipantSchema,
  MatchRatingSchema,
  DiscoverPostSchema,
];

MatchRequestSchema.index({ user_id: 1, status: 1 });
MatchRequestSchema.index({
  status: 1,
  sport: 1,
  skill_level: 1,
  match_type: 1,
  time: 1,
});
MatchSchema.index({ conversation_id: 1 });
MatchParticipantSchema.index({ match_id: 1, user_id: 1 }, { unique: true });
MatchRatingSchema.index({ match_id: 1, reviewer_user_id: 1 }, { unique: true });
MatchRatingSchema.index({ rated_user_id: 1 });
DiscoverPostSchema.index({ status: 1, createdAt: -1 });
DiscoverPostSchema.index({
  status: 1,
  sport: 1,
  location: 1,
  skill_level: 1,
  match_type: 1,
  time: 1,
});

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
const MatchRating = mongoose.model("MatchRating", MatchRatingSchema);
const DiscoverPost = mongoose.model("DiscoverPost", DiscoverPostSchema);

module.exports = { MatchRequest, Match, MatchParticipant, MatchRating, DiscoverPost };
