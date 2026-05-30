const mongoose = require("mongoose");

const { HTTP_STATUS, SOCKET_EVENTS } = require("../../constants");
const createHttpError = require("../../utils/createHttpError");
const { Profile, User } = require("../user/model");
const chatService = require("../chat/service");
const { MatchRequest, Match, MatchParticipant, MatchRating, DiscoverPost } = require("./model");

const TIME_MATCH_WINDOW_MS = 2 * 60 * 60 * 1000;
const DEFAULT_SEARCH_RADIUS_KM = 5;
const EARTH_RADIUS_KM = 6371;

const hasCoordinates = (item) =>
  Number.isFinite(Number(item?.location_lat)) && Number.isFinite(Number(item?.location_lng));

const toRadians = (value) => (Number(value) * Math.PI) / 180;

const getDistanceKm = (a, b) => {
  const dLat = toRadians(Number(b.location_lat) - Number(a.location_lat));
  const dLng = toRadians(Number(b.location_lng) - Number(a.location_lng));
  const lat1 = toRadians(a.location_lat);
  const lat2 = toRadians(b.location_lat);
  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const isLocationCompatible = (request, candidate) => {
  if (hasCoordinates(request) && hasCoordinates(candidate)) {
    const distanceKm = getDistanceKm(request, candidate);
    const requestRadius = Number(request.search_radius_km) || DEFAULT_SEARCH_RADIUS_KM;
    const candidateRadius = Number(candidate.search_radius_km) || DEFAULT_SEARCH_RADIUS_KM;
    return distanceKm <= Math.min(requestRadius, candidateRadius);
  }

  return String(request.location).trim() === String(candidate.location).trim();
};

const normalizeOptionalNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return Number(value);
};

const buildPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
});

class MatchingService {
  async createMatchRequest(userId, payload, io) {
    const existingPending = await MatchRequest.findOne({
      user_id: userId,
      status: "pending",
    }).select("_id");

    if (existingPending) {
      await MatchRequest.updateMany(
        {
          user_id: userId,
          status: "pending",
        },
        {
          $set: { status: "cancelled" },
        }
      );
    }

    const request = await MatchRequest.create({
      user_id: userId,
      sport: String(payload.sport).trim(),
      location: String(payload.location).trim(),
      location_lat: normalizeOptionalNumber(payload.location_lat),
      location_lng: normalizeOptionalNumber(payload.location_lng),
      search_radius_km:
        payload.search_radius_km !== undefined
          ? Number(payload.search_radius_km)
          : DEFAULT_SEARCH_RADIUS_KM,
      time: new Date(payload.time),
      time_type: payload.time_type,
      skill_level: payload.skill_level,
      number_of_players: Number(payload.number_of_players),
      match_type: payload.match_type,
      status: "pending",
    });

    const partnerRequests = await MatchRequest.find({
      _id: { $ne: request._id },
      user_id: { $ne: userId },
      status: "pending",
      sport: request.sport,
      skill_level: request.skill_level,
      match_type: request.match_type,
      time: {
        $gte: new Date(request.time.getTime() - TIME_MATCH_WINDOW_MS),
        $lte: new Date(request.time.getTime() + TIME_MATCH_WINDOW_MS),
      },
    }).sort({ createdAt: 1 });
    const partnerRequest = partnerRequests.find((candidate) =>
      isLocationCompatible(request, candidate)
    );

    let responseData = {
      matched: false,
      request: this.formatMatchRequest(request),
      match: null,
      conversation: null,
      partner: null,
    };

    if (partnerRequest) {
      const conversation = await chatService.createOrGetDirectConversation(userId, partnerRequest.user_id);
      const match = await Match.create({
        sport: request.sport,
        location: request.location,
        location_lat: request.location_lat,
        location_lng: request.location_lng,
        search_radius_km: request.search_radius_km,
        time: request.time,
        status: "matched",
        conversation_id: conversation.id,
        request_ids: [request._id, partnerRequest._id],
      });

      await MatchParticipant.insertMany([
        { match_id: match._id, user_id: userId },
        { match_id: match._id, user_id: partnerRequest.user_id },
      ]);

      request.status = "matched";
      partnerRequest.status = "matched";
      await Promise.all([request.save(), partnerRequest.save()]);

      const [requestOwner, partnerSummary] = await Promise.all([
        this.getUserSummary(userId),
        this.getUserSummary(partnerRequest.user_id),
      ]);

      responseData = {
        matched: true,
        request: this.formatMatchRequest(request),
        match: this.formatMatchSummary(match, conversation.id, partnerSummary, partnerRequest),
        conversation,
        partner: partnerSummary,
        notificationTargets: [
          {
            userId: String(userId),
            partner: partnerSummary,
            match: this.formatMatchSummary(match, conversation.id, partnerSummary, partnerRequest),
          },
          {
            userId: String(partnerRequest.user_id),
            partner: requestOwner,
            match: this.formatMatchSummary(match, conversation.id, requestOwner, request),
          },
        ],
      };
    }

    if (responseData?.matched && io) {
      responseData.notificationTargets.forEach((target) => {
        io.to(this.getUserRoom(target.userId)).emit(SOCKET_EVENTS.MATCHING_REQUEST_MATCHED, {
          request: responseData.request,
          match: target.match,
          conversation: responseData.conversation,
          partner: target.partner,
        });
      });
    } else if (responseData && io) {
      io.to(this.getUserRoom(userId)).emit(SOCKET_EVENTS.MATCHING_REQUEST_CREATED, {
        request: responseData.request,
      });
    }
    return responseData;
  }

  async getMyMatchRequests(userId) {
    const requests = await MatchRequest.find({ user_id: userId }).sort({ createdAt: -1 });

    return {
      items: requests.map((request) => this.formatMatchRequest(request)),
    };
  }

  async getMyMatchRequestById(requestId, userId) {
    const request = await this.getMatchRequestOrThrow(requestId);
    this.assertOwnership(request.user_id, userId, "You can only access your own match request.");
    return this.formatMatchRequest(request);
  }

  async cancelMatchRequest(requestId, userId) {
    const request = await this.getMatchRequestOrThrow(requestId);
    this.assertOwnership(request.user_id, userId, "You can only cancel your own match request.");

    if (request.status !== "pending") {
      throw createHttpError(HTTP_STATUS.BAD_REQUEST, "Only pending match requests can be cancelled.");
    }

    request.status = "cancelled";
    await request.save();

    return this.formatMatchRequest(request);
  }

  async cancelPendingMatchRequestsByUser(userId) {
    const result = await MatchRequest.updateMany(
      {
        user_id: userId,
        status: "pending",
      },
      {
        $set: { status: "cancelled" },
      }
    );

    return {
      cancelledCount: result.modifiedCount || 0,
    };
  }

  async listMyMatches(userId) {
    const participantRows = await MatchParticipant.find({ user_id: userId })
      .select("match_id")
      .lean();

    if (participantRows.length === 0) {
      return { items: [] };
    }
    
    const matchIds = participantRows.map((item) => item.match_id);
    const matches = await Match.find({ _id: { $in: matchIds } }).sort({ createdAt: -1 });

    const items = await Promise.all(matches.map((match) => this.getMatchSummaryForUser(match, userId)));
    return { items };
  }

  async getMatchById(matchId, userId) {
    const match = await Match.findById(matchId);

    if (!match) {
      throw createHttpError(HTTP_STATUS.NOT_FOUND, "Match not found.");
    }

    await this.assertMatchParticipant(match._id, userId);
    return this.getMatchSummaryForUser(match, userId);
  }

  async rateMatch(matchId, userId, rating) {
    const match = await Match.findById(matchId);

    if (!match) {
      throw createHttpError(HTTP_STATUS.NOT_FOUND, "Match not found.");
    }

    const participants = await MatchParticipant.find({ match_id: match._id }).lean();
    const reviewer = participants.find(
      (participant) => String(participant.user_id) === String(userId)
    );
    const ratedParticipant = participants.find(
      (participant) => String(participant.user_id) !== String(userId)
    );

    if (!reviewer) {
      throw createHttpError(HTTP_STATUS.FORBIDDEN, "You can only rate matches you joined.");
    }

    if (!ratedParticipant) {
      throw createHttpError(HTTP_STATUS.BAD_REQUEST, "This match has no partner to rate.");
    }

    const matchRating = await MatchRating.findOneAndUpdate(
      {
        match_id: match._id,
        reviewer_user_id: userId,
      },
      {
        $set: {
          rated_user_id: ratedParticipant.user_id,
          rating,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    const [stats] = await MatchRating.aggregate([
      { $match: { rated_user_id: ratedParticipant.user_id } },
      {
        $group: {
          _id: "$rated_user_id",
          averageRating: { $avg: "$rating" },
          ratingCount: { $sum: 1 },
        },
      },
    ]);

    return {
      id: String(matchRating._id),
      matchId: String(match._id),
      reviewerUserId: String(userId),
      ratedUserId: String(ratedParticipant.user_id),
      rating: matchRating.rating,
      ratedUserStats: {
        averageRating: stats ? Number(stats.averageRating.toFixed(2)) : matchRating.rating,
        ratingCount: stats?.ratingCount || 1,
      },
      createdAt: matchRating.createdAt,
      updatedAt: matchRating.updatedAt,
    };
  }

  async createDiscoverPost(userId, payload) {
    const post = await DiscoverPost.create({
      user_id: userId,
      sport: String(payload.sport).trim(),
      location: String(payload.location).trim(),
      time: new Date(payload.time),
      time_type: payload.time_type,
      skill_level: payload.skill_level,
      number_of_players: Number(payload.number_of_players),
      match_type: payload.match_type,
      content: String(payload.content).trim(),
      status: "open",
    });

    return this.getDiscoverPostById(post._id, userId);
  }

  async listDiscoverPosts(userId, query, page = 1, limit = 20) {
    const filter = { status: "open" };

    ["sport", "location", "skill_level", "match_type"].forEach((field) => {
      if (query[field]) {
        filter[field] = String(query[field]).trim();
      }
    });

    if (query.time_from || query.time_to) {
      filter.time = {};
      if (query.time_from) {
        filter.time.$gte = new Date(query.time_from);
      }
      if (query.time_to) {
        filter.time.$lte = new Date(query.time_to);
      }
    }

    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      DiscoverPost.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      DiscoverPost.countDocuments(filter),
    ]);

    const items = await Promise.all(posts.map((post) => this.formatDiscoverPost(post, userId)));

    return {
      items,
      pagination: buildPagination(page, limit, total),
    };
  }

  async getDiscoverPostById(postId, viewerUserId) {
    const post = await this.getDiscoverPostOrThrow(postId);
    return this.formatDiscoverPost(post, viewerUserId);
  }

  async updateDiscoverPost(postId, userId, payload) {
    const post = await this.getDiscoverPostOrThrow(postId);
    this.assertOwnership(post.user_id, userId, "You can only update your own discover post.");

    if (post.status !== "open") {
      throw createHttpError(HTTP_STATUS.BAD_REQUEST, "Only open discover posts can be updated.");
    }

    [
      "sport",
      "location",
      "time_type",
      "skill_level",
      "match_type",
      "status",
    ].forEach((field) => {
      if (payload[field] !== undefined) {
        post[field] = typeof payload[field] === "string" ? String(payload[field]).trim() : payload[field];
      }
    });

    if (payload.time !== undefined) {
      post.time = new Date(payload.time);
    }

    if (payload.number_of_players !== undefined) {
      post.number_of_players = Number(payload.number_of_players);
    }

    if (payload.content !== undefined) {
      post.content = String(payload.content).trim();
    }

    await post.save();
    return this.formatDiscoverPost(post, userId);
  }

  async closeDiscoverPost(postId, userId) {
    const post = await this.getDiscoverPostOrThrow(postId);
    this.assertOwnership(post.user_id, userId, "You can only close your own discover post.");

    if (post.status !== "open") {
      throw createHttpError(HTTP_STATUS.BAD_REQUEST, "Only open discover posts can be closed.");
    }

    post.status = "closed";
    await post.save();

    return this.formatDiscoverPost(post, userId);
  }

  async deleteDiscoverPost(postId, userId) {
    const post = await this.getDiscoverPostOrThrow(postId);
    this.assertOwnership(post.user_id, userId, "You can only delete your own discover post.");

    await DiscoverPost.deleteOne({ _id: post._id });
    return { message: "Discover post deleted successfully." };
  }

  async contactDiscoverPost(postId, userId, io) {
    const post = await this.getDiscoverPostOrThrow(postId);

    if (String(post.user_id) === String(userId)) {
      throw createHttpError(HTTP_STATUS.BAD_REQUEST, "You cannot contact your own discover post.");
    }

    if (post.status !== "open") {
      throw createHttpError(
        HTTP_STATUS.BAD_REQUEST,
        "This discover post is not available for contact."
      );
    }

    const [conversation, peer, formattedPost] = await Promise.all([
      chatService.createOrGetDirectConversation(userId, post.user_id),
      this.getUserSummary(post.user_id),
      this.formatDiscoverPost(post, userId),
    ]);

    if (io) {
      const payload = {
        post: formattedPost,
        conversation,
        peer,
      };
      io.to(this.getUserRoom(userId)).emit(SOCKET_EVENTS.DISCOVER_CONTACT_STARTED, payload);
      io.to(this.getUserRoom(String(post.user_id))).emit(SOCKET_EVENTS.DISCOVER_CONTACT_STARTED, payload);
    }

    return {
      post: formattedPost,
      conversation,
      peer,
    };
  }

  async getMatchSummaryForUser(match, userId) {
    const participants = await MatchParticipant.find({ match_id: match._id }).lean();
    const peerParticipant = participants.find(
      (participant) => String(participant.user_id) !== String(userId)
    );
    const [partner, peerRequest] = peerParticipant
      ? await Promise.all([
          this.getUserSummary(peerParticipant.user_id),
          MatchRequest.findOne({
            _id: { $in: match.request_ids },
            user_id: peerParticipant.user_id,
          }),
        ])
      : [null, null];

    return this.formatMatchSummary(match, match.conversation_id, partner, peerRequest || match);
  }

  async getUserSummary(userId, session = null) {
    const [user, profile, ratingRows] = await Promise.all([
      User.findById(userId).select("email").session(session),
      Profile.findOne({ user_id: userId }).select("name reputation_score").session(session),
      MatchRating.aggregate([
        { $match: { rated_user_id: new mongoose.Types.ObjectId(String(userId)) } },
        {
          $group: {
            _id: "$rated_user_id",
            averageRating: { $avg: "$rating" },
            ratingCount: { $sum: 1 },
          },
        },
      ]).session(session),
    ]);

    if (!user) {
      return null;
    }

    const ratingStats = ratingRows[0];

    return {
      id: String(user._id),
      email: user.email,
      name: profile?.name || null,
      rating: ratingStats ? Number(ratingStats.averageRating.toFixed(2)) : profile?.reputation_score || 0,
      matchCount: ratingStats?.ratingCount || 0,
    };
  }

  formatMatchRequest(request) {
    return {
      id: String(request._id),
      userId: String(request.user_id),
      sport: request.sport,
      location: request.location,
      locationLat: request.location_lat,
      locationLng: request.location_lng,
      searchRadiusKm: request.search_radius_km,
      time: request.time,
      timeType: request.time_type,
      skillLevel: request.skill_level,
      numberOfPlayers: request.number_of_players,
      matchType: request.match_type,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  }

  formatMatchSummary(match, conversationId, partner, locationSource = match) {
    return {
      id: String(match._id),
      sport: match.sport,
      location: locationSource.location,
      locationLat: locationSource.location_lat,
      locationLng: locationSource.location_lng,
      searchRadiusKm: locationSource.search_radius_km,
      time: match.time,
      status: match.status,
      conversationId: conversationId ? String(conversationId) : null,
      partner,
      requestIds: Array.isArray(match.request_ids)
        ? match.request_ids.map((requestId) => String(requestId))
        : [],
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
    };
  }

  async formatDiscoverPost(post, viewerUserId) {
    const author = await this.getUserSummary(post.user_id);

    return {
      id: String(post._id),
      author,
      sport: post.sport,
      location: post.location,
      time: post.time,
      timeType: post.time_type,
      skillLevel: post.skill_level,
      numberOfPlayers: post.number_of_players,
      matchType: post.match_type,
      content: post.content,
      status: post.status,
      isOwner: String(post.user_id) === String(viewerUserId),
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  async getMatchRequestOrThrow(requestId) {
    const request = await MatchRequest.findById(requestId);

    if (!request) {
      throw createHttpError(HTTP_STATUS.NOT_FOUND, "Match request not found.");
    }

    return request;
  }

  async getDiscoverPostOrThrow(postId) {
    const post = await DiscoverPost.findById(postId);

    if (!post) {
      throw createHttpError(HTTP_STATUS.NOT_FOUND, "Discover post not found.");
    }

    return post;
  }

  async assertMatchParticipant(matchId, userId) {
    const participant = await MatchParticipant.findOne({ match_id: matchId, user_id: userId }).select("_id");

    if (!participant) {
      throw createHttpError(HTTP_STATUS.FORBIDDEN, "You are not allowed to access this match.");
    }
  }

  assertOwnership(ownerId, userId, message) {
    if (String(ownerId) !== String(userId)) {
      throw createHttpError(HTTP_STATUS.FORBIDDEN, message);
    }
  }

  getUserRoom(userId) {
    return `user:${userId}`;
  }
}

module.exports = new MatchingService();
