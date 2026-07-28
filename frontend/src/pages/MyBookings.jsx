import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getMyBookings } from "../api/bookingApi";

function MyBookings() {
    const navigate = useNavigate();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadBookings = async () => {
            try {
                const response = await getMyBookings();
                setBookings(response.data);
            } catch (error) {
                setError(
                    error.response?.data?.message ||
                    "Unable to load bookings"
                );
            } finally {
                setLoading(false);
            }
        };

        loadBookings();
    }, []);

    const formatDate = date => {
        if (!date) {
            return "—";
        }

        const value = String(date).slice(0, 10);
        const [year, month, day] = value.split("-");

        if (!year || !month || !day) {
            return date;
        }

        return new Intl.DateTimeFormat("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        }).format(
            new Date(
                Number(year),
                Number(month) - 1,
                Number(day)
            )
        );
    };

    if (loading) {
        return (
            <main className="route-loading">
                <div
                    className="loading-spinner"
                    aria-hidden="true"
                />
                <p>Loading bookings...</p>
            </main>
        );
    }

    return (
        <main className="page-container bookings-page">
            <section className="hero-section bookings-hero">
                <p className="eyebrow">
                    YOUR JOURNEYS
                </p>

                <h1>My Bookings</h1>

                <p>
                    View your reservations, ticket details
                    and current booking status.
                </p>
            </section>

            {error && (
                <div
                    className="form-error bookings-error"
                    role="alert"
                >
                    {error}
                </div>
            )}

            {!error && bookings.length === 0 && (
                <section className="content-card empty-state bookings-empty">
                    <div
                        className="empty-state-symbol"
                        aria-hidden="true"
                    >
                        —
                    </div>

                    <h2>No bookings yet</h2>

                    <p className="muted">
                        Your railway reservations will appear
                        here after you complete a booking.
                    </p>

                    <button
                        type="button"
                        className="primary-button"
                        onClick={() =>
                            navigate("/search")
                        }
                    >
                        Search trains
                    </button>
                </section>
            )}

            {!error && bookings.length > 0 && (
                <>
                    <div className="bookings-summary">
                        <p>
                            <strong>{bookings.length}</strong>
                            {" "}
                            {bookings.length === 1
                                ? "booking"
                                : "bookings"}
                        </p>

                        <span>
                            Select a reservation to view its
                            complete ticket.
                        </span>
                    </div>

                    <section
                        className="booking-list"
                        aria-label="Your bookings"
                    >
                        {bookings.map(booking => (
                            <article
                                className="booking-card"
                                key={booking.booking_id}
                            >
                                <div className="booking-card-top">
                                    <div className="booking-train">
                                        <span className="train-number">
                                            {booking.train_number}
                                        </span>

                                        <h2>
                                            {booking.train_name}
                                        </h2>
                                    </div>

                                    <span
                                        className={`booking-status status-${booking.status?.toLowerCase()}`}
                                    >
                                        {booking.status}
                                    </span>
                                </div>

                                <div className="booking-route">
                                    <div>
                                        <strong>
                                            {booking.source_code}
                                        </strong>

                                        <span>
                                            {booking.source_name}
                                        </span>
                                    </div>

                                    <div
                                        className="booking-route-line"
                                        aria-hidden="true"
                                    >
                                        <span />
                                        <strong>→</strong>
                                        <span />
                                    </div>

                                    <div className="booking-route-destination">
                                        <strong>
                                            {booking.destination_code}
                                        </strong>

                                        <span>
                                            {booking.destination_name}
                                        </span>
                                    </div>
                                </div>
                                <div className="booking-meta">
                                    <div>
                                        <span>PNR</span>

                                        <strong className="booking-pnr">
                                            {booking.pnr}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Journey date</span>

                                        <strong>
                                            {formatDate(
                                                booking.journey_date
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Total fare</span>

                                        <strong>
                                            ₹
                                            {Number(
                                                booking.total_fare
                                            ).toFixed(2)}
                                        </strong>
                                    </div>
                                </div>

                                <div className="booking-card-actions">
                                    <button
                                        type="button"
                                        className="secondary-action-button"
                                        onClick={() =>
                                            navigate(
                                                `/booking/${booking.pnr}`
                                            )
                                        }
                                    >
                                        View ticket
                                    </button>
                                </div>
                            </article>
                        ))}
                    </section>
                </>
            )}
        </main>
    );
}

export default MyBookings;