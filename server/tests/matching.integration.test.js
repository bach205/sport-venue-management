const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../app");
const { signToken } = require("../src/utils/jwt");
const { SOCKET_EVENTS } = require("../src/constants");
const { User, Profile, UserRole } = require("../src/modules/user/model");
const { MatchRequest, Match, MatchParticipant, MatchRating, DiscoverPost } = require("../src/modules/matching/model");
const { Conversation, ConversationParticipant } = require("../src/modules/chat/model");

let mongoServer;

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

const createUser = async (role, email, name) => {
  const user = await User.create({
    email,
    password_hash: "password123",
    is_verified: true,
  });

  await Profile.create({ user_id: user._id, name });
  await UserRole.create({ user_id: user._id, role });

  return {
    user,
    token: signToken({ id: user._id, email: user.email }),
  };
};

const validRequestPayload = (overrides = {}) => ({
  sport: "football",
  location: "District 1",
  time: "2026-05-12T12:00:00.000Z",
  time_type: "fixed",
  skill_level: "intermediate",
  number_of_players: 1,
  match_type: "opponent",
  ...overrides,
});

const validDiscoverPayload = (overrides = {}) => ({
  ...validRequestPayload({ number_of_players: 2, match_type: "teammate" }),
  content: "Need two more players for this evening.",
  ...overrides,
});

const createIoRecorder = () => {
  const events = [];

  return {
    events,
    io: {
      to(room) {
        return {
          emit(event, payload) {
            events.push({ room, event, payload });
          },
        };
      },
    },
  };
};

beforeAll(async () => {
  process.env.JWT_SECRET = "test_secret";
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await MatchRequest.syncIndexes();
  await Match.syncIndexes();
  await MatchParticipant.syncIndexes();
  await MatchRating.syncIndexes();
  await DiscoverPost.syncIndexes();
  await Conversation.syncIndexes();
  await ConversationParticipant.syncIndexes();
});

afterEach(async () => {
  app.set("io", undefined);
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Matching module", () => {
  test("creates a pending match request when no partner exists", async () => {
    const user = await createUser("user", "match-a1@example.com", "Alice");

    const response = await request(app)
      .post("/api/v1/matching/requests")
      .set(authHeader(user.token))
      .send(validRequestPayload());

    expect(response.status).toBe(201);
    expect(response.body.data.request.status).toBe("pending");
    expect(response.body.data.match).toBeNull();
    expect(await MatchRequest.countDocuments({ status: "pending" })).toBe(1);
  });

  test("matches two compatible requests and creates a direct conversation", async () => {
    const userA = await createUser("user", "match-a2@example.com", "Alice");
    const userB = await createUser("user", "match-b2@example.com", "Bob");

    await request(app)
      .post("/api/v1/matching/requests")
      .set(authHeader(userA.token))
      .send(validRequestPayload());

    const response = await request(app)
      .post("/api/v1/matching/requests")
      .set(authHeader(userB.token))
      .send(validRequestPayload({ time: "2026-05-12T13:30:00.000Z" }));

    expect(response.status).toBe(201);
    expect(response.body.data.match).not.toBeNull();
    expect(response.body.data.conversation).not.toBeNull();
    expect(response.body.data.partner.email).toBe(userA.user.email);
    expect(await Match.countDocuments({})).toBe(1);
    expect(await Conversation.countDocuments({})).toBe(1);
    expect(await MatchParticipant.countDocuments({})).toBe(2);
    expect(await MatchRequest.countDocuments({ status: "matched" })).toBe(2);
  });

  test("matches compatible requests by coordinates within search radius", async () => {
    const userA = await createUser("user", "match-a-map@example.com", "Alice");
    const userB = await createUser("user", "match-b-map@example.com", "Bob");

    await request(app)
      .post("/api/v1/matching/requests")
      .set(authHeader(userA.token))
      .send(validRequestPayload({
        location: "Nguyen Hue Walking Street",
        location_lat: 10.7758,
        location_lng: 106.7039,
        search_radius_km: 5,
      }));

    const response = await request(app)
      .post("/api/v1/matching/requests")
      .set(authHeader(userB.token))
      .send(validRequestPayload({
        location: "Ben Thanh Market",
        location_lat: 10.7721,
        location_lng: 106.6983,
        search_radius_km: 5,
      }));

    expect(response.status).toBe(201);
    expect(response.body.data.match).not.toBeNull();
    expect(response.body.data.match.location).toBe("Nguyen Hue Walking Street");
    expect(response.body.data.match.locationLat).toBe(10.7758);
    expect(response.body.data.match.searchRadiusKm).toBe(5);
    expect(await Match.countDocuments({})).toBe(1);
    expect(await MatchRequest.countDocuments({ status: "matched" })).toBe(2);
  });

  test("uses the selected radius and emits authoritative realtime match events", async () => {
    const userA = await createUser("user", "match-a-radius@example.com", "Alice");
    const userB = await createUser("user", "match-b-radius@example.com", "Bob");
    const recorder = createIoRecorder();
    app.set("io", recorder.io);

    const firstResponse = await request(app)
      .post("/api/v1/matching/requests")
      .set(authHeader(userA.token))
      .send(validRequestPayload({
        location: "Nguyen Hue Walking Street",
        location_lat: 10.7758,
        location_lng: 106.7039,
        search_radius_km: 1,
      }));

    const secondResponse = await request(app)
      .post("/api/v1/matching/requests")
      .set(authHeader(userB.token))
      .send(validRequestPayload({
        location: "Nearby Sports Center",
        location_lat: 10.7958,
        location_lng: 106.7039,
        search_radius_km: 5,
      }));

    expect(firstResponse.body.data.request.searchRadiusKm).toBe(1);
    expect(secondResponse.body.data.match).toBeNull();
    expect(await Match.countDocuments({})).toBe(0);

    const matchedResponse = await request(app)
      .post("/api/v1/matching/requests")
      .set(authHeader(userA.token))
      .send(validRequestPayload({
        location: "Nguyen Hue Walking Street",
        location_lat: 10.7758,
        location_lng: 106.7039,
        search_radius_km: 5,
      }));

    expect(matchedResponse.body.data.match).not.toBeNull();
    expect(matchedResponse.body.data.match.location).toBe("Nearby Sports Center");
    expect(matchedResponse.body.data.match.searchRadiusKm).toBe(5);

    const matchedEvents = recorder.events.filter(
      ({ event }) => event === SOCKET_EVENTS.MATCHING_REQUEST_MATCHED
    );
    expect(matchedEvents).toHaveLength(2);
    expect(matchedEvents.map(({ room }) => room).sort()).toEqual(
      [`user:${userA.user._id}`, `user:${userB.user._id}`].sort()
    );

    const eventForUserA = matchedEvents.find(({ room }) => room === `user:${userA.user._id}`);
    const eventForUserB = matchedEvents.find(({ room }) => room === `user:${userB.user._id}`);
    expect(eventForUserA.payload.match.location).toBe("Nearby Sports Center");
    expect(eventForUserB.payload.match.location).toBe("Nguyen Hue Walking Street");

    const matchId = matchedResponse.body.data.match.id;
    const [matchForUserA, matchForUserB] = await Promise.all([
      request(app)
        .get(`/api/v1/matching/matches/${matchId}`)
        .set(authHeader(userA.token)),
      request(app)
        .get(`/api/v1/matching/matches/${matchId}`)
        .set(authHeader(userB.token)),
    ]);

    expect(matchForUserA.body.data.location).toBe("Nearby Sports Center");
    expect(matchForUserB.body.data.location).toBe("Nguyen Hue Walking Street");
  });

  test("allows participants to rate their matched partner", async () => {
    const userA = await createUser("user", "match-a-rating@example.com", "Alice");
    const userB = await createUser("user", "match-b-rating@example.com", "Bob");

    await request(app)
      .post("/api/v1/matching/requests")
      .set(authHeader(userA.token))
      .send(validRequestPayload());

    const matchResponse = await request(app)
      .post("/api/v1/matching/requests")
      .set(authHeader(userB.token))
      .send(validRequestPayload({ time: "2026-05-12T13:30:00.000Z" }));

    const response = await request(app)
      .post(`/api/v1/matching/matches/${matchResponse.body.data.match.id}/rating`)
      .set(authHeader(userB.token))
      .send({ rating: 5 });

    expect(response.status).toBe(200);
    expect(response.body.data.rating).toBe(5);
    expect(response.body.data.ratedUserId).toBe(String(userA.user._id));
    expect(response.body.data.ratedUserStats.averageRating).toBe(5);
    expect(await MatchRating.countDocuments({})).toBe(1);
  });

  test("cancels previous pending requests when the same user creates a new request", async () => {
    const user = await createUser("user", "match-a3@example.com", "Alice");

    await request(app)
      .post("/api/v1/matching/requests")
      .set(authHeader(user.token))
      .send(validRequestPayload());

    const response = await request(app)
      .post("/api/v1/matching/requests")
      .set(authHeader(user.token))
      .send(validRequestPayload({ time: "2026-05-12T14:00:00.000Z" }));

    expect(response.status).toBe(201);
    expect(response.body.data.request.status).toBe("pending");
    expect(await MatchRequest.countDocuments({ user_id: user.user._id, status: "pending" })).toBe(1);
    expect(await MatchRequest.countDocuments({ user_id: user.user._id, status: "cancelled" })).toBe(1);
  });

  test("lists and contacts discover posts through a reusable direct conversation", async () => {
    const owner = await createUser("user", "discover-a1@example.com", "Alice");
    const viewer = await createUser("user", "discover-b1@example.com", "Bob");

    const createResponse = await request(app)
      .post("/api/v1/matching/discover-posts")
      .set(authHeader(owner.token))
      .send(validDiscoverPayload());

    const postId = createResponse.body.data.id;

    const listResponse = await request(app)
      .get("/api/v1/matching/discover-posts")
      .set(authHeader(viewer.token));

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data.items).toHaveLength(1);

    const firstContact = await request(app)
      .post(`/api/v1/matching/discover-posts/${postId}/contact`)
      .set(authHeader(viewer.token))
      .send({});

    const secondContact = await request(app)
      .post(`/api/v1/matching/discover-posts/${postId}/contact`)
      .set(authHeader(viewer.token))
      .send({});

    expect(firstContact.status).toBe(200);
    expect(secondContact.status).toBe(200);
    expect(secondContact.body.data.conversation.id).toBe(firstContact.body.data.conversation.id);
    expect(await Conversation.countDocuments({})).toBe(1);
  });

  test("prevents contacting your own discover post", async () => {
    const owner = await createUser("user", "discover-a2@example.com", "Alice");

    const createResponse = await request(app)
      .post("/api/v1/matching/discover-posts")
      .set(authHeader(owner.token))
      .send(validDiscoverPayload());

    const response = await request(app)
      .post(`/api/v1/matching/discover-posts/${createResponse.body.data.id}/contact`)
      .set(authHeader(owner.token))
      .send({});

    expect(response.status).toBe(400);
  });
});
