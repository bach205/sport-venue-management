const { User, Profile, UserRole } = require("./model");

class UserService {
    async getUserProfile(userId) {
        let profile = await Profile.findOne({ user_id: userId }).populate(
            "user_id",
            "-password_hash"
        );

        if (!profile) {
            // Create default profile if not exists
            profile = await Profile.create({ user_id: userId, name: "New User" });
            profile = await profile.populate("user_id", "-password_hash");
        }

        return profile;
    }

    async updateUserProfile(userId, updateData) {
        let profile = await Profile.findOne({ user_id: userId });

        if (!profile) {
            profile = await Profile.create({ user_id: userId, ...updateData });
        } else {
            Object.assign(profile, updateData);
            await profile.save();
        }

        return profile.populate("user_id", "-password_hash");
    }

    async createDefaultProfile(userId, email) {
        const existingProfile = await Profile.findOne({ user_id: userId });

        if (existingProfile) {
            return existingProfile;
        }

        const defaultName = email.split("@")[0];

        // Create default role alongside profile
        const result = await UserRole.create({ user_id: userId, role: "user" });
        return Profile.create({
            user_id: userId,
            name: defaultName,
        });
    }

    async getUserRole(userId) {
        const userRole = await UserRole.findOne({ user_id: userId });
        console.log(userRole);
        return userRole ? userRole.role : "user";
    }

    async deleteProfileByUserId(userId) {
        await Profile.deleteOne({ user_id: userId });
    }

    async getUserDetails(userId) {
        const user = await User.findById(userId);
        const profile = await this.getUserProfile(userId);

        if (!user) {
            throw new Error("User not found");
        }

        return {
            user: user.toJSON(),
            profile: profile.toObject(),
        };
    }

    async searchUsers(query, limit = 10) {
        const users = await User.find({
            $or: [
                { email: { $regex: query, $options: "i" } },
            ],
        })
            .select("-password_hash")
            .limit(limit);

        return users.map((user) => user.toJSON());
    }
}

module.exports = new UserService();
