import { useEffect, useMemo, useState } from "react";
import {
    Navigate,
    useLocation,
    useNavigate
} from "react-router-dom";

const BERTH_NAMES = {
    LB: "Lower Berth",
    MB: "Middle Berth",
    UB: "Upper Berth",
    SL: "Side Lower",
    SU: "Side Upper",
    WS: "Window Seat",
    MS: "Middle Seat",
    AS: "Aisle Seat"
};

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

    const initialHoldSeconds =
        Number(hold?.holdMinutes || 10) * 60;

    const [remaining, setRemaining] =
        useState(initialHoldSeconds);

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
                previous > 0
                    ? previous - 1
                    : 0
            );
        }, 1000);

        return () =>
            clearInterval(timer);
    }, [hold]);

    const completedPassengers =
        useMemo(
            () =>
                passengers.filter(
                    passenger =>
                        passenger.name.trim() &&
                        passenger.age &&
                        Number(
                            passenger.age
                        ) > 0 &&
                        Number(
                            passenger.age
                        ) <= 120 &&
                        passenger.gender
                ).length,
            [passengers]
        );

    if (
        !search ||
        !journey ||
        !classType ||
        !fare ||
        !seats ||
        !hold
    ) {
        return (
            <Navigate
                to="/search"
                replace
            />
        );
    }

    const minutes =
        Math.floor(remaining / 60);

    const seconds =
        remaining % 60;

    const formattedTime =
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}`;

    const fareAmount =
        Number(fare.amount);

    const total =
        fareAmount *
        passengers.length;

    const holdPercent =
        initialHoldSeconds > 0
            ? Math.max(
                  0,
                  Math.min(
                      100,
                      (remaining /
                          initialHoldSeconds) *
                          100
                  )
              )
            : 0;

    const handleChange = (
        index,
        field,
        value
    ) => {
        setError("");

        setPassengers(previous =>
            previous.map(
                (passenger, i) =>
                    i === index
                        ? {
                              ...passenger,
                              [field]:
                                  value
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
                "Seat hold has expired. Return to seat selection and choose your seats again."
            );
            return;
        }

        const invalid =
            passengers.some(
                passenger =>
                    !passenger.name.trim() ||
                    !passenger.age ||
                    Number(
                        passenger.age
                    ) <= 0 ||
                    Number(
                        passenger.age
                    ) > 120 ||
                    !passenger.gender
            );

        if (invalid) {
            setError(
                "Complete the name, age and gender for every passenger before continuing."
            );
            return;
        }

        navigate(
            "/booking-review",
            {
                state: {
                    search,
                    journey,
                    classType,
                    fare,
                    seats,
                    hold,
                    passengers:
                        passengers.map(
                            passenger => ({
                                ...passenger,
                                name:
                                    passenger.name.trim(),
                                age:
                                    Number(
                                        passenger.age
                                    )
                            })
                        ),
                    remaining
                }
            }
        );
    };

    return (
        <main className="page-container passenger-details-page">
            <section className="hero-section passenger-hero">
                <p className="eyebrow">
                    PASSENGER DETAILS
                </p>

                <div className="passenger-title-row">
                    <div>
                        <h1>
                            Who's travelling?
                        </h1>

                        <p>
                            {
                                journey.train_number
                            }
                            {" • "}
                            {search.source}
                            {" → "}
                            {
                                search.destination
                            }
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
                        <span>
                            SEAT HOLD
                        </span>

                        <strong>
                            {formattedTime}
                        </strong>

                        <small>
                            {remaining > 0
                                ? "Complete before timer expires"
                                : "Hold expired"}
                        </small>
                    </div>
                </div>

                <div className="passenger-hold-progress">
                    <span
                        style={{
                            width:
                                `${holdPercent}%`
                        }}
                    />
                </div>
            </section>

            <div className="booking-progress">
                <div className="booking-progress-step booking-progress-complete">
                    <span>1</span>
                    <strong>Seats</strong>
                </div>

                <div className="booking-progress-line booking-progress-line-complete" />

                <div className="booking-progress-step booking-progress-active">
                    <span>2</span>
                    <strong>
                        Passengers
                    </strong>
                </div>

                <div className="booking-progress-line" />

                <div className="booking-progress-step">
                    <span>3</span>
                    <strong>Review</strong>
                </div>

                <div className="booking-progress-line" />

                <div className="booking-progress-step">
                    <span>4</span>
                    <strong>Payment</strong>
                </div>
            </div>

            <form
                className="passenger-form"
                onSubmit={
                    handleContinue
                }
            >
                <div className="passenger-layout">
                    <div className="passenger-form-list">
                        <div className="passenger-section-intro">
                            <div>
                                <span>
                                    TRAVELLERS
                                </span>

                                <h2>
                                    Enter passenger details
                                </h2>

                                <p>
                                    Each passenger is
                                    assigned to the seat
                                    selected in the
                                    previous step.
                                </p>
                            </div>

                            <strong>
                                {
                                    completedPassengers
                                }
                                /
                                {
                                    passengers.length
                                }{" "}
                                complete
                            </strong>
                        </div>

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
                                    ) ||
                                    seats[index];

                                const complete =
                                    Boolean(
                                        passenger.name.trim() &&
                                        passenger.age &&
                                        Number(
                                            passenger.age
                                        ) > 0 &&
                                        Number(
                                            passenger.age
                                        ) <= 120 &&
                                        passenger.gender
                                    );

                                return (
                                    <section
                                        className={`content-card passenger-card ${
                                            complete
                                                ? "passenger-card-complete"
                                                : ""
                                        }`}
                                        key={
                                            passenger.seatId
                                        }
                                    >
                                        <div className="passenger-heading">
                                            <div className="passenger-heading-main">
                                                <span className="passenger-index">
                                                    {index +
                                                        1}
                                                </span>

                                                <div>
                                                    <span className="passenger-number">
                                                        PASSENGER{" "}
                                                        {index +
                                                            1}
                                                    </span>

                                                    <h2>
                                                        Traveller
                                                        details
                                                    </h2>
                                                </div>
                                            </div>

                                            <div className="passenger-seat-badge">
                                                <span>
                                                    {BERTH_NAMES[
                                                        seat?.berth_type
                                                    ] ||
                                                        seat?.berth_type ||
                                                        "Seat"}
                                                </span>

                                                <strong>
                                                    {seat?.coach_number ||
                                                        "—"}
                                                    {" / "}
                                                    {seat?.seat_number ||
                                                        "—"}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="passenger-assignment">
                                            <span>
                                                Assigned
                                                seat
                                            </span>

                                            <strong>
                                                Coach{" "}
                                                {seat?.coach_number ||
                                                    "—"}{" "}
                                                • Seat{" "}
                                                {seat?.seat_number ||
                                                    "—"}{" "}
                                                •{" "}
                                                {BERTH_NAMES[
                                                    seat?.berth_type
                                                ] ||
                                                    seat?.berth_type ||
                                                    "—"}
                                            </strong>
                                        </div>

                                        <div className="passenger-grid">
                                            <div className="form-group passenger-name-field">
                                                <label
                                                    htmlFor={`passenger-name-${index}`}
                                                >
                                                    Full
                                                    name
                                                </label>

                                                <input
                                                    id={`passenger-name-${index}`}
                                                    type="text"
                                                    autoComplete="name"
                                                    maxLength="100"
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
                                                        Select
                                                        gender
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

                                        <div className="passenger-card-status">
                                            <span
                                                className={
                                                    complete
                                                        ? "passenger-status-complete"
                                                        : ""
                                                }
                                            >
                                                {complete
                                                    ? "Details complete"
                                                    : "Complete all required fields"}
                                            </span>
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
                            <span>
                                JOURNEY SUMMARY
                            </span>

                            <h2>
                                {
                                    search.source
                                }
                                {" → "}
                                {
                                    search.destination
                                }
                            </h2>
                        </div>

                        <div className="passenger-summary-train">
                            <span>
                                Train
                            </span>

                            <strong>
                                {
                                    journey.train_number
                                }
                            </strong>

                            <small>
                                {
                                    journey.train_name
                                }
                            </small>
                        </div>

                        <div className="passenger-summary-grid">
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

                        <div className="passenger-selected-seats">
                            <span>
                                Seat assignments
                            </span>

                            <div className="passenger-seat-list">
                                {seats.map(
                                    (
                                        seat,
                                        index
                                    ) => (
                                        <article
                                            key={
                                                seat.seat_id
                                            }
                                        >
                                            <div>
                                                <span>
                                                    Passenger{" "}
                                                    {index +
                                                        1}
                                                </span>

                                                <strong>
                                                    {
                                                        seat.coach_number
                                                    }
                                                    {" / "}
                                                    {
                                                        seat.seat_number
                                                    }
                                                </strong>
                                            </div>

                                            <small>
                                                {BERTH_NAMES[
                                                    seat.berth_type
                                                ] ||
                                                    seat.berth_type}
                                            </small>
                                        </article>
                                    )
                                )}
                            </div>
                        </div>

                        <div className="passenger-fare-breakdown">
                            <div>
                                <span>
                                    Fare per
                                    passenger
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

                        <div className="passenger-fare-row">
                            <span>
                                Total fare
                            </span>

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

                        <button
                            className="primary-button passenger-continue-button"
                            disabled={
                                remaining <= 0
                            }
                            type="submit"
                        >
                            {remaining <= 0
                                ? "Seat hold expired"
                                : completedPassengers ===
                                    passengers.length
                                  ? "Review booking"
                                  : `Complete passengers (${completedPassengers}/${passengers.length})`}
                        </button>

                        <p className="passenger-summary-note">
                            Passenger names
                            should match the
                            traveller details
                            used for the journey.
                        </p>
                    </aside>
                </div>
            </form>
        </main>
    );
}

export default PassengerDetails;