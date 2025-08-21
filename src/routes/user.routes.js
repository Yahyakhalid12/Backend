import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { registerUser } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register")
    .get((req, res) => {
        res.json({ message: "Register GET endpoint working" })
    })
    .post(
        upload.fields([
            {
                name: "avatar",
                maxCount: 1
            },
            {
                name: "coverImage",
                maxCount: 1
            }
        ]),
        asyncHandler(registerUser)
    )
router.route("/login").post(asyncHandler(registerUser))


export default router;