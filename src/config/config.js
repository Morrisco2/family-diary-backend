import dotenv from 'dotenv';
dotenv.config({ override: true, debug: true })

const CONFIG = {
    ENV: {
        PORT: parseInt(process.env.PORT ?? '3000'),
        MONGO_URL: process.env.MONGO_URL,
        REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
        JWT_ACCESS_TOKEN_SECRET: process.env.JWT_ACCESS_TOKEN_SECRET,
        EMAIL_HOST: process.env.EMAIL_HOST,
        EMAIL_PORT: process.env.EMAIL_PORT,
        EMAIL_USER: process.env.EMAIL_USER,
        EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
        FROM_EMAIL: process.env.FROM_EMAIL,

        
        // CLOUDINARY CREDENTIALS

        CLOUD_NAME: process.env.CLOUD_NAME,
        CLOUD_API_KEY : process.env.CLOUD_API_KEY,
        CLOUD_API_SECRET : process.env.CLOUD_API_SECRET,
        CLOUD_URL : process.env.CLOUD_URL,
    }
}


export default CONFIG