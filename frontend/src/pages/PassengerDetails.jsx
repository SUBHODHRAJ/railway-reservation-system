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

    const [remaining, setRemaining] =
        useState(
            Number(hold?.holdMinutes || 10) * 60
        );

    const [passengers, setPassengers] =
        useState(() =>
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

    const handleChange = (
        index,
        field,
        value
    ) => {
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
                "Seat hold has expired. Select seats again."
            );
            return;
        }

        const invalid =
            passengers.some(
                passenger =>
                    !passenger.name.trim() ||
                    !passenger.age ||
                    Number(passenger.age) <= 0 ||
                    !passenger.gender
            );

        if (invalid) {
            setError(
                "Complete all passenger details"
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
                        age: Number(passenger.age)
                    })
                ),
                remaining
            }
        });
    };

    return (
        <main className="page-container">
            <section className="hero-section">
                <p className="eyebrow">
                    PASSENGER DETAILS
                </p>

                <h1>Who's travelling?</h1>

                <p>
                    {journey.train_number}
                    {" • "}
                    {search.source}
                    {" → "}
                    {search.destination}
                </p>
            </section>

            <div
                className={`hold-timer ${
                    remaining <= 120
                        ? "hold-warning"
                        : ""
                }`}
            >
                Seats held for{" "}
                <strong>
                    {String(minutes).padStart(2, "0")}
                    :
                    {String(seconds).padStart(2, "0")}
                </strong>
            </div>

            <form onSubmit={handleContinue}>
                {passengers.map(
                    (passenger, index) => {
                        const seat = seats[index];

                        return (
                            <section
                                className="content-card passenger-card"
                                key={seat.seat_id}
                            >
                                <div className="passenger-heading">
                                    <h2>
                                        Passenger{" "}
                                        {index + 1}
                                    </h2>

                                    <span>
                                        {seat.coach_number}
                                        {" / "}
                                        {seat.seat_number}
                                        {" • "}
                                        {seat.berth_type}
                                    </span>
                                </div>

                                <div className="passenger-grid">
                                    <div className="form-group">
                                        <label>
                                            Full name
                                        </label>

                                        <input
                                            type="text"
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
                                        <label>
                                            Age
                                        </label>

                                        <input
                                            type="number"
                                            min="1"
                                            max="120"
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
                                        <label>
                                            Gender
                                        </label>

                                        <select
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
                                                Select
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
                    <div className="form-error top-space">
                        {error}
                    </div>
                )}

                <section className="booking-summary-bar">
                    <div>
                        {passengers.length}
                        {" passenger"}
                        {passengers.length === 1
                            ? ""
                            : "s"}
                    </div>

                    <strong>
                        ₹
                        {(
                            Number(fare.amount) *
                            passengers.length
                        ).toFixed(2)}
                    </strong>

                    <button
                        className="primary-button"
                        disabled={remaining <= 0}
                        type="submit"
                    >
                        Review booking
                    </button>
                </section>
            </form>
        </main>
    );
}

export default PassengerDetails;