import api from "./axios";

export const holdSeats = ({
    journeyId,
    seatIds
}) => {
    return api.post("/bookings/hold", {
        journeyId,
        seatIds
    });
};

export const createBooking = booking => {
    return api.post("/bookings", booking);
};

export const getMyBookings = () => {
    return api.get("/bookings/my");
};

export const getBookingByPNR = pnr => {
    return api.get(
        `/bookings/pnr/${encodeURIComponent(pnr)}`
    );
};

export const cancelBooking = bookingId => {
    return api.patch(
        `/bookings/${bookingId}/cancel`
    );
};