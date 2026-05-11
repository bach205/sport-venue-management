const Redis = require("ioredis");

const redisConfig = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

const pubClient = new Redis(redisConfig);
const subClient = new Redis(redisConfig);

const connectRedis = async () => {
  try {
    await pubClient.ping();
    console.log("✅ Redis connected successfully");
  } catch (error) {
    console.error("❌ Redis connection error:", error);
  }
};

module.exports = {
  connectRedis,
  pubClient,
  subClient,
};
