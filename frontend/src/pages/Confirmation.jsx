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
        return (
            <Navigate
                to="/my-bookings"
                replace
            />
        );
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

    const passengerList =
        passengers || [];

    return (
        <main className="page-container transaction-result-page">
            <section className="transaction-result-card confirmation-modern">
                <header className="transaction-result-header">
                    <div
                        className="transaction-success-mark"
                        aria-hidden="true"
                    >
                        ✓
                    </div>

                    <p className="eyebrow">
                        BOOKING CONFIRMED
                    </p>

                    <h1>
                        Your journey is confirmed
                    </h1>

                    <p>
                        Your reservation and simulated
                        payment were completed
                        successfully.
                    </p>
                </header>

                <section className="confirmation-pnr-modern">
                    <div>
                        <span>PNR NUMBER</span>

                        <strong>
                            {booking.pnr}
                        </strong>
                    </div>

                    <span className="confirmed-badge">
                        Confirmed
                    </span>
                </section>

                <article className="confirmation-ticket-modern">
                    <header>
                        <div>
                            <span>TRAIN</span>

                            <strong>
                                {journey?.train_number ||
                                    "—"}
                            </strong>

                            {journey?.train_name && (
                                <p>
                                    {
                                        journey.train_name
                                    }
                                </p>
                            )}
                        </div>

                        <div className="confirmation-class">
                            <span>CLASS</span>

                            <strong>
                                {classType || "—"}
                            </strong>
                        </div>
                    </header>

                    <section className="confirmation-route-modern">
                        <div>
                            <span>FROM</span>

                            <strong>
                                {search?.source ||
                                    "—"}
                            </strong>

                            <small>
                                Departure
                            </small>
                        </div>

                        <div
                            className="confirmation-route-track"
                            aria-hidden="true"
                        >
                            <i />
                            <span>→</span>
                            <i />
                        </div>

                        <div>
                            <span>TO</span>

                            <strong>
                                {search?.destination ||
                                    "—"}
                            </strong>

                            <small>
                                Arrival
                            </small>
                        </div>
                    </section>

                    <section className="confirmation-meta-modern">
                        <div>
                            <span>Journey date</span>

                            <strong>
                                {formatDate(
                                    journey?.journey_date ||
                                    search?.date
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>Passengers</span>

                            <strong>
                                {passengerList.length}
                            </strong>
                        </div>

                        <div>
                            <span>
                                Booking status
                            </span>

                            <strong>
                                {paymentResult.bookingStatus ||
                                    "CONFIRMED"}
                            </strong>
                        </div>
                    </section>

                    {passengerList.length > 0 && (
                        <section className="confirmation-passengers-modern">
                            <header>
                                <div>
                                    <span>
                                        TRAVELLERS
                                    </span>

                                    <h2>
                                        Passenger details
                                    </h2>
                                </div>

                                <strong>
                                    {passengerList.length}
                                    {" "}
                                    {passengerList.length ===
                                    1
                                        ? "passenger"
                                        : "passengers"}
                                </strong>
                            </header>

                            <div>
                                {passengerList.map(
                                    (
                                        passenger,
                                        index
                                    ) => {
                                        const seat =
                                            seats?.find(
                                                item =>
                                                    item.seat_id ===
                                                    passenger.seatId
                                            );

                                        return (
                                            <article
                                                className="confirmation-passenger-row"
                                                key={
                                                    passenger.seatId ??
                                                    index
                                                }
                                            >
                                                <span className="confirmation-passenger-number">
                                                    {index +
                                                        1}
                                                </span>

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
                                                        {
                                                            " • "
                                                        }
                                                        {
                                                            passenger.gender
                                                        }
                                                    </span>
                                                </div>

                                                <div className="confirmation-seat">
                                                    <span>
                                                        COACH / SEAT
                                                    </span>

                                                    <strong>
                                                        {seat?.coach_number ||
                                                            "—"}
                                                        {
                                                            " / "
                                                        }
                                                        {seat?.seat_number ||
                                                            "—"}
                                                    </strong>

                                                    {seat?.berth_type && (
                                                        <small>
                                                            {
                                                                seat.berth_type
                                                            }
                                                        </small>
                                                    )}
                                                </div>
                                            </article>
                                        );
                                    }
                                )}
                            </div>
                        </section>
                    )}
                </article>

                <footer className="transaction-result-actions">
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
                            navigate(
                                "/my-bookings"
                            )
                        }
                    >
                        My bookings
                    </button>
                </footer>
            </section>
        </main>
    );
}

export default Confirmation;