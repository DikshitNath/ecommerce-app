
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model";

export class AuthServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AuthServiceError";
    this.statusCode = statusCode;
  }
}

const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const expiresIn = (process.env.JWT_EXPIRES_IN || "1h") as jwt.SignOptions["expiresIn"];

  return jwt.sign({ userId }, secret, { expiresIn });
};

export const registerUser = async (
  name: string,
  email: string,
  password: string
) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new AuthServiceError("Email is already registered", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = generateToken(user._id.toString());

    return {
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    };
  } catch (error: unknown) {
    // Handle duplicate email if two registrations happen simultaneously.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new AuthServiceError("Email is already registered", 409);
    }

    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
  }).select("+password");

  if (!user) {
    throw new AuthServiceError("Invalid email or password", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AuthServiceError("Invalid email or password", 401);
  }

  const token = generateToken(user._id.toString());

  return {
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    },
  };
};
