import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import { error } from "console";


const generateAccessandRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId)
        
        const accessToken = user.generateAccessToken()
        const refreshToken = user.refreshAccessToken()

        user.refreshToken = refreshToken // Add refreshToken in User MongoDB

        await user.save({validateBeforeSave: false})
        

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, 'Something went wrong while generating refresh and access token')
    }
}

const registerUser = asyncHandler(async(req, res)=>{
    const {fullname, email, username, password} = req.body
    console.log(fullname, username, email, password)
    
    if(
        [fullname, email, username,password].some((field)=>
        field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{username},{email}]
    })

    if(existedUser){
        throw new ApiError(409, "User already exist")
    }

    const avatar_LocalPath = req.files?.avatar[0]?.path
    // const coverImg_LocalPath = req.files?.coverImg[0]?.path

    let coverImgLocalPath;
    if(req.files && Array.isArray(req.files.coverImg)
    && req.files.coverImg.length > 0){
        coverImgLocalPath = req.files.coverImg[0].path
    }

    if(!avatar_LocalPath){
        throw new ApiError(400,'Avatar is required')
    }

    const avatar = await uploadOnCloudinary(avatar_LocalPath)
    const coverImg = await uploadOnCloudinary(coverImgLocalPath)

    if(!avatar){
        throw new ApiError(400,'Avatar is required')
    }
    

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImg: coverImg?.url || "",
        email: email,
        password: password,
        username: username.toLowerCase()
    })


    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "something went wrong while regitering user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, 'User registered succesfully')
    )


})

const loginUser = asyncHandler(async (req, res) =>{
    // req body -> data
    //username or email in login
    //find the user
    //password check
    //access and refresh token
    //send cookie

    const {email, username, password} = req.body
    if(!username && !email){
        throw new ApiError(400, "username or email required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(400,"User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    // console.log(isPasswordValid)

    if(!isPasswordValid){
        throw new ApiError(400, "Password is not valid")
    }

    const {accessToken, refreshToken} = await generateAccessandRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in successfully"
        )
    )
    })

const logoutUser = asyncHandler(async(req, res)=>{
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    refreshToken: undefined
                }
            },
            {
                new: true
            }
        )

        const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(new ApiResponse(200, {}, 'User logged out successfully'))

})

const refreshAccessToken = asyncHandler(async(req, res)=>{
    // console.log('k')
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    // console.log(incomingRefreshToken)

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorised Request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid RefreshToken")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "RefreshToken is expired or used")
        }
    
        const options={
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessandRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, newRefreshToken},
                "Accesstoken refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || 
            'Invalid refresh token'
        )
    }

})

const changePassword = asyncHandler(async(req, res)=>{
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password") 
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "password changed successfully"))

})

const getCurrentUser = asyncHandler(async (req, res)=>{
    return res
            .status(200)
            .json(200, req.user, "current user fetched successfully")
})

const updateAccountDetalis = asyncHandler(async(req, res)=>{
    const {fullname, email} = req.body

    if(!fullname || !email){
        throw new ApiError(400, "All fields are required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email
            }
        },
        {new: true}
    ).select("-password")

    return res
            .status(200)
            .json(new ApiResponse(200, user, "Account details updated successfully"))
})


export  {registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateAccountDetalis
}