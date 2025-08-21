import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
        // get username and password from request body (frontend)
        // validation - not empty
        // check if user exsist, uniqueness
        // check for images, avatar
        // upload them on cloudinary, avatar
        // encrypt password
        // create user - create user in db
        // remove pswd and fresh token feild from response
        // check for user authentication
        // return response

        const { fullName, email, username, password } = req.body
        console.log("email: ", email)

        if (
            [fullName, email, username, password].some((field) => field?.trim() === "")
        ) {
            throw new ApiError("All fields are required", 400)
        }

        const exsistedUser = User.findOne({
            $or: [{email}, {username}] })
        if (exsistedUser) {
            throw new ApiError("User already exsists", 400)
        }
        
        const avatarLocalPath = req.files?.avatar[0].path;
        const coverImageLocalPath = req.files?.coverImage[0].path;

    if(!avatarLocalPath) {
        throw new ApiError("Avatar image is required", 400)}

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) {
        throw new ApiError("Avatar image is required", 400)}

    const user = await User.create({
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        fullName,
        username: username.toLowerCase(),
        password
    })

    const createdUser = await user.findByID(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiError("Something went wrong while registering user", 500)
    }
    res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

})

export { registerUser }