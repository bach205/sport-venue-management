// Auth Controller - Handle HTTP requests
const {
    validateRegisterPayload,
    validateLoginPayload,
    validateVerifyEmailPayload,
} = require("../../validations/auth.validation");
const authService = require("./service");
const { HTTP_STATUS } = require("../../constants");

class AuthController {
    async register(req, res) {
        const { isValid, errors } = validateRegisterPayload(req.body);

        if (!isValid) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
        }

        try {
            const result = await authService.register(req.body.email, req.body.password);

            return res.status(HTTP_STATUS.CREATED).json({
                message: result.message,
                data: result.data,
            });
        } catch (error) {
            return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
                message: error.message,
            });
        }
    }

    async login(req, res) {
        const { isValid, errors } = validateLoginPayload(req.body);

        if (!isValid) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
        }

        try {
            const result = await authService.login(req.body.email, req.body.password);

            return res.status(HTTP_STATUS.OK).json({
                message: "Login successful.",
                data: result,
            });
        } catch (error) {
            return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
                message: error.message,
            });
        }
    }

    async verifyEmail(req, res) {
        const { isValid, errors } = validateVerifyEmailPayload(req.body);

        if (!isValid) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors });
        }

        try {
            const result = await authService.verifyEmail(req.body.token);

            return res.status(HTTP_STATUS.OK).json({
                message: result.message,
                data: result.data,
            });
        } catch (error) {
            return res.status(error.statusCode || HTTP_STATUS.BAD_REQUEST).json({
                message: error.message,
            });
        }
    }

    async logout(req, res) {
        return res.status(HTTP_STATUS.OK).json({
            message: "Logout successful.",
        });
    }
}

module.exports = new AuthController();
