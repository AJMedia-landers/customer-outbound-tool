import api from "./axios";
import type { AuthResponse, ProfileResponse } from "types";

export const login = (email: string, password: string) =>
  api.post<AuthResponse>("/auth/login", { email, password });

export const signup = (data: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}) => api.post<AuthResponse>("/auth/signup", data);

export const getProfile = () => api.get<ProfileResponse>("/auth/profile");
