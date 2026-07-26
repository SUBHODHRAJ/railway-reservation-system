import api from "./axios";

export const createPayment = bookingId => {
    return api.post("/payments/create", {
        bookingId
    });
};

export const completePayment = (
    paymentId,
    success
) => {
    return api.post("/payments/complete", {
        paymentId,
        success
    });
};