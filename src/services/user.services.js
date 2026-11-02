import User from "../models/user.model.js";


export const createUser = async (userData)=>{
    const user = await User.create(userData);
    return user.toJSON();
}

export const updateUser = async (userData)=>{
    const user = await User.findByIdAndUpdate(userData.id);
    return user ? user.toJSON() : null;
}

export const findUserByEmail = async (email)=>{
    const user = await User.findOne({email}).select("+password");
    return user ? user: null;
}

export const findUserById = async (id)=>{
    const user = await User.findUserById(id).select("+refreshToken");
    return user ? user: null;
}

export const findUser = async (userData)=>{
    const user = await User.findOne(userData)
    return user ? user : null
}