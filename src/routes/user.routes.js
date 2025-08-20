import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { registerUser } from "../controllers/user.controllers.js";

const router = Router();

router.route("/register").post(asyncHandler(registerUser))
router.route("/login").post(asyncHandler(registerUser))


export default router;