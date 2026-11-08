import mongoose from "mongoose";

const profilePictureSchema = new mongoose.Schema({
    imageUrl: { type: String, required: true, trim: true },
    cloudinary_id: { type: String, required: true, trim: true }
}, { _id: false });

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        validate: {
            validator: (value) => /^[A-Za-z\s]+$/.test(value),
            message: "Name must contain letters and spaces only."
        }
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        index: true,
        validate: {
            validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            message: "Invalid email address."
        }
    },
    phoneNumber: {
        type: String,
        trim: true,
        default: null,
        validate: {
            validator: (value) => value === null || /^\+[1-9]\d{7,14}$/.test(value),
            message: "Invalid phone number."
        }
    },
    dob: { type: String, required: true, trim: true },
    role: {
        type: String,
        enum: ["user", "leader", "admin"],
        default: "user",
        required: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    image: {
        type: profilePictureSchema,
        default: null
    }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;