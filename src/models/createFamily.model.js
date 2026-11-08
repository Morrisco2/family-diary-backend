import mongoose from "mongoose";

const familySchema = new mongoose.Schema({
    familyName: {
        type: String,
        required: true,
        trim: true,
        unique: true,
       
    },
    leader: {
        id: {
            type: String,
            trim: true,
            requied: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        role: {
            type: String,
            requied: true,
            trim: true,
            default: 'leader'
        }
    }
})

const Families = mongoose.model('Families', familySchema);
export default Families