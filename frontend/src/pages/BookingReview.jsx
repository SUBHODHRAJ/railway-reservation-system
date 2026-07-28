import { useState } from "react";
import {
    Navigate,
    useLocation,
    useNavigate
} from "react-router-dom";

import { createBooking } from "../api/bookingApi";

const BERTH_NAMES = {
    LB: "Lower Berth",
    MB: "Middle Berth",
    UB: "Upper Berth",
    SL: "Side Lower",
    SU: "Side Upper"
};

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
        return (
            <Navigate
                to="/search"
                replace
            />
        );
    }

    const {
        search,
        journey,
        classType,
        fare,
        seats,
        passengers
    } = state;

    const fareAmount =
        Number(fare.amount);

    const total =
        fareAmount *
        passengers.length;

    const formatDate = date => {
        if (!date) {
            return "—";
        }

        const value =
            String(date).slice(0, 10);

        const [
            year,
            month,
            day
        ] = value.split("-");

        if (
            !year ||
            !month ||
            !day
        ) {
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

    const handleCreateBooking =
        async () => {
            if (creating) {
                return;
            }

            setCreating(true);
            setError("");

            try {
                const response =
                    await createBooking({
                        journeyId:
                            Number(
                                journey.id
                            ),
                        source:
                            search.source,
                        destination:
                            search.destination,
                        classType,
                        passengers
                    });

                navigate(
                    "/payment",
                    {
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
                    }
                );
            } catch (error) {
                setError(
                    error.response?.data
                        ?.message ||
                        "Unable to create booking."
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

                <h1>
                    Confirm your journey
                </h1>

                <p>
                    Check your journey,
                    passengers and fare
                    before creating the
                    booking.
                </p>
            </section>

            <div className="booking-progress">
                <div className="booking-progress-step booking-progress-complete">
                    <span>1</span>
                    <strong>Seats</strong>
                </div>

                <div className="booking-progress-line booking-progress-line-complete" />

                <div className="booking-progress-step booking-progress-complete">
                    <span>2</span>
                    <strong>
                        Passengers
                    </strong>
                </div>

                <div className="booking-progress-line booking-progress-line-complete" />

                <div className="booking-progress-step booking-progress-active">
                    <span>3</span>
                    <strong>Review</strong>
                </div>

                <div className="booking-progress-line" />

                <div className="booking-progress-step">
                    <span>4</span>
                    <strong>Payment</strong>
                </div>
            </div>

            <div className="booking-review-layout">
                <div className="booking-review-main">
                    <section className="content-card review-journey-card">
                        <div className="review-section-heading">
                            <div>
                                <span>
                                    JOURNEY
                                </span>

                                <h2>
                                    Travel
                                    details
                                </h2>
                            </div>

                            <span className="review-class-badge">
                                {classType}
                            </span>
                        </div>

                        <div className="review-train">
                            <span>
                                {
                                    journey.train_number
                                }
                            </span>

                            <strong>
                                {
                                    journey.train_name
                                }
                            </strong>
                        </div>

                        <div className="review-route">
                            <div>
                                <span>
                                    FROM
                                </span>

                                <strong>
                                    {
                                        search.source
                                    }
                                </strong>

                                <small>
                                    Departure
                                </small>
                            </div>

                            <div
                                className="review-route-track"
                                aria-hidden="true"
                            >
                                <span />

                                <strong>
                                    →
                                </strong>

                                <span />
                            </div>

                            <div>
                                <span>
                                    TO
                                </span>

                                <strong>
                                    {
                                        search.destination
                                    }
                                </strong>

                                <small>
                                    Destination
                                </small>
                            </div>
                        </div>

                        <div className="review-journey-meta">
                            <div>
                                <span>
                                    Journey
                                    date
                                </span>

                                <strong>
                                    {formatDate(
                                        journey.journey_date
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Travel
                                    class
                                </span>

                                <strong>
                                    {
                                        classType
                                    }
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Passengers
                                </span>

                                <strong>
                                    {
                                        passengers.length
                                    }
                                </strong>
                            </div>
                        </div>
                    </section>

                    <section className="content-card review-passenger-card">
                        <div className="review-section-heading">
                            <div>
                                <span>
                                    TRAVELLERS
                                </span>

                                <h2>
                                    Passenger
                                    details
                                </h2>
                            </div>

                            <strong className="review-count-badge">
                                {
                                    passengers.length
                                }
                            </strong>
                        </div>

                        <div className="review-passenger-list">
                            {passengers.map(
                                (
                                    passenger,
                                    index
                                ) => {
                                    const seat =
                                        seats.find(
                                            item =>
                                                item.seat_id ===
                                                passenger.seatId
                                        );

                                    return (
                                        <article
                                            className="review-passenger"
                                            key={
                                                passenger.seatId
                                            }
                                        >
                                            <div className="review-passenger-index">
                                                {index +
                                                    1}
                                            </div>

                                            <div className="review-passenger-info">
                                                <span>
                                                    PASSENGER{" "}
                                                    {index +
                                                        1}
                                                </span>

                                                <strong>
                                                    {
                                                        passenger.name
                                                    }
                                                </strong>

                                                <small>
                                                    {
                                                        passenger.age
                                                    }{" "}
                                                    years
                                                    {" • "}
                                                    {formatGender(
                                                        passenger.gender
                                                    )}
                                                </small>
                                            </div>

                                            <div className="review-seat-info">
                                                <span>
                                                    SEAT
                                                </span>

                                                <strong>
                                                    {seat?.coach_number ||
                                                        "—"}
                                                    {" / "}
                                                    {seat?.seat_number ||
                                                        "—"}
                                                </strong>

                                                <small>
                                                    {BERTH_NAMES[
                                                        seat?.berth_type
                                                    ] ||
                                                        seat?.berth_type ||
                                                        "—"}
                                                </small>
                                            </div>
                                        </article>
                                    );
                                }
                            )}
                        </div>

                        <button
                            type="button"
                            className="review-inline-edit"
                            disabled={
                                creating
                            }
                            onClick={() =>
                                navigate(-1)
                            }
                        >
                            Edit passenger details
                        </button>
                    </section>
                </div>

                <aside className="review-payment-summary">
                    <div className="review-payment-header">
                        <span>
                            FARE SUMMARY
                        </span>

                        <h2>
                            Booking total
                        </h2>
                    </div>

                    <div className="review-summary-route">
                        <div>
                            <span>
                                Route
                            </span>

                            <strong>
                                {
                                    search.source
                                }
                                {" → "}
                                {
                                    search.destination
                                }
                            </strong>
                        </div>

                        <div>
                            <span>
                                Class
                            </span>

                            <strong>
                                {
                                    classType
                                }
                            </strong>
                        </div>
                    </div>

                    <div className="review-fare-lines">
                        <div>
                            <span>
                                Base fare
                            </span>

                            <strong>
                                ₹
                                {fareAmount.toLocaleString(
                                    "en-IN",
                                    {
                                        minimumFractionDigits:
                                            2,
                                        maximumFractionDigits:
                                            2
                                    }
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>
                                Passengers
                            </span>

                            <strong>
                                ×{" "}
                                {
                                    passengers.length
                                }
                            </strong>
                        </div>
                    </div>

                    <div className="review-total">
                        <div>
                            <span>
                                Total payable
                            </span>

                            <small>
                                {passengers.length}{" "}
                                {passengers.length ===
                                1
                                    ? "passenger"
                                    : "passengers"}
                            </small>
                        </div>

                        <strong>
                            ₹
                            {total.toLocaleString(
                                "en-IN",
                                {
                                    minimumFractionDigits:
                                        2,
                                    maximumFractionDigits:
                                        2
                                }
                            )}
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
                        disabled={
                            creating
                        }
                        onClick={
                            handleCreateBooking
                        }
                    >
                        {creating
                            ? "Creating booking..."
                            : `Proceed to pay ₹${total.toLocaleString(
                                  "en-IN",
                                  {
                                      minimumFractionDigits:
                                          2,
                                      maximumFractionDigits:
                                          2
                                  }
                              )}`}
                    </button>

                    <button
                        type="button"
                        className="review-edit-button"
                        disabled={
                            creating
                        }
                        onClick={() =>
                            navigate(-1)
                        }
                    >
                        Back to passenger details
                    </button>

                    <p className="review-payment-note">
                        Your reservation
                        booking is created
                        before proceeding to
                        the simulated payment
                        step.
                    </p>
                </aside>
            </div>
        </main>
    );
}

function formatGender(gender) {
    if (!gender) {
        return "—";
    }

    return (
        gender.charAt(0) +
        gender
            .slice(1)
            .toLowerCase()
    );
}

export default BookingReview;