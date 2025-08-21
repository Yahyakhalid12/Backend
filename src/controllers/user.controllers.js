import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    // get username and password from request body (frontend)
    // validation - not empty
    // check if user exists, uniqueness
    // check for images, avatar
    // upload them on cloudinary, avatar
    // encrypt password
    // create user - create user in db
    // remove pswd and fresh token field from response
    // check for user authentication
    // return response

    const { fullName, email, username, password } = req.body
    console.log("email: ", email)

    if (
        [fullName, email, username, password].some((field) => !field || field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{email}, {username}]
    })
    
    if (existedUser) {
        throw new ApiError(400, "User already exists")
    }
    
    console.log("req.files:", req.files);
    console.log("req.body:", req.body);
    
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    console.log(req.files);
    console.log("avatarLocalPath:", avatarLocalPath);
    console.log("coverImageLocalPath:", coverImageLocalPath);

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required")
    }

    console.log("Uploading avatar to cloudinary...");
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    console.log("Avatar upload result:", avatar);
    
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null
    console.log("Cover image upload result:", coverImage);

    if(!avatar) {
        throw new ApiError(400, "Avatar image upload failed")
    }

    const user = await User.create({
        avatar: avatar,
        coverImage: coverImage || "",
        email,
        fullName,
        username: username.toLowerCase(),
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user")
    }
    
    res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    )
})

export { registerUser }