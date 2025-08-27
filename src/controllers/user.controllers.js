import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import { mongo } from "mongoose";


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
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentUserPassword = asyncHandler(async(req,res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password change succesfully"))
})

const getCurrentUser = asyncHandler(async(req,res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetch succesfully"))
})

const updateAccountHandler = asyncHandler(async(req,res) => {
    const {fullName, email} = req.body

    if(!email && !fullName){
        throw new ApiError(400, "Fields are required")
    }

    const user = await User.findById(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
    ).select("-password")


    return res
    .status(200)
    .json(new ApiResponse(200, user, "Accounts details updated succesfully"))
})

const updateUserAvatar = asyncHandler(async(req,res) => {
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (avatar.url) {
        throw new ApiError(400, "Error while uploading an avatar")
    }

    // delete old avatar
    if(req.user?.avatar){
        await cloudinary.uploader.destroy(req.user?.avatar)
    }


    // updateUserAvatar
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated succesfully"))
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverLocalPath = req.file?.path
    if(!coverLocalPath){
        throw new ApiError(400, "Cover image is missing")
    }

    const coverImage = uploadOnCloudinary(coverLocalPath)

    if(coverImage.url){
        throw new ApiError(400, "Error while uploading cover")
    }
    
    // if cover image exsisted before then it got deleted
    if(req.user?.coverImage){
        await cloudinary.uploader.destroy(req.user?.coverImage)
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated succefully"))

})

const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params
    
    if(!username?.trim()){
        throw new ApiError(400, "Username is required")
    }
    
    const user = await User.aggregate([
        {
            $match: {
                username: username
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                SubscribersCount: {
                    $size: "$subscribers"
                },
                SubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$subscribers.subscriber"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                SubscribersCount: 1,
                SubscribedToCount: 1,
                isSubscribed: 1,
                email: 1
            }
        }
    ])
    
    if(!channel?.length){
        throw new ApiError(404, "Channel not found")
    }

    
    
    return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "User channel profile fetch successfully"))
})

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
             _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, user[0].watchHistory, "Watch History fetched successfully"))
})

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentUserPassword,
    getCurrentUser,
    updateAccountHandler,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}