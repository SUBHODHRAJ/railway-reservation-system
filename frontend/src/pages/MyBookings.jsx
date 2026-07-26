import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getMyBookings } from "../api/bookingApi";

function MyBookings() {
    const navigate = useNavigate();

    const [bookings, setBookings] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        const loadBookings = async () => {
            try {
                const response =
                    await getMyBookings();

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

    if (loading) {
        return (
            <main className="route-loading">
                <div className="loading-spinner"></div>
                <p>Loading bookings...</p>
            </main>
        );
    }

    return (
        <main className="page-container">
            <section className="hero-section">
                <p className="eyebrow">
                    YOUR JOURNEYS
                </p>

                <h1>My Bookings</h1>

                <p>
                    View your railway reservations,
                    tickets and booking status.
                </p>
            </section>

            {error && (
                <div className="form-error">
                    {error}
                </div>
            )}

            {!error && bookings.length === 0 && (
                <section className="content-card empty-state">
                    <h2>No bookings yet</h2>

                    <p className="muted">
                        Search for a train to make your
                        first reservation.
                    </p>

                    <button
                        className="primary-button"
                        onClick={() =>
                            navigate("/search")
                        }
                    >
                        Search trains
                    </button>
                </section>
            )}

            <div className="booking-list">
                {bookings.map(booking => (
                    <article
                        className="booking-card"
                        key={booking.id}
                    >
                        <div className="booking-card-top">
                            <div>
                                <span className="train-number">
                                    {
                                        booking.train_number
                                    }
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
                            <strong>
                                {booking.source}
                            </strong>

                            <span>→</span>

                            <strong>
                                {booking.destination}
                            </strong>
                        </div>

                        <div className="booking-meta">
                            <div>
                                <span>PNR</span>
                                <strong>
                                    {booking.pnr}
                                </strong>
                            </div>

                            <div>
                                <span>Date</span>
                                <strong>
                                    {
                                        booking.journey_date
                                    }
                                </strong>
                            </div>

                            <div>
                                <span>Fare</span>
                                <strong>
                                    ₹
                                    {Number(
                                        booking.total_fare
                                    ).toFixed(2)}
                                </strong>
                            </div>
                        </div>

                        <button
                            className="secondary-action-button"
                            onClick={() =>
                                navigate(
                                    `/booking/${booking.pnr}`
                                )
                            }
                        >
                            View details
                        </button>
                    </article>
                ))}
            </div>
        </main>
    );
}

export default MyBookings;