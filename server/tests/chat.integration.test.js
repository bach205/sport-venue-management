const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../app");
const { signToken } = require("../src/utils/jwt");
const { User, Profile, UserRole } = require("../src/modules/user/model");
const { Conversation, ConversationParticipant, Message } = require("../src/modules/chat/model");

let mongoServer;

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

const createUser = async (role, email, name) => {
  const user = await User.create({
    email,
    password_hash: "password123",
    is_verified: true,
  });

  await Profile.create({
    user_id: user._id,
    name,
  });

  await UserRole.create({
    user_id: user._id,
    role,
  });

  return {
    user,
    token: signToken({ id: user._id, email: user.email }),
  };
};

const createDirectConversation = async (token, targetUserId) =>
  request(app)
    .post("/api/v1/chat/conversations/direct")
    .set(authHeader(token))
    .send({ target_user_id: String(targetUserId) });

const sendMessage = async (token, conversationId, content, attachments = []) =>
  request(app)
    .post(`/api/v1/chat/conversations/${conversationId}/messages`)
    .set(authHeader(token))
    .send({ content, attachments });

beforeAll(async () => {
  process.env.JWT_SECRET = "test_secret";
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await Conversation.syncIndexes();
  await ConversationParticipant.syncIndexes();
  await Message.syncIndexes();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Chat module", () => {
  test("creates a direct conversation automatically on first request", async () => {
    const userA = await createUser("user", "chat-a1@example.com", "Alice");
    const userB = await createUser("user", "chat-b1@example.com", "Bob");

    const response = await createDirectConversation(userA.token, userB.user._id);

    expect(response.status).toBe(200);
    expect(response.body.data.type).toBe("direct");
    expect(response.body.data.peerUser).toEqual(
      expect.objectContaining({
        id: String(userB.user._id),
        email: userB.user.email,
        name: "Bob",
      })
    );

    const conversationCount = await Conversation.countDocuments({});
    const participantCount = await ConversationParticipant.countDocuments({});

    expect(conversationCount).toBe(1);
    expect(participantCount).toBe(2);
  });

  test("returns the same conversation for the same user pair", async () => {
    const userA = await createUser("user", "chat-a2@example.com", "Alice");
    const userB = await createUser("user", "chat-b2@example.com", "Bob");

    const firstResponse = await createDirectConversation(userA.token, userB.user._id);
    const secondResponse = await createDirectConversation(userB.token, userA.user._id);

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body.data.id).toBe(firstResponse.body.data.id);
    expect(await Conversation.countDocuments({})).toBe(1);
  });

  test("rejects self chat and unknown target users", async () => {
    const userA = await createUser("user", "chat-a3@example.com", "Alice");
    const unknownId = new mongoose.Types.ObjectId();

    const selfResponse = await createDirectConversation(userA.token, userA.user._id);
    const unknownResponse = await createDirectConversation(userA.token, unknownId);

    expect(selfResponse.status).toBe(400);
    expect(selfResponse.body.message).toContain("yourself");
    expect(unknownResponse.status).toBe(404);
  });

  test("sends messages and lists conversations with unseen count", async () => {
    const userA = await createUser("user", "chat-a4@example.com", "Alice");
    const userB = await createUser("user", "chat-b4@example.com", "Bob");

    const conversationResponse = await createDirectConversation(userA.token, userB.user._id);
    const conversationId = conversationResponse.body.data.id;
    const sendResponse = await sendMessage(userA.token, conversationId, "Hello Bob", [
      { type: "image", url: "placeholder" },
    ]);

    expect(sendResponse.status).toBe(201);
    expect(sendResponse.body.data.status).toBe("sent");
    expect(sendResponse.body.data.attachments).toHaveLength(1);

    const listResponse = await request(app)
      .get("/api/v1/chat/conversations")
      .set(authHeader(userB.token));

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data.items).toHaveLength(1);
    expect(listResponse.body.data.items[0]).toEqual(
      expect.objectContaining({
        id: conversationId,
        unseenCount: 1,
      })
    );
    expect(listResponse.body.data.items[0].lastMessage).toEqual(
      expect.objectContaining({
        content: "Hello Bob",
        status: "sent",
      })
    );
  });

  test("marks incoming sent messages as received when the receiver fetches them", async () => {
    const userA = await createUser("user", "chat-a5@example.com", "Alice");
    const userB = await createUser("user", "chat-b5@example.com", "Bob");

    const conversationResponse = await createDirectConversation(userA.token, userB.user._id);
    const conversationId = conversationResponse.body.data.id;
    await sendMessage(userA.token, conversationId, "First");

    const fetchResponse = await request(app)
      .get(`/api/v1/chat/conversations/${conversationId}/messages`)
      .set(authHeader(userB.token));

    expect(fetchResponse.status).toBe(200);
    expect(fetchResponse.body.data.items[0]).toEqual(
      expect.objectContaining({
        content: "First",
        status: "received",
        isOwner: false,
      })
    );

    const storedMessage = await Message.findOne({ conversation_id: conversationId });
    expect(storedMessage.status).toBe("received");
    expect(storedMessage.received_at).not.toBeNull();
  });

  test("marks incoming messages as seen", async () => {
    const userA = await createUser("user", "chat-a6@example.com", "Alice");
    const userB = await createUser("user", "chat-b6@example.com", "Bob");

    const conversationResponse = await createDirectConversation(userA.token, userB.user._id);
    const conversationId = conversationResponse.body.data.id;
    await sendMessage(userA.token, conversationId, "Seen after fetch");

    await request(app)
      .get(`/api/v1/chat/conversations/${conversationId}/messages?page=1&limit=1`)
      .set(authHeader(userB.token));

    await sendMessage(userA.token, conversationId, "Seen without fetch");

    const seenResponse = await request(app)
      .post(`/api/v1/chat/conversations/${conversationId}/seen`)
      .set(authHeader(userB.token))
      .send({});

    expect(seenResponse.status).toBe(200);
    expect(seenResponse.body.data.updatedCount).toBe(2);

    const statuses = await Message.find({ conversation_id: conversationId }).sort({ createdAt: -1 });
    statuses.forEach((message) => {
      expect(message.status).toBe("seen");
      expect(message.received_at).not.toBeNull();
      expect(message.seen_at).not.toBeNull();
    });
  });

  test("rejects access from non participants", async () => {
    const userA = await createUser("user", "chat-a7@example.com", "Alice");
    const userB = await createUser("user", "chat-b7@example.com", "Bob");
    const userC = await createUser("user", "chat-c7@example.com", "Carol");

    const conversationResponse = await createDirectConversation(userA.token, userB.user._id);
    const conversationId = conversationResponse.body.data.id;
    await sendMessage(userA.token, conversationId, "Private");

    const fetchResponse = await request(app)
      .get(`/api/v1/chat/conversations/${conversationId}/messages`)
      .set(authHeader(userC.token));

    const seenResponse = await request(app)
      .post(`/api/v1/chat/conversations/${conversationId}/seen`)
      .set(authHeader(userC.token))
      .send({});

    expect(fetchResponse.status).toBe(403);
    expect(seenResponse.status).toBe(403);
  });

  test("paginates messages correctly", async () => {
    const userA = await createUser("user", "chat-a8@example.com", "Alice");
    const userB = await createUser("user", "chat-b8@example.com", "Bob");

    const conversationResponse = await createDirectConversation(userA.token, userB.user._id);
    const conversationId = conversationResponse.body.data.id;

    await sendMessage(userA.token, conversationId, "One");
    await sendMessage(userA.token, conversationId, "Two");
    await sendMessage(userA.token, conversationId, "Three");

    const response = await request(app)
      .get(`/api/v1/chat/conversations/${conversationId}/messages?page=2&limit=2`)
      .set(authHeader(userB.token));

    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0].content).toBe("One");
    expect(response.body.data.pagination).toEqual({
      page: 2,
      limit: 2,
      total: 3,
      pages: 2,
    });
  });
});
