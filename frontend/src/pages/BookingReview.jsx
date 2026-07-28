import { useState } from "react";
import {
    Navigate,
    useLocation,
    useNavigate
} from "react-router-dom";

import { createBooking } from "../api/bookingApi";

function BookingReview() {
    const location = useLocation();
    const navigate = useNavigate();

    const state = location.state;

    const [creating, setCreating] =
        useState(false);

    const [error, setError] =
        useState("");

    if (
        !state?.search ||
        !state?.journey ||
        !state?.classType ||
        !state?.fare ||
        !state?.seats ||
        !state?.passengers
    ) {
        return <Navigate to="/search" replace />;
    }

    const {
        search,
        journey,
        classType,
        fare,
        seats,
        passengers
    } = state;

    const total =
        Number(fare.amount) *
        passengers.length;

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

    const handleCreateBooking = async () => {
        if (creating) {
            return;
        }

        setCreating(true);
        setError("");

        try {
            const response =
                await createBooking({
                    journeyId:
                        Number(journey.id),
                    source:
                        search.source,
                    destination:
                        search.destination,
                    classType,
                    passengers
                });

            navigate("/payment", {
                state: {
                    booking:
                        response.data,
                    search,
                    journey,
                    classType,
                    fare,
                    seats,
                    passengers
                }
            });
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to create booking"
            );
        } finally {
            setCreating(false);
        }
    };

    return (
        <main className="page-container booking-review-page">
            <section className="hero-section booking-review-hero">
                <p className="eyebrow">
                    REVIEW BOOKING
                </p>

                <h1>Confirm your journey</h1>

                <p>
                    Review the journey, passenger and fare
                    details before proceeding to payment.
                </p>
            </section>

            <div className="booking-review-layout">
                <div className="booking-review-main">
                    <section className="content-card review-journey-card">
                        <div className="review-section-heading">
                            <div>
                                <span>JOURNEY</span>
                                <h2>Travel details</h2>
                            </div>

                            <span className="review-class-badge">
                                {classType}
                            </span>
                        </div>

                        <div className="review-train">
                            <span>
                                {journey.train_number}
                            </span>

                            <strong>
                                {journey.train_name}
                            </strong>
                        </div>

                        <div className="review-route">
                            <div>
                                <strong>
                                    {search.source}
                                </strong>
                                <span>Departure</span>
                            </div>

                            <div
                                className="review-route-track"
                                aria-hidden="true"
                            >
                                <span />
                                <strong>→</strong>
                                <span />
                            </div>

                            <div>
                                <strong>
                                    {search.destination}
                                </strong>
                                <span>Arrival</span>
                            </div>
                        </div>

                        <div className="review-journey-meta">
                            <div>
                                <span>Journey date</span>

                                <strong>
                                    {formatDate(
                                        journey.journey_date
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Travel class</span>
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
                        </div>
                    </section>

                    <section className="content-card review-passenger-card">
                        <div className="review-section-heading">
                            <div>
                                <span>TRAVELLERS</span>
                                <h2>Passenger details</h2>
                            </div>

                            <strong>
                                {passengers.length}
                            </strong>
                        </div>

                        <div className="review-passenger-list">
                            {passengers.map(
                                (passenger, index) => {
                                    const seat =
                                        seats.find(
                                            item =>
                                                item.seat_id ===
                                                passenger.seatId
                                        );

                                    return (
                                        <div
                                            className="review-passenger"
                                            key={
                                                passenger.seatId
                                            }
                                        >
                                            <div className="review-passenger-info">
                                                <span>
                                                    Passenger{" "}
                                                    {index + 1}
                                                </span>

                                                <strong>
                                                    {passenger.name}
                                                </strong>

                                                <small>
                                                    {passenger.age}
                                                    {" • "}
                                                    {passenger.gender}
                                                </small>
                                            </div>

                                            <div className="review-seat-info">
                                                <span>Seat</span>

                                                <strong>
                                                    {seat?.coach_number ||
                                                        "—"}
                                                    {" / "}
                                                    {seat?.seat_number ||
                                                        "—"}
                                                </strong>

                                                <small>
                                                    {seat?.berth_type ||
                                                        ""}
                                                </small>
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    </section>
                </div>

                <aside className="review-payment-summary">
                    <div className="review-payment-header">
                        <span>FARE SUMMARY</span>
                        <h2>Booking total</h2>
                    </div>

                    <div className="review-fare-lines">
                        <div>
                            <span>Fare per passenger</span>

                            <strong>
                                ₹
                                {Number(
                                    fare.amount
                                ).toFixed(2)}
                            </strong>
                        </div>

                        <div>
                            <span>Passengers</span>

                            <strong>
                                × {passengers.length}
                            </strong>
                        </div>
                    </div>

                    <div className="review-total">
                        <span>Total payable</span>

                        <strong>
                            ₹{total.toFixed(2)}
                        </strong>
                    </div>

                    {error && (
                        <div
                            className="form-error review-error"
                            role="alert"
                        >
                            {error}
                        </div>
                    )}

                    <button
                        type="button"
                        className="primary-button review-payment-button"
                        disabled={creating}
                        onClick={handleCreateBooking}
                    >
                        {creating
                            ? "Creating booking..."
                            : `Proceed to pay ₹${total.toFixed(
                                  2
                              )}`}
                    </button>

                    <button
                        type="button"
                        className="review-edit-button"
                        disabled={creating}
                        onClick={() =>
                            navigate(-1)
                        }
                    >
                        Edit passenger details
                    </button>

                    <p className="review-payment-note">
                        Your booking is created before the
                        simulated payment step.
                    </p>
                </aside>
            </div>
        </main>
    );
}

export default BookingReview;