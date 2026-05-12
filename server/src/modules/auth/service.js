const crypto = require("crypto");

const { HTTP_STATUS } = require("../../constants");
const createHttpError = require("../../utils/createHttpError");
const { signToken } = require("../../utils/jwt");
const { sendMail } = require("../../utils/mailer");
const { EmailVerificationToken } = require("./model");
const { User } = require("../user/model");
const userService = require("../user/service");

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const hashToken = (token) =>
    crypto.createHash("sha256").update(token).digest("hex");

const buildVerificationUrl = (token) => {
    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
        throw new Error("Missing required environment variable: FRONTEND_URL");
    }

    const verificationUrl = new URL("/verify-email", frontendUrl);
    verificationUrl.searchParams.set("token", token);

    return verificationUrl.toString();
};

class AuthService {
    async register(email, password) {
        const normalizedEmail = normalizeEmail(email);

        // Check if user already exists
        const userExists = await User.findOne({ email: normalizedEmail });
        if (userExists) {
            if (userExists.is_verified) {
                throw createHttpError(HTTP_STATUS.BAD_REQUEST, "User already exists.");
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
                    "This email is already registered. Please check your inbox to verify your account."
                );
            }

            const verificationToken = await this.createEmailVerificationToken(userExists._id);
            await this.sendVerificationEmail(userExists.email, verificationToken.rawToken);

            return {
                message: "Your verification email had expired. A new verification email has been sent.",
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
                "Could not complete registration."
            );
        }

        const userJson = user.toJSON();
        userJson.role = role;

        return {
            message: "Registration successful. Please verify your email before logging in.",
            data: {
                user: userJson,
            },
        };
    }

    async login(email, password) {
        const normalizedEmail = normalizeEmail(email);

        // Find user by email and include password_hash field
        const user = await User.findOne({ email: normalizedEmail }).select("+password_hash");
        if (!user) {
            throw createHttpError(
                HTTP_STATUS.BAD_REQUEST,
                "Invalid email or password."
            );
        }

        // Compare passwords
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw createHttpError(
                HTTP_STATUS.BAD_REQUEST,
                "Invalid email or password."
            );
        }

        if (!user.is_verified) {
            throw createHttpError(
                HTTP_STATUS.FORBIDDEN,
                "Please verify your email before logging in."
            );
        }

        if (user.status === "banned") {
            throw createHttpError(
                HTTP_STATUS.FORBIDDEN,
                "This account has been banned."
            );
        }
        console.log(user)
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
                "Verification token is invalid."
            );
        }

        if (verificationToken.used_at) {
            throw createHttpError(
                HTTP_STATUS.BAD_REQUEST,
                "Verification token has already been used."
            );
        }

        if (verificationToken.expires_at.getTime() < Date.now()) {
            throw createHttpError(
                HTTP_STATUS.BAD_REQUEST,
                "Verification token has expired."
            );
        }

        const user = await User.findById(verificationToken.user_id);

        if (!user) {
            throw createHttpError(HTTP_STATUS.NOT_FOUND, "User not found.");
        }

        user.is_verified = true;
        await user.save();

        verificationToken.used_at = new Date();
        await verificationToken.save();

        return {
            message: "Email verified successfully.",
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
            subject: "Verify your Matchill account",
            text: `Verify your email by opening this link: ${verificationUrl}`,
            html: `
                <p>Welcome to Matchill.</p>
                <p>Please verify your email to activate your account.</p>
                <p><a href="${verificationUrl}">Verify email</a></p>
                <p>If the button does not work, copy this link into your browser:</p>
                <p>${verificationUrl}</p>
            `,
        });
    }
}

module.exports = new AuthService();
