import { useEffect, useState } from "react";
import {
    useNavigate,
    useParams
} from "react-router-dom";

import {
    cancelBooking,
    getBookingByPNR
} from "../api/bookingApi";

function BookingDetails() {
    const { pnr } = useParams();
    const navigate = useNavigate();

    const [booking, setBooking] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [cancelling, setCancelling] =
        useState(false);

    const [error, setError] =
        useState("");

    const loadBooking = async () => {
        try {
            const response =
                await getBookingByPNR(pnr);

            setBooking(response.data);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to load booking"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBooking();
    }, [pnr]);

    const handleCancel = async () => {
        const confirmed = window.confirm(
            "Cancel this booking? The development payment record will be marked REFUNDED and booked seats will be released."
        );

        if (!confirmed) {
            return;
        }

        setCancelling(true);
        setError("");

        try {
            await cancelBooking(booking.booking_id);
            await loadBooking();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to cancel booking"
            );
        } finally {
            setCancelling(false);
        }
    };

    if (loading) {
        return (
            <main className="route-loading">
                <div className="loading-spinner"></div>
                <p>Loading ticket...</p>
            </main>
        );
    }

    if (error && !booking) {
        return (
            <main className="page-container">
                <div className="form-error">
                    {error}
                </div>
            </main>
        );
    }

    return (
        <main className="page-container">
            <section className="ticket-card">
                <div className="ticket-header">
                    <div>
                        <p className="eyebrow">
                            TRAIN E-TICKET
                        </p>

                        <h1>
                            {booking.train_number}
                            {" — "}
                            {booking.train_name}
                        </h1>
                    </div>

                    <span
                        className={`booking-status status-${booking.status?.toLowerCase()}`}
                    >
                        {booking.status}
                    </span>
                </div>

                <div className="pnr-box">
                    <span>PNR</span>
                    <strong>{booking.pnr}</strong>
                </div>

                <div className="ticket-route">
                    <div>
                        <strong>
                            {booking.source_code} - {booking.source_name}
                        </strong>
                        <span>Source</span>
                    </div>

                    <div className="ticket-arrow">
                        →
                    </div>

                    <div>
                        <strong>
                            {booking.destination_code} - {booking.destination_name}
                        </strong>
                        <span>Destination</span>
                    </div>
                </div>

                <div className="ticket-details">
                    <div>
                        <span>Date</span>
                        <strong>
                            {booking.journey_date}
                        </strong>
                    </div>

                    <div>
                        <span>Class</span>
                        <strong>
                            {booking.passengers?.[0]?.class_type || "-"}
                        </strong>
                    </div>

                    <div>
                        <span>Total Fare</span>
                        <strong>
                            ₹
                            {Number(
                                booking.total_fare
                            ).toFixed(2)}
                        </strong>
                    </div>

                    <div>
                        <span>Status</span>
                        <strong>
                            {booking.status}
                        </strong>
                    </div>
                </div>

                {booking.passengers?.length > 0 && (
                    <div className="ticket-passengers">
                        <h2>Passengers</h2>

                        {booking.passengers.map(
                            passenger => (
                                <div
                                    className="review-passenger"
                                    key={
                                        passenger.id ??
                                        passenger.seat_id
                                    }
                                >
                                    <div>
                                        <strong>
                                            {
                                                passenger.name
                                            }
                                        </strong>

                                        <span>
                                            {
                                                passenger.age
                                            }
                                            {" • "}
                                            {
                                                passenger.gender
                                            }
                                        </span>
                                    </div>

                                    <strong>
                                        {
                                            passenger.coach_number
                                        }
                                        {" / "}
                                        {
                                            passenger.seat_number
                                        }
                                    </strong>
                                </div>
                            )
                        )}
                    </div>
                )}

                {error && (
                    <div className="form-error top-space">
                        {error}
                    </div>
                )}

                <div className="confirmation-actions">
                    <button
                        className="secondary-action-button"
                        onClick={() =>
                            navigate("/my-bookings")
                        }
                    >
                        Back to bookings
                    </button>

                    {booking.status ===
                        "CONFIRMED" && (
                        <button
                            className="danger-button"
                            disabled={cancelling}
                            onClick={handleCancel}
                        >
                            {cancelling
                                ? "Cancelling..."
                                : "Cancel booking"}
                        </button>
                    )}
                </div>
            </section>
        </main>
    );
}

export default BookingDetails;