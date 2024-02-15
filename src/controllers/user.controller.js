import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registeUser = asyncHandler(async (req, res) => {
  const { userName, email, fullName, password } = req.body;
  if (!userName || !email || !fullName || !password) {
    throw new ApiError(400, "All fields are required");
  }
  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }
  if (email.indexOf("@") === -1) {
    throw new ApiError(400, "Invalid email");
  }
  const existedUser = await User.findOne({
    $or: [{ email }, { userName }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(500, "Something went wrong while uploading avatar");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  const user = await User.create({
    userName: userName.toLowerCase(),
    email,
    fullName,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });
  const createdUser = await User.findById(user._id)
    .select("-password -refreshToken")
    .lean();
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating user");
  }
  res.status(201).json(new ApiResponse(200, "User created", createdUser));
});

export { registeUser };
