import mongoose from 'mongoose';

// local modules 
import CONFIG from './config.js';

const connectDB = async () => {
    try {
        await mongoose.connect(CONFIG.ENV.MONGO_URL);
        console.log('MongoDB connected successfully');

    } catch (error) {
        if (error instanceof Error) {
            console.log(`Error: ${error.message}`);
            
        } else {
            console.log(`Database connection failed, error: ${err}`);

        }
    }
}

export default connectDB