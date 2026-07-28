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

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] =
        useState(false);

    const [
        showCancelConfirm,
        setShowCancelConfirm
    ] = useState(false);

    const [error, setError] = useState("");

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

    const formatDate = date => {
        if (!date) {
            return "—";
        }

        const value =
            String(date).slice(0, 10);

        const [year, month, day] =
            value.split("-");

        if (!year || !month || !day) {
            return date;
        }

        return new Intl.DateTimeFormat(
            "en-IN",
            {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        ).format(
            new Date(
                Number(year),
                Number(month) - 1,
                Number(day)
            )
        );
    };

    const handleCancel = async () => {
        if (
            !booking?.booking_id ||
            cancelling
        ) {
            return;
        }

        setCancelling(true);
        setError("");

        try {
            await cancelBooking(
                booking.booking_id
            );

            setShowCancelConfirm(false);

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
                <div
                    className="loading-spinner"
                    aria-hidden="true"
                />

                <p>Loading ticket...</p>
            </main>
        );
    }

    if (error && !booking) {
        return (
            <main className="page-container booking-details-page">
                <div
                    className="form-error"
                    role="alert"
                >
                    {error}
                </div>

                <button
                    type="button"
                    className="secondary-action-button booking-load-back"
                    onClick={() =>
                        navigate("/my-bookings")
                    }
                >
                    Back to bookings
                </button>
            </main>
        );
    }

    const isConfirmed =
        booking.status === "CONFIRMED";

    const isCancelled =
        booking.status === "CANCELLED";

    const passengers =
        booking.passengers || [];

    const classType =
        passengers[0]?.class_type || "—";

    const totalFare =
        Number(booking.total_fare || 0);

    return (
        <main className="page-container booking-details-page">
            <section className="booking-details-hero">
                <div>
                    <p className="eyebrow">
                        BOOKING DETAILS
                    </p>

                    <h1>Your journey</h1>

                    <p>
                        Reservation and passenger
                        information for PNR{" "}
                        <strong>{booking.pnr}</strong>
                    </p>
                </div>

                <button
                    type="button"
                    className="secondary-action-button"
                    onClick={() =>
                        navigate("/my-bookings")
                    }
                >
                    Back to bookings
                </button>
            </section>

            <article
                className={`booking-ticket-modern ${
                    isCancelled
                        ? "booking-ticket-cancelled"
                        : ""
                }`}
            >
                <header className="booking-ticket-header">
                    <div>
                        <span className="booking-ticket-label">
                            TRAIN E-TICKET
                        </span>

                        <h2>
                            {booking.train_number}
                            {" — "}
                            {booking.train_name}
                        </h2>
                    </div>

                    <span
                        className={`booking-status status-${booking.status?.toLowerCase()}`}
                    >
                        {booking.status}
                    </span>
                </header>

                <section className="booking-pnr-strip">
                    <div>
                        <span>PNR NUMBER</span>

                        <strong>
                            {booking.pnr}
                        </strong>
                    </div>

                    <div>
                        <span>TRAVEL CLASS</span>

                        <strong>
                            {classType}
                        </strong>
                    </div>
                </section>

                {isCancelled && (
                    <section className="booking-cancelled-banner">
                        <div
                            className="booking-cancelled-mark"
                            aria-hidden="true"
                        >
                            ×
                        </div>

                        <div>
                            <strong>
                                Booking cancelled
                            </strong>

                            <p>
                                This reservation is no
                                longer valid for travel.
                                The successful simulated
                                payment has been refunded
                                and the booked seats have
                                been released.
                            </p>
                        </div>
                    </section>
                )}

                <section className="booking-ticket-route">
                    <div className="booking-station booking-station-source">
                        <span>FROM</span>

                        <strong>
                            {booking.source_code}
                        </strong>

                        <p>
                            {booking.source_name}
                        </p>
                    </div>

                    <div
                        className="booking-route-line"
                        aria-hidden="true"
                    >
                        <i />
                        <span>→</span>
                        <i />
                    </div>

                    <div className="booking-station booking-station-destination">
                        <span>TO</span>

                        <strong>
                            {booking.destination_code}
                        </strong>

                        <p>
                            {
                                booking.destination_name
                            }
                        </p>
                    </div>
                </section>

                <section className="booking-ticket-meta">
                    <div>
                        <span>Journey date</span>

                        <strong>
                            {formatDate(
                                booking.journey_date
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>Class</span>

                        <strong>
                            {classType}
                        </strong>
                    </div>

                    <div>
                        <span>Passengers</span>

                        <strong>
                            {passengers.length}
                        </strong>
                    </div>

                    <div>
                        <span>Total fare</span>

                        <strong>
                            ₹
                            {totalFare.toLocaleString(
                                "en-IN",
                                {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }
                            )}
                        </strong>
                    </div>
                </section>

                {passengers.length > 0 && (
                    <section className="booking-ticket-passengers">
                        <div className="booking-passenger-heading">
                            <div>
                                <span>TRAVELLERS</span>

                                <h3>
                                    Passenger details
                                </h3>
                            </div>

                            <strong>
                                {passengers.length}
                                {" "}
                                {passengers.length === 1
                                    ? "passenger"
                                    : "passengers"}
                            </strong>
                        </div>

                        <div className="booking-passenger-list">
                            {passengers.map(
                                (
                                    passenger,
                                    index
                                ) => (
                                    <div
                                        className="booking-ticket-passenger"
                                        key={
                                            passenger.id ??
                                            passenger.seat_id ??
                                            index
                                        }
                                    >
                                        <div className="booking-passenger-index">
                                            {index + 1}
                                        </div>

                                        <div className="booking-passenger-person">
                                            <span>
                                                Passenger
                                            </span>

                                            <strong>
                                                {
                                                    passenger.name
                                                }
                                            </strong>

                                            <small>
                                                {
                                                    passenger.age
                                                }
                                                {" • "}
                                                {
                                                    passenger.gender
                                                }
                                            </small>
                                        </div>

                                        <div className="booking-passenger-seat">
                                            <span>
                                                Coach / Seat
                                            </span>

                                            <strong>
                                                {passenger.coach_number ||
                                                    "—"}
                                                {" / "}
                                                {passenger.seat_number ||
                                                    "—"}
                                            </strong>

                                            {passenger.berth_type && (
                                                <small>
                                                    {
                                                        passenger.berth_type
                                                    }
                                                </small>
                                            )}
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </section>
                )}

                <footer className="booking-ticket-footer">
                    <div>
                        <span>BOOKING STATUS</span>

                        <strong>
                            {booking.status}
                        </strong>
                    </div>

                    <div>
                        <span>PNR</span>

                        <strong>
                            {booking.pnr}
                        </strong>
                    </div>
                </footer>
            </article>

            {error && (
                <div
                    className="form-error booking-details-error"
                    role="alert"
                >
                    {error}
                </div>
            )}

            {showCancelConfirm &&
                isConfirmed && (
                    <section
                        className="booking-cancel-panel"
                        aria-labelledby="cancel-booking-title"
                    >
                        <div className="booking-cancel-content">
                            <span className="booking-cancel-eyebrow">
                                CANCELLATION
                            </span>

                            <h2 id="cancel-booking-title">
                                Cancel this booking?
                            </h2>

                            <p>
                                The reservation will be
                                cancelled, the successful
                                simulated payment will be
                                refunded, and all booked
                                seats will be released.
                            </p>
                        </div>

                        <div className="booking-cancel-actions">
                            <button
                                type="button"
                                className="secondary-action-button"
                                disabled={cancelling}
                                onClick={() =>
                                    setShowCancelConfirm(
                                        false
                                    )
                                }
                            >
                                Keep booking
                            </button>

                            <button
                                type="button"
                                className="danger-button"
                                disabled={cancelling}
                                onClick={handleCancel}
                            >
                                {cancelling
                                    ? "Cancelling..."
                                    : "Confirm cancellation"}
                            </button>
                        </div>
                    </section>
                )}

            <section className="booking-details-actions">
                {isConfirmed &&
                    !showCancelConfirm && (
                        <>
                            <div>
                                <strong>
                                    Need to cancel?
                                </strong>

                                <span>
                                    Cancelling releases
                                    your reserved seats.
                                </span>
                            </div>

                            <button
                                type="button"
                                className="danger-outline-button"
                                onClick={() => {
                                    setError("");
                                    setShowCancelConfirm(
                                        true
                                    );
                                }}
                            >
                                Cancel booking
                            </button>
                        </>
                    )}

                {isCancelled && (
                    <>
                        <div>
                            <strong>
                                Plan another trip
                            </strong>

                            <span>
                                Search available trains
                                for a new journey.
                            </span>
                        </div>

                        <button
                            type="button"
                            className="primary-button"
                            onClick={() =>
                                navigate("/search")
                            }
                        >
                            Book another journey
                        </button>
                    </>
                )}
            </section>
        </main>
    );
}

export default BookingDetails;