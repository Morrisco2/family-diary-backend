import { Router } from "express";

// local import 
import treeMiddleware from "../middlewares/tree.middleware.js";
  

const router = Router();

// family tree routes
router.use(treeMidlewares)
router.post('/family-tree', treeController.createNode);


export default router