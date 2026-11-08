import mongoose from 'mongoose';

// local modules 
import CONFIG from './config.js';
import appError from '../exceptions/appError.js';
import statusCode from '../constants/statusCode.js';

const connectDB = async () => {
    try {
        await mongoose.connect(CONFIG.ENV.MONGO_URL);
        console.log('MongoDB connected successfully');

    } catch (error) {
       console.error("MongoDB connection failed:", error.message);
        throw new appError("failed to connect to database, please try again", statusCode.INTERNAL_SERVER_ERROR)
    }
}

export default connectDB