const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/matchill";

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✓ MongoDB connected: ${mongoUri}`);
    return mongoose;
  } catch (error) {
    console.error("✗ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDb;
