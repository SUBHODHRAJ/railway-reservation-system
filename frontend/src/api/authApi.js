import api from "./axios";

export const registerUser = data =>
    api.post("/auth/register", data);

export const loginUser = data =>
    api.post("/auth/login", data);

export const getProfile = () =>
    api.get("/auth/profile");

export const updateProfile = data =>
    api.patch("/auth/profile", data);

export const changePassword = data =>
    api.patch("/auth/password", data);