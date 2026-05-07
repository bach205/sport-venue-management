// User Controller - Handle HTTP requests
const { HTTP_STATUS } = require("../../constants");
const userService = require("./service");

class UserController {
    async getMe(req, res) {
        try {
            const userDetails = await userService.getUserDetails(req.user.id);

            return res.status(HTTP_STATUS.OK).json({
                message: "User profile fetched successfully.",
                data: userDetails,
            });
        } catch (error) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                message: error.message,
            });
        }
    }

    async updateProfile(req, res) {
        try {
            const updatedProfile = await userService.updateUserProfile(
                req.user.id,
                req.body
            );

            return res.status(HTTP_STATUS.OK).json({
                message: "User profile updated successfully.",
                data: updatedProfile,
            });
        } catch (error) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: error.message,
            });
        }
    }

    async searchUsers(req, res) {
        try {
            const { q, limit = 10 } = req.query;

            if (!q) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    message: "Search query is required",
                });
            }

            const users = await userService.searchUsers(q, limit);

            return res.status(HTTP_STATUS.OK).json({
                message: "Users found successfully.",
                data: users,
            });
        } catch (error) {
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                message: error.message,
            });
        }
    }
}

module.exports = new UserController();
