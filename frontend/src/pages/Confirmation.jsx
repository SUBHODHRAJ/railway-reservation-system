import {
    Navigate,
    useLocation,
    useNavigate
} from "react-router-dom";

function Confirmation() {
    const location = useLocation();
    const navigate = useNavigate();

    const state = location.state;

    if (
        !state?.booking ||
        !state?.paymentResult
    ) {
        return <Navigate to="/my-bookings" replace />;
    }

    const {
        booking,
        paymentResult,
        search,
        journey,
        classType,
        seats,
        passengers
    } = state;

    return (
        <main className="page-container">
            <section className="confirmation-card">
                <div className="success-icon">
                    ✓
                </div>

                <p className="eyebrow">
                    BOOKING CONFIRMED
                </p>

                <h1>Your ticket is confirmed</h1>

                <p className="muted">
                    Your seats have been booked
                    successfully.
                </p>

                <div className="pnr-box">
                    <span>PNR</span>
                    <strong>{booking.pnr}</strong>
                </div>

                <div className="ticket-route">
                    <div>
                        <strong>
                            {search?.source}
                        </strong>
                        <span>From</span>
                    </div>

                    <div className="ticket-arrow">
                        →
                    </div>

                    <div>
                        <strong>
                            {search?.destination}
                        </strong>
                        <span>To</span>
                    </div>
                </div>

                <div className="ticket-details">
                    <div>
                        <span>Train</span>
                        <strong>
                            {journey?.train_number}
                        </strong>
                    </div>

                    <div>
                        <span>Date</span>
                        <strong>
                            {journey?.journey_date}
                        </strong>
                    </div>

                    <div>
                        <span>Class</span>
                        <strong>{classType}</strong>
                    </div>

                    <div>
                        <span>Status</span>
                        <strong>
                            {
                                paymentResult.bookingStatus
                            }
                        </strong>
                    </div>
                </div>

                {passengers?.length > 0 && (
                    <div className="ticket-passengers">
                        <h2>Passengers</h2>

                        {passengers.map(passenger => {
                            const seat =
                                seats?.find(
                                    item =>
                                        item.seat_id ===
                                        passenger.seatId
                                );

                            return (
                                <div
                                    className="review-passenger"
                                    key={passenger.seatId}
                                >
                                    <div>
                                        <strong>
                                            {
                                                passenger.name
                                            }
                                        </strong>

                                        <span>
                                            {passenger.age}
                                            {" • "}
                                            {
                                                passenger.gender
                                            }
                                        </span>
                                    </div>

                                    <strong>
                                        {
                                            seat?.coach_number
                                        }
                                        {" / "}
                                        {
                                            seat?.seat_number
                                        }
                                    </strong>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="confirmation-actions">
                    <button
                        className="primary-button"
                        onClick={() =>
                            navigate(
                                `/booking/${booking.pnr}`
                            )
                        }
                    >
                        View ticket
                    </button>

                    <button
                        className="secondary-action-button"
                        onClick={() =>
                            navigate("/my-bookings")
                        }
                    >
                        My bookings
                    </button>
                </div>
            </section>
        </main>
    );
}

export default Confirmation;