import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {registerUser,
        loginUser,
        logoutUser,
        refreshAccessToken,
        changeCurrentUserPassword,
        getCurrentUser,
        updateAccountHandler,
        updateUserAvatar,
        updateUserCoverImage,
        getUserChannelProfile,
        getWatchHistory } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { requireAuth } from "../middlewares/auth.middlewares.js";
import { verify as verifyJWT } from "jsonwebtoken";

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
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentUserPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountHandler)
router.route("/update-avatar").post(verifyJWT, upload.single("/avatar"), updateUserAvatar)
router.route("/update-cover").post(verifyJWT, upload.single("/coverImage"), updateUserCoverImage)
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/watch-history").get(verifyJWT, getWatchHistory)


export default router;