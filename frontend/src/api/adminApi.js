import api from "./axios";

export const getDashboard = () => {
    return api.get("/admin/dashboard");
};

export const getUsers = () => {
    return api.get("/admin/users");
};

export const getAdminBookings = () => {
    return api.get("/admin/bookings");
};

export const getAdminTrains = () => {
    return api.get("/admin/trains");
};