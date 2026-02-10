import { User } from "../models/user.model.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJwt = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) throw new ApiError(401, "Unauthorized Request");

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );
    if (!user) throw new ApiError(401, "Invalid Access Token");
    req.user = user;
    next();
  } catch (err) {
    throw new ApiError(401, err?.message || "Invalid Access Token");
  }
});
