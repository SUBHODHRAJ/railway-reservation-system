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

    return (
        <main className="page-container confirmation-page">
            <section className="confirmation-card">
                <div
                    className="success-icon"
                    aria-hidden="true"
                >
                    ✓
                </div>

                <p className="eyebrow">
                    BOOKING CONFIRMED
                </p>

                <h1>Your journey is confirmed</h1>

                <p className="muted confirmation-subtitle">
                    Your reservation was completed
                    successfully. Keep your PNR available
                    for booking reference.
                </p>

                <div className="pnr-box">
                    <span>PNR NUMBER</span>
                    <strong>{booking.pnr}</strong>
                </div>

                <section className="confirmation-ticket">
                    <div className="confirmation-ticket-header">
                        <div>
                            <span>Train</span>

                            <strong>
                                {journey?.train_number || "—"}
                            </strong>
                        </div>

                        <span className="confirmed-badge">
                            Confirmed
                        </span>
                    </div>

                    <div className="ticket-route">
                        <div>
                            <strong>
                                {search?.source || "—"}
                            </strong>

                            <span>Departure</span>
                        </div>

                        <div
                            className="ticket-arrow"
                            aria-hidden="true"
                        >
                            →
                        </div>

                        <div>
                            <strong>
                                {search?.destination || "—"}
                            </strong>

                            <span>Arrival</span>
                        </div>
                    </div>

                    <div className="ticket-details">
                        <div>
                            <span>Date</span>

                            <strong>
                                {formatDate(
                                    journey?.journey_date ||
                                    search?.date
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>Class</span>
                            <strong>{classType || "—"}</strong>
                        </div>

                        <div>
                            <span>Passengers</span>

                            <strong>
                                {passengers?.length || 0}
                            </strong>
                        </div>

                        <div>
                            <span>Status</span>

                            <strong>
                                {paymentResult.bookingStatus}
                            </strong>
                        </div>
                    </div>

                    {passengers?.length > 0 && (
                        <div className="ticket-passengers">
                            <div className="passenger-list-heading">
                                <h2>Passengers</h2>

                                <span>
                                    {passengers.length}{" "}
                                    {passengers.length === 1
                                        ? "traveller"
                                        : "travellers"}
                                </span>
                            </div>

                            {passengers.map(
                                (passenger, index) => {
                                    const seat = seats?.find(
                                        item =>
                                            item.seat_id ===
                                            passenger.seatId
                                    );

                                    return (
                                        <div
                                            className="review-passenger"
                                            key={
                                                passenger.seatId ??
                                                index
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

                                            <div className="confirmed-seat">
                                                <span>Seat</span>

                                                <strong>
                                                    {seat?.coach_number ||
                                                        "—"}
                                                    {" / "}
                                                    {seat?.seat_number ||
                                                        "—"}
                                                </strong>
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    )}
                </section>

                <div className="confirmation-actions">
                    <button
                        type="button"
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
                        type="button"
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