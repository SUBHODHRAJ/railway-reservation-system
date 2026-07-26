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

    const [error, setError] = useState("");

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

    const handleCreateBooking = async () => {
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
        <main className="page-container">
            <section className="hero-section">
                <p className="eyebrow">
                    REVIEW BOOKING
                </p>

                <h1>Confirm your journey</h1>

                <p>
                    Check the details before proceeding
                    to payment.
                </p>
            </section>

            <section className="content-card review-card">
                <div className="review-row">
                    <span>Train</span>
                    <strong>
                        {journey.train_number}
                        {" — "}
                        {journey.train_name}
                    </strong>
                </div>

                <div className="review-row">
                    <span>Journey</span>
                    <strong>
                        {search.source}
                        {" → "}
                        {search.destination}
                    </strong>
                </div>

                <div className="review-row">
                    <span>Date</span>
                    <strong>
                        {journey.journey_date}
                    </strong>
                </div>

                <div className="review-row">
                    <span>Class</span>
                    <strong>{classType}</strong>
                </div>
            </section>

            <section className="content-card top-space">
                <h2>Passengers</h2>

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
                                <div>
                                    <strong>
                                        {passenger.name}
                                    </strong>

                                    <span>
                                        {passenger.age}
                                        {" • "}
                                        {passenger.gender}
                                    </span>
                                </div>

                                <strong>
                                    {seat?.coach_number}
                                    {" / "}
                                    {seat?.seat_number}
                                </strong>
                            </div>
                        );
                    }
                )}
            </section>

            <section className="content-card fare-summary top-space">
                <div>
                    <span>
                        Fare per passenger
                    </span>

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
                        {passengers.length}
                    </strong>
                </div>

                <div className="total-row">
                    <span>Total</span>

                    <strong>
                        ₹{total.toFixed(2)}
                    </strong>
                </div>
            </section>

            {error && (
                <div className="form-error top-space">
                    {error}
                </div>
            )}

            <button
                type="button"
                className="primary-button booking-action"
                disabled={creating}
                onClick={handleCreateBooking}
            >
                {creating
                    ? "Creating booking..."
                    : "Proceed to payment"}
            </button>
        </main>
    );
}

export default BookingReview;