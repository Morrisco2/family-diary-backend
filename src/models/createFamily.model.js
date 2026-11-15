
import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            required: true
        },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
            required: true
        },

        requestedAt: {
            type: Date,
            default: Date.now
        },

        approvedAt: {
            type: Date,
            default: null
        }
    },
    { _id: false }
);


const familySchema = new mongoose.Schema({
    familyName: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },

    leader: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        role: {
            type: String,
            default: "leader",
            trim: true
        },
        imageUrl: {
            type: String,
            trim: true,
        }
    },

    members: [memberSchema]

}, { timestamps: true });

const Families = mongoose.model("Families", familySchema);

export default Families;
