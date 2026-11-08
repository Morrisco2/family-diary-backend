import User from "../models/user.model.js";

export const createUser = async (userData) => {
    const user = await User.create(userData);
    const safeUser = user.toObject();
    delete safeUser.password;
    return safeUser;
};

export const updateUser = async (userData) => {
    const { id, ...updates } = userData;
    const user = await User.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true
    });
    return user;
};

export const findUserByEmail = async (email) => {
    return await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
};

export const findUserById = async (id) => {
    return await User.findById(id).select("-password");
};

export const findUser = async (userData) => {
    return await  User.findOne(userData).select("-password");
};
