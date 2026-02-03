import ApiResponse from "../utils/ApiReponse.js";
import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/apiError.js";
import { User } from "../models/user.model.js"
import uploadOnCloudinary from "../service/cloudinary.js";

const registerUser = asyncHandler( async(req, res) => {
    const { username, fullName, email, password } = req.body

    if(
        [username, fullName, email, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "Fields can't be empty")
    }

    const existingUser = User.findOne({
        $or: [username, email]
    })

    if(existingUser) throw new ApiError(409, "User Already exists")

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImgLocalPath = req.files?.coverImg[0]?.path

    if (!avatarLocalPath) throw new ApiError(400, "Avatar Image is Required")

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (coverImgLocalPath) {const coverImg = await uploadOnCloudinary(coverImgLocalPath)}
    if (!avatar) throw new ApiError(400, "Avatar is Required")
    
    const user = await User.create({
        username: username,
        fullName: fullName,
        avatar: avatar.url,
        coverImg: coverImg?.url || "",
        email: email,
        username: username
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) throw new ApiError(500, "Something went Wrong While registering the user")

    return res.status(201).json(
        new ApiResponse(200, data = createdUser, message= "User registered successfully" )
    )
})


export { registerUser }