import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { registerUser, loginUser, logoutUser } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { requireAuth } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "cover",
            maxCount: 1
        }
    ]),
    registerUser
)
router.route("/login").post(loginUser)

// secured routes

router.route("/logout").post(requireAuth, logoutUser)



export default router;