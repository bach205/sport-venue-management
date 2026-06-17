const crypto = require("crypto");

const { HTTP_STATUS } = require("../../constants");
const createHttpError = require("../../utils/createHttpError");
const { signToken } = require("../../utils/jwt");
const { sendMail } = require("../../utils/mailer");
const { EmailVerificationToken, PasswordResetToken } = require("./model");
const { User } = require("../user/model");
const userService = require("../user/service");

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const hashToken = (token) =>
    crypto.createHash("sha256").update(token).digest("hex");

const buildVerificationUrl = (token) => {
    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
        throw new Error("Thiếu biến môi trường bắt buộc: FRONTEND_URL");
    }

    const verificationUrl = new URL("/verify-email", frontendUrl);
    verificationUrl.searchParams.set("token", token);

    return verificationUrl.toString();
};

const buildResetPasswordUrl = (token) => {
    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
        throw new Error("Thiếu biến môi trường bắt buộc: FRONTEND_URL");
    }

    const resetUrl = new URL("/reset-password", frontendUrl);
    resetUrl.searchParams.set("token", token);

    return resetUrl.toString();
};

class AuthService {
    async register(email, password) {
        const normalizedEmail = normalizeEmail(email);

        const userExists = await User.findOne({ email: normalizedEmail });
        if (userExists) {
            if (userExists.is_verified) {
                throw createHttpError(HTTP_STATUS.BAD_REQUEST, "Người dùng đã tồn tại.");
            }

            const activeVerificationToken = await this.getLatestUnusedVerificationToken(
                userExists._id
            );

            if (
                activeVerificationToken &&
                activeVerificationToken.expires_at.getTime() >= Date.now()
            ) {
                throw createHttpError(
                    HTTP_STATUS.BAD_REQUEST,
                    "Email này đã được đăng ký. Vui lòng kiểm tra hộp thư đến để xác thực tài khoản của bạn."
                );
            }

            const verificationToken = await this.createEmailVerificationToken(userExists._id);
            await this.sendVerificationEmail(userExists.email, verificationToken.rawToken);

            return {
                message: "Email xác thực của bạn đã hết hạn. Một email xác thực mới đã được gửi.",
                data: {
                    user: userExists.toJSON(),
                },
            };
        }

        let user;
        let verificationToken;

        try {
            user = await User.create({ email: normalizedEmail, password_hash: password });
            await userService.createDefaultProfile(user._id, user.email);
            verificationToken = await this.createEmailVerificationToken(user._id);
            await this.sendVerificationEmail(user.email, verificationToken.rawToken);
        } catch (error) {
            if (user) {
                await EmailVerificationToken.deleteMany({ user_id: user._id });
                await userService.deleteProfileByUserId?.(user._id);
                await User.findByIdAndDelete(user._id);
            }

            if (error.statusCode) {
                throw error;
            }

            throw createHttpError(
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                "Không thể hoàn tất đăng ký."
            );
        }

        return {
            message: "Đăng ký thành công. Vui lòng xác thực email trước khi đăng nhập.",
            data: {
                user: user.toJSON(),
            },
        };
    }

    async login(email, password) {
        const normalizedEmail = normalizeEmail(email);

        const user = await User.findOne({ email: normalizedEmail }).select("+password_hash");
        if (!user) {
            throw createHttpError(
                HTTP_STATUS.BAD_REQUEST,
                "Email hoặc mật khẩu không hợp lệ."
            );
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw createHttpError(
                HTTP_STATUS.BAD_REQUEST,
                "Email hoặc mật khẩu không hợp lệ."
            );
        }

        if (!user.is_verified) {
            throw createHttpError(
                HTTP_STATUS.FORBIDDEN,
                "Vui lòng xác thực email trước khi đăng nhập."
            );
        }

        if (user.status === "banned") {
            throw createHttpError(
                HTTP_STATUS.FORBIDDEN,
                "Tài khoản này đã bị khóa."
            );
        }
        const profile = await userService.getUserProfile(user._id);
        const role = await userService.getUserRole(user._id);
        const token = signToken({ email: user.email, id: user._id, role: role });

        const userJson = user.toJSON();
        userJson.role = role;

        return {
            token,
            user: userJson,
            profile: profile.toObject(),
        };
    }

    async verifyEmail(token) {
        const tokenHash = hashToken(token);
        const verificationToken = await EmailVerificationToken.findOne({
            token_hash: tokenHash,
        });

        if (!verificationToken) {
            throw createHttpError(
                HTTP_STATUS.BAD_REQUEST,
                "Mã xác thực không hợp lệ."
            );
        }

        if (verificationToken.used_at) {
            throw createHttpError(
                HTTP_STATUS.BAD_REQUEST,
                "Mã xác thực đã được sử dụng."
            );
        }

        if (verificationToken.expires_at.getTime() < Date.now()) {
            throw createHttpError(
                HTTP_STATUS.BAD_REQUEST,
                "Mã xác thực đã hết hạn."
            );
        }

        const user = await User.findById(verificationToken.user_id);

        if (!user) {
            throw createHttpError(HTTP_STATUS.NOT_FOUND, "Không tìm thấy người dùng.");
        }

        user.is_verified = true;
        await user.save();

        verificationToken.used_at = new Date();
        await verificationToken.save();

        return {
            message: "Xác thực email thành công.",
            data: {
                user: user.toJSON(),
            },
        };
    }

    async createEmailVerificationToken(userId) {
        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = hashToken(rawToken);

        await EmailVerificationToken.deleteMany({ user_id: userId, used_at: null });

        const verificationToken = await EmailVerificationToken.create({
            user_id: userId,
            token_hash: tokenHash,
            expires_at: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
        });

        return {
            rawToken,
            token: verificationToken,
        };
    }

    async getLatestUnusedVerificationToken(userId) {
        return EmailVerificationToken.findOne({
            user_id: userId,
            used_at: null,
        }).sort({ createdAt: -1 });
    }

    async sendVerificationEmail(email, token) {
        const verificationUrl = buildVerificationUrl(token);

        await sendMail({
            to: email,
            subject: "Xác thực tài khoản Matchill của bạn",
            text: `Xác thực email của bạn bằng cách mở liên kết này: ${verificationUrl}`,
            html: `
                <p>Chào mừng bạn đến với Matchill.</p>
                <p>Vui lòng xác thực email để kích hoạt tài khoản của bạn.</p>
                <p><a href="${verificationUrl}">Xác thực email</a></p>
                <p>Nếu nút không hoạt động, hãy sao chép liên kết này vào trình duyệt của bạn:</p>
                <p>${verificationUrl}</p>
            `,
        });
    }

    async forgotPassword(email) {
        const normalizedEmail = normalizeEmail(email);
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return { message: "Nếu email của bạn đã được đăng ký, một liên kết đặt lại mật khẩu đã được gửi đi." };
        }

        const resetToken = await this.createPasswordResetToken(user._id);
        await this.sendPasswordResetEmail(user.email, resetToken.rawToken);

        return { message: "Nếu email của bạn đã được đăng ký, một liên kết đặt lại mật khẩu đã được gửi đi." };
    }

    async resetPassword(token, newPassword) {
        const tokenHash = hashToken(token);
        const resetTokenDoc = await PasswordResetToken.findOne({
            token_hash: tokenHash,
        });

        if (!resetTokenDoc) {
            throw createHttpError(HTTP_STATUS.BAD_REQUEST, "Mã đặt lại mật khẩu không hợp lệ.");
        }

        if (resetTokenDoc.used_at) {
            throw createHttpError(HTTP_STATUS.BAD_REQUEST, "Mã đặt lại mật khẩu đã được sử dụng.");
        }

        if (resetTokenDoc.expires_at.getTime() < Date.now()) {
            throw createHttpError(HTTP_STATUS.BAD_REQUEST, "Mã đặt lại mật khẩu đã hết hạn.");
        }

        const user = await User.findById(resetTokenDoc.user_id);

        if (!user) {
            throw createHttpError(HTTP_STATUS.NOT_FOUND, "Không tìm thấy người dùng.");
        }

        user.password_hash = newPassword;
        await user.save();

        resetTokenDoc.used_at = new Date();
        await resetTokenDoc.save();

        return {
            message: "Mật khẩu đã được đặt lại thành công.",
        };
    }

    async createPasswordResetToken(userId) {
        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = hashToken(rawToken);

        await PasswordResetToken.deleteMany({ user_id: userId, used_at: null });

        const resetToken = await PasswordResetToken.create({
            user_id: userId,
            token_hash: tokenHash,
            expires_at: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
        });

        return {
            rawToken,
            token: resetToken,
        };
    }

    async sendPasswordResetEmail(email, token) {
        const resetUrl = buildResetPasswordUrl(token);

        await sendMail({
            to: email,
            subject: "Đặt lại mật khẩu Matchill của bạn",
            text: `Đặt lại mật khẩu của bạn bằng cách mở liên kết này: ${resetUrl}`,
            html: `
                <p>Xin chào từ Matchill.</p>
                <p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng nhấp vào liên kết bên dưới để thiết lập mật khẩu mới.</p>
                <p><a href="${resetUrl}">Đặt lại mật khẩu</a></p>
                <p>Nếu bạn không yêu cầu thao tác này, vui lòng bỏ qua email này.</p>
                <p>Nếu nút không hoạt động, hãy sao chép liên kết này vào trình duyệt của bạn:</p>
                <p>${resetUrl}</p>
            `,
        });
    }
}

module.exports = new AuthService();
