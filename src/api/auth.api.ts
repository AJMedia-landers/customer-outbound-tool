import api from "./axios";
import type {
  AuthResponse,
  ProfileResponse,
  SignupResponse,
  ResendVerificationResponse,
} from "types";

export const login = (email: string, password: string) =>
  api.post<AuthResponse>("/auth/login", { email, password });

export const signup = (data: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}) => api.post<SignupResponse>("/auth/signup", data);

export const verifyEmail = (email: string, code: string) =>
  api.post<AuthResponse>("/auth/verify-email", { email, code });

export const resendVerification = (email: string) =>
  api.post<ResendVerificationResponse>("/auth/resend-verification", { email });

export const getProfile = () => api.get<ProfileResponse>("/auth/profile");
