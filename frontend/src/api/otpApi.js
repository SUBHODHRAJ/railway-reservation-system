import api from "./axios";

export const sendOTP = () =>
    api.post("/otp/send");

export const verifyOTP = otp =>
    api.post("/otp/verify", { otp });
