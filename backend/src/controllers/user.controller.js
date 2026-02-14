import ApiResponse from "../utils/ApiReponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../service/cloudinary.js";
import jwt from "jsonwebtoken";

const generateRefreshAndAccessToken = async (userID) => {
  try {
    const user = await User.findById(userID);
    const AccessToken = await user.generateAccessToken();
    const RefreshToken = await user.generateRefreshToken();
    user.refreshToken = RefreshToken;
    await user.save({ validateBeforeSave: false });
    return { AccessToken, RefreshToken };
  } catch (err) {
    throw new ApiError(
      500,
      "Something went wrong while generating access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, fullName, email, password } = req.body;

  if (
    [username, fullName, email, password].some(
      (field) => !field || String(field).trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }
  console.table(req.files);
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImgLocalPath = req.files?.coverImg?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar upload failed");
  }

  let coverImg = null;
  if (coverImgLocalPath) {
    coverImg = await uploadOnCloudinary(coverImgLocalPath);
  }

  const user = await User.create({
    username,
    fullName,
    email,
    password,
    avatar: avatar.url,
    coverImg: coverImg?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "User registration failed");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if ([username, email, password].some((fields) => fields.trim() === "")) {
    throw new ApiError(401, "Fields cannot be empty");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user)
    throw new ApiError(
      404,
      "Person with this username or email does not exist"
    );

  const isPassValid = await user.isPasswordCorrect(password);

  if (!isPassValid) throw new ApiError(401, "Invalid Password");
  const { AccessToken, RefreshToken } = await generateRefreshAndAccessToken(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
  };

  console.log(AccessToken);
  console.log(RefreshToken);

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .cookie("accessToken", AccessToken, options)
    .cookie("refreshToken", RefreshToken, options)
    .json(
      new ApiResponse(200, "User logged in successfully", {
        user: loggedInUser,
        AccessToken,
        RefreshToken,
      })
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User Logged out seccessfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized Request");

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) throw new ApiError(401, "Invalid refreshToken");

    if (incomingRefreshToken !== user.refreshToken)
      throw new ApiError(401, "RefreshToken has Expired");

    const { AccessToken, RefreshToken } = await generateRefreshAndAccessToken(
      user._id
    );

    const options = {
      httpOnly: true,
    };

    return res
      .status(200)
      .cookie("accessToken", AccessToken, options)
      .cookie("refreshToken", RefreshToken)
      .json(
        new ApiResponse(200, "AccessToken refreshed Successfully", {
          refreshToken: RefreshToken,
          accessToken: AccessToken,
        })
      );
  } catch (err) {
    throw new ApiError(401, err?.message || "Invalid refreshToken");
  }
});

const changeUserPassword = asyncHandler(async (req, res) => {
  const { oldPass, newPass } = req.body;
  if (newPass === oldPass)
    throw new ApiError(
      409,
      "Old Password and New Password must not be identical"
    );

  const user = await User.findById(req.user?._id);

  const passCompare = await user.isPasswordCorrect(oldPass);
  if (!passCompare) throw new ApiError(409, "Incorrect Password");

  user.password = newPass;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, "User fetched Successfully", req.user));
});

const updateUserDetails = asyncHandler(async (req, res) => {
  const { username, fullName } = req.body;

  if (!username || !fullName)
    throw new ApiError(401, "All fields are required");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        username,
        fullName,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, "User Updated SuccessFully", user));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.avatarImg;

  if (!avatarLocalPath) throw new ApiError(400, "Avatar file missing");

  const response = await uploadOnCloudinary(avatarLocalPath);

  if (!response.url) throw new ApiError(400, "Error while uploading Avatar");
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      avatar: response.url,
    },
    { new: true }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, "Avatar updated successfully", response.url));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeUserPassword,
  getCurrentUser,
  updateUserDetails,
  updateUserAvatar,
};