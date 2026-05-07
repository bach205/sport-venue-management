// Chat Controller - Handle HTTP requests
const { HTTP_STATUS } = require("../../constants");
const chatService = require("./service");

class ChatController {
    async getRooms(req, res) {
        try {
            const rooms = await chatService.getChatRooms(req.user.id);

            return res.status(HTTP_STATUS.OK).json({
                message: "Chat rooms fetched successfully.",
                data: rooms,
            });
        } catch (error) {
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                message: error.message,
            });
        }
    }

    async createRoom(req, res) {
        try {
            const { name, description, isPrivate = false } = req.body;

            if (!name) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    message: "Chat room name is required.",
                });
            }

            const room = await chatService.createChatRoom(
                req.user.id,
                name,
                description,
                isPrivate
            );

            return res.status(HTTP_STATUS.CREATED).json({
                message: "Chat room created successfully.",
                data: room,
            });
        } catch (error) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: error.message,
            });
        }
    }

    async joinRoom(req, res) {
        try {
            const { roomId } = req.params;

            const room = await chatService.joinChatRoom(req.user.id, roomId);

            return res.status(HTTP_STATUS.OK).json({
                message: "Joined chat room successfully.",
                data: room,
            });
        } catch (error) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: error.message,
            });
        }
    }

    async leaveRoom(req, res) {
        try {
            const { roomId } = req.params;

            const room = await chatService.leaveChatRoom(req.user.id, roomId);

            return res.status(HTTP_STATUS.OK).json({
                message: "Left chat room successfully.",
                data: room,
            });
        } catch (error) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: error.message,
            });
        }
    }

    async sendMessage(req, res) {
        try {
            const { roomId } = req.params;
            const { message, attachments = [] } = req.body;

            if (!message) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    message: "Message content is required.",
                });
            }

            const msg = await chatService.sendMessage(
                req.user.id,
                roomId,
                message,
                attachments
            );

            return res.status(HTTP_STATUS.CREATED).json({
                message: "Message sent successfully.",
                data: msg,
            });
        } catch (error) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: error.message,
            });
        }
    }

    async getMessages(req, res) {
        try {
            const { roomId } = req.params;
            const { page = 1, limit = 20 } = req.query;

            const result = await chatService.getRoomMessages(
                roomId,
                parseInt(page),
                parseInt(limit)
            );

            return res.status(HTTP_STATUS.OK).json({
                message: "Messages fetched successfully.",
                data: result,
            });
        } catch (error) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: error.message,
            });
        }
    }

    async updateRoom(req, res) {
        try {
            const { roomId } = req.params;

            const room = await chatService.updateRoom(
                roomId,
                req.user.id,
                req.body
            );

            return res.status(HTTP_STATUS.OK).json({
                message: "Chat room updated successfully.",
                data: room,
            });
        } catch (error) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: error.message,
            });
        }
    }

    async deleteRoom(req, res) {
        try {
            const { roomId } = req.params;

            const result = await chatService.deleteRoom(roomId, req.user.id);

            return res.status(HTTP_STATUS.OK).json({
                message: result.message,
            });
        } catch (error) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: error.message,
            });
        }
    }
}

module.exports = new ChatController();
