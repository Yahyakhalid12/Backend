import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import jwt from "jsonwebtoken"


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        user.accessToken = accessToken
        await user.save({validateBeforeSave: false})

        return {
            accessToken,
            refreshToken
        }

    } catch (error) {
        throw new ApiError(500, "Something went wrong")
    }
}

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
    // console.log("email: ", email)

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

const loginUser = asyncHandler(async (req, res) => {
    // username or email, password
    // check if user exists
    // check if password is correct
    // create access token
    // create refresh token
    // return response
    const {email, username, password} = req.body

    // if(!email || !username){
    //     throw new ApiError(400, "Email or username is required")
    // }

    if(!email && !username){
        throw new ApiError(400, "Email or username is required")
    }

    const user = await User.findOne({
        $or: [{email}, {username}]
    })

    if(!user){
        throw new ApiError(404, "User not found")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if(!isPasswordCorrect){
        throw new ApiError(401, "Password is incorrect")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const LoggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, LoggedInUser, "User logged in successfully")
    )

})

const logoutUser = asyncHandler(async (req, res) => {
  // Remove refreshToken from DB
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    { new: true }
  );

   const options = {
        httpOnly: true,
        secure: true,
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, null, "User logged out successfully")
    )
});


const refreshAccessToken = asyncHandler(async (req, res) => {
    // get refresh token from cookies
    // verify refresh token
    // create new access token
    // return response

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        const options = {
            httpOnly: true,
            secure: true,
        }
            
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, null, "Access token refreshed successfully")
        )
    
    } catch (error) {
        throw new ApiError(401, "Invalid refresh token")
    }
})

export { 
    registerUser,
    loginUser,
    logoutUser
}