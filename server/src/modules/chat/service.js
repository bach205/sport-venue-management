// Chat Service - Business logic for chat operations
const { ChatRoom, ChatMessage } = require("./model");

class ChatService {
    async getChatRooms(userId) {
        const rooms = await ChatRoom.find({
            members: userId,
        })
            .populate("createdBy", "-password_hash")
            .populate("members", "-password_hash")
            .populate("lastMessage")
            .sort({ updatedAt: -1 });

        return rooms;
    }

    async createChatRoom(userId, name, description, isPrivate = false) {
        const room = await ChatRoom.create({
            name,
            description,
            createdBy: userId,
            members: [userId],
            isPrivate,
        });

        return room.populate("createdBy", "-password_hash");
    }

    async joinChatRoom(userId, roomId) {
        const room = await ChatRoom.findById(roomId);

        if (!room) {
            throw new Error("Chat room not found");
        }

        if (!room.members.includes(userId)) {
            room.members.push(userId);
            await room.save();
        }

        return room.populate(["createdBy", "members"], "-password_hash");
    }

    async leaveChatRoom(userId, roomId) {
        const room = await ChatRoom.findById(roomId);

        if (!room) {
            throw new Error("Chat room not found");
        }

        room.members = room.members.filter((id) => id.toString() !== userId);
        await room.save();

        return room.populate(["createdBy", "members"], "-password_hash");
    }

    async sendMessage(userId, roomId, message, attachments = []) {
        // Verify user is member of room
        const room = await ChatRoom.findById(roomId);
        if (!room || !room.members.includes(userId)) {
            throw new Error("You are not a member of this room");
        }

        const msg = await ChatMessage.create({
            roomId,
            userId,
            message,
            attachments,
        });

        // Update room's lastMessage
        room.lastMessage = msg._id;
        await room.save();

        return msg.populate("userId", "-password_hash");
    }

    async getRoomMessages(roomId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const messages = await ChatMessage.find({ roomId })
            .populate("userId", "-password_hash")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await ChatMessage.countDocuments({ roomId });

        return {
            messages,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }

    async updateRoom(roomId, userId, updateData) {
        const room = await ChatRoom.findById(roomId);

        if (!room) {
            throw new Error("Chat room not found");
        }

        // Only creator can update room
        if (room.createdBy.toString() !== userId) {
            throw new Error("Only room creator can update this room");
        }

        Object.assign(room, updateData);
        await room.save();

        return room.populate(["createdBy", "members"], "-password_hash");
    }

    async deleteRoom(roomId, userId) {
        const room = await ChatRoom.findById(roomId);

        if (!room) {
            throw new Error("Chat room not found");
        }

        // Only creator can delete room
        if (room.createdBy.toString() !== userId) {
            throw new Error("Only room creator can delete this room");
        }

        await ChatMessage.deleteMany({ roomId });
        await ChatRoom.findByIdAndDelete(roomId);

        return { message: "Chat room deleted successfully" };
    }
}

module.exports = new ChatService();
