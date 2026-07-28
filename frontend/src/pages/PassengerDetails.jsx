import { useEffect, useState } from "react";
import {
    Navigate,
    useLocation,
    useNavigate
} from "react-router-dom";

function PassengerDetails() {
    const location = useLocation();
    const navigate = useNavigate();

    const {
        search,
        journey,
        classType,
        fare,
        seats,
        hold
    } = location.state || {};

    const [remaining, setRemaining] = useState(
        Number(hold?.holdMinutes || 10) * 60
    );

    const [passengers, setPassengers] = useState(() =>
        (seats || []).map(seat => ({
            name: "",
            age: "",
            gender: "",
            seatId: seat.seat_id
        }))
    );

    const [error, setError] = useState("");

    useEffect(() => {
        if (!hold) {
            return;
        }

        const timer = setInterval(() => {
            setRemaining(previous =>
                previous > 0 ? previous - 1 : 0
            );
        }, 1000);

        return () => clearInterval(timer);
    }, [hold]);

    if (
        !search ||
        !journey ||
        !classType ||
        !fare ||
        !seats ||
        !hold
    ) {
        return <Navigate to="/search" replace />;
    }

    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;

    const formattedTime =
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}`;

    const total =
        Number(fare.amount) * passengers.length;

    const handleChange = (
        index,
        field,
        value
    ) => {
        setError("");

        setPassengers(previous =>
            previous.map((passenger, i) =>
                i === index
                    ? {
                          ...passenger,
                          [field]: value
                      }
                    : passenger
            )
        );
    };

    const handleContinue = event => {
        event.preventDefault();

        setError("");

        if (remaining <= 0) {
            setError(
                "Seat hold has expired. Select your seats again."
            );
            return;
        }

        const invalid = passengers.some(
            passenger =>
                !passenger.name.trim() ||
                !passenger.age ||
                Number(passenger.age) <= 0 ||
                Number(passenger.age) > 120 ||
                !passenger.gender
        );

        if (invalid) {
            setError(
                "Complete all passenger details before continuing."
            );
            return;
        }

        navigate("/booking-review", {
            state: {
                search,
                journey,
                classType,
                fare,
                seats,
                hold,
                passengers: passengers.map(
                    passenger => ({
                        ...passenger,
                        name: passenger.name.trim(),
                        age: Number(passenger.age)
                    })
                ),
                remaining
            }
        });
    };

    return (
        <main className="page-container passenger-details-page">
            <section className="hero-section passenger-hero">
                <p className="eyebrow">
                    PASSENGER DETAILS
                </p>

                <div className="passenger-title-row">
                    <div>
                        <h1>Who's travelling?</h1>

                        <p>
                            {journey.train_number}
                            {" • "}
                            {search.source}
                            {" → "}
                            {search.destination}
                            {" • "}
                            {classType}
                        </p>
                    </div>

                    <div
                        className={`passenger-hold ${
                            remaining <= 120
                                ? "passenger-hold-warning"
                                : ""
                        }`}
                    >
                        <span>SEAT HOLD</span>
                        <strong>{formattedTime}</strong>
                    </div>
                </div>
            </section>

            <form
                className="passenger-form"
                onSubmit={handleContinue}
            >
                <div className="passenger-layout">
                    <div className="passenger-form-list">
                        {passengers.map(
                            (passenger, index) => {
                                const seat =
                                    seats[index];

                                return (
                                    <section
                                        className="content-card passenger-card"
                                        key={seat.seat_id}
                                    >
                                        <div className="passenger-heading">
                                            <div>
                                                <span className="passenger-number">
                                                    PASSENGER{" "}
                                                    {index + 1}
                                                </span>

                                                <h2>
                                                    Traveller details
                                                </h2>
                                            </div>

                                            <div className="passenger-seat-badge">
                                                <span>
                                                    {seat.berth_type}
                                                </span>

                                                <strong>
                                                    {seat.coach_number}
                                                    {" / "}
                                                    {seat.seat_number}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="passenger-grid">
                                            <div className="form-group passenger-name-field">
                                                <label
                                                    htmlFor={`passenger-name-${index}`}
                                                >
                                                    Full name
                                                </label>

                                                <input
                                                    id={`passenger-name-${index}`}
                                                    type="text"
                                                    autoComplete="name"
                                                    placeholder="Enter passenger name"
                                                    value={
                                                        passenger.name
                                                    }
                                                    onChange={event =>
                                                        handleChange(
                                                            index,
                                                            "name",
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    required
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label
                                                    htmlFor={`passenger-age-${index}`}
                                                >
                                                    Age
                                                </label>

                                                <input
                                                    id={`passenger-age-${index}`}
                                                    type="number"
                                                    inputMode="numeric"
                                                    min="1"
                                                    max="120"
                                                    placeholder="Age"
                                                    value={
                                                        passenger.age
                                                    }
                                                    onChange={event =>
                                                        handleChange(
                                                            index,
                                                            "age",
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    required
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label
                                                    htmlFor={`passenger-gender-${index}`}
                                                >
                                                    Gender
                                                </label>

                                                <select
                                                    id={`passenger-gender-${index}`}
                                                    value={
                                                        passenger.gender
                                                    }
                                                    onChange={event =>
                                                        handleChange(
                                                            index,
                                                            "gender",
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    required
                                                >
                                                    <option value="">
                                                        Select gender
                                                    </option>

                                                    <option value="MALE">
                                                        Male
                                                    </option>

                                                    <option value="FEMALE">
                                                        Female
                                                    </option>

                                                    <option value="OTHER">
                                                        Other
                                                    </option>
                                                </select>
                                            </div>
                                        </div>
                                    </section>
                                );
                            }
                        )}

                        {error && (
                            <div
                                className="form-error passenger-error"
                                role="alert"
                            >
                                {error}
                            </div>
                        )}
                    </div>

                    <aside className="passenger-summary-card">
                        <div className="passenger-summary-header">
                            <span>JOURNEY SUMMARY</span>

                            <h2>
                                {search.source}
                                {" → "}
                                {search.destination}
                            </h2>
                        </div>

                        <div className="passenger-summary-train">
                            <span>Train</span>

                            <strong>
                                {journey.train_number}
                            </strong>

                            <small>
                                {journey.train_name}
                            </small>
                        </div>

                        <div className="passenger-summary-grid">
                            <div>
                                <span>Class</span>
                                <strong>{classType}</strong>
                            </div>

                            <div>
                                <span>Passengers</span>
                                <strong>
                                    {passengers.length}
                                </strong>
                            </div>
                        </div>

                        <div className="passenger-selected-seats">
                            <span>Seats</span>

                            <div>
                                {seats.map(seat => (
                                    <strong
                                        key={seat.seat_id}
                                    >
                                        {seat.coach_number}
                                        {" / "}
                                        {seat.seat_number}
                                    </strong>
                                ))}
                            </div>
                        </div>

                        <div className="passenger-fare-row">
                            <span>
                                ₹
                                {Number(
                                    fare.amount
                                ).toFixed(2)}
                                {" × "}
                                {passengers.length}
                            </span>

                            <strong>
                                ₹{total.toFixed(2)}
                            </strong>
                        </div>

                        <button
                            className="primary-button passenger-continue-button"
                            disabled={remaining <= 0}
                            type="submit"
                        >
                            {remaining <= 0
                                ? "Seat hold expired"
                                : "Review booking"}
                        </button>

                        <p className="passenger-summary-note">
                            Check passenger names carefully
                            before proceeding to payment.
                        </p>
                    </aside>
                </div>
            </form>
        </main>
    );
}

export default PassengerDetails;