const { ViewCounter } = require("./model");

class ViewService {
  async trackView(payload) {
    const counter = await ViewCounter.findOneAndUpdate(
      {
        target_type: payload.targetType,
        target_id: payload.targetId,
      },
      {
        $inc: { count: 1 },
        $setOnInsert: {
          target_type: payload.targetType,
          target_id: payload.targetId,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

    const total = await this.getTotalCount();

    return {
      target: {
        type: counter.target_type,
        id: counter.target_id,
        count: counter.count,
      },
      total,
    };
  }

  async getTotalCount() {
    const result = await ViewCounter.aggregate([
      { $group: { _id: null, total: { $sum: "$count" } } },
    ]);

    return result[0]?.total || 0;
  }
}

module.exports = new ViewService();
