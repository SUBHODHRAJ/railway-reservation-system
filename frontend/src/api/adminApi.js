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
export const getAdminJourneys = () => {
    return api.get("/admin/journeys");
};

export const updateAdminJourneyStatus = (
    journeyId,
    status
) => {
    return api.patch(
        `/admin/journeys/${journeyId}/status`,
        { status }
    );
};
export const updateUserRole = (
    userId,
    role
) => {
    return api.patch(
        `/admin/users/${userId}/role`,
        { role }
    );
};