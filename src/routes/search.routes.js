import {Router} from "express"
import authenticateJWT from "../middlewares/authenticate_jwt.middleware.js"
import searchController from "../controllers/search.controller.js"


const router = Router()


router.get("/family", authenticateJWT, searchController.familySearch);


export default router