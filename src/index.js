import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors"
import cookieParser from "cookie-parser";



// local import
import route from './routes/Routes.js'
import connectDB from "./config/DB.js";
import errorHandler from "./exceptions/errorHandler.js";

const app = express()
dotenv.config()

app.use(cookieParser());
app.use(cors(
    {
        origin: 'http://localhost:5173',
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
         credentials: true,
    },
))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(bodyParser.json())

const PORT = process.env.PORT

connectDB()

app.get('/', (req, res) => {
    console.log('the frontend is connecxted');
    res.send('welcome to family diary backend server')
})


app.use("/api/v1", route)


app.listen(PORT, () => {
    console.log('sever is running on port ', PORT);

})



app.use(errorHandler)