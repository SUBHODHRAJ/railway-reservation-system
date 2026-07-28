import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    Navigate,
    useLocation,
    useNavigate,
    useParams
} from "react-router-dom";

import { getSeats } from "../api/trainApi";
import { holdSeats } from "../api/bookingApi";

function SeatSelection() {
    const { journeyId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const {
        search,
        journey,
        classType,
        fare
    } = location.state || {};

    const [seats, setSeats] = useState([]);
    const [selected, setSelected] = useState([]);

    const [activeCoach, setActiveCoach] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [holding, setHolding] =
        useState(false);

    const [error, setError] =
        useState("");

    useEffect(() => {
        if (!classType) {
            return;
        }

        const loadSeats = async () => {
            try {
                const response =
                    await getSeats(
                        journeyId,
                        classType
                    );

                setSeats(response.data);
            } catch (error) {
                setError(
                    error.response?.data?.message ||
                    "Unable to load seats"
                );
            } finally {
                setLoading(false);
            }
        };

        loadSeats();
    }, [journeyId, classType]);

    const coaches = useMemo(() => {
        return seats.reduce((result, seat) => {
            if (!result[seat.coach_number]) {
                result[seat.coach_number] = [];
            }

            result[seat.coach_number].push(seat);

            return result;
        }, {});
    }, [seats]);

    const coachNames = useMemo(
        () => Object.keys(coaches),
        [coaches]
    );

    useEffect(() => {
        if (
            coachNames.length > 0 &&
            !coachNames.includes(activeCoach)
        ) {
            setActiveCoach(coachNames[0]);
        }
    }, [coachNames, activeCoach]);

    if (
        !search ||
        !journey ||
        !classType ||
        !fare
    ) {
        return <Navigate to="/search" replace />;
    }

    const toggleSeat = seat => {
        if (seat.status !== "AVAILABLE") {
            return;
        }

        setError("");

        setSelected(previous => {
            if (
                previous.includes(seat.seat_id)
            ) {
                return previous.filter(
                    id => id !== seat.seat_id
                );
            }

            return [
                ...previous,
                seat.seat_id
            ];
        });
    };

    const handleContinue = async () => {
        if (selected.length === 0) {
            setError(
                "Select at least one available seat."
            );
            return;
        }

        setError("");
        setHolding(true);

        try {
            const response = await holdSeats({
                journeyId: Number(journeyId),
                seatIds: selected
            });

            const selectedSeats =
                seats.filter(seat =>
                    selected.includes(
                        seat.seat_id
                    )
                );

            navigate("/passengers", {
                state: {
                    search,
                    journey,
                    classType,
                    fare,
                    seats: selectedSeats,
                    hold: response.data
                }
            });
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to hold selected seats"
            );

            try {
                const response =
                    await getSeats(
                        journeyId,
                        classType
                    );

                setSeats(response.data);
                setSelected([]);
            } catch {
                // Preserve the original hold error.
            }
        } finally {
            setHolding(false);
        }
    };

    if (loading) {
        return (
            <main className="route-loading">
                <div
                    className="loading-spinner"
                    aria-hidden="true"
                />

                <p>Loading seats...</p>
            </main>
        );
    }

    const activeSeats =
        coaches[activeCoach] || [];

    const availableCount =
        activeSeats.filter(
            seat =>
                seat.status === "AVAILABLE"
        ).length;

    const selectedSeats =
        seats.filter(seat =>
            selected.includes(seat.seat_id)
        );

    const totalFare =
        Number(fare.amount) *
        selected.length;

    return (
        <main className="page-container seat-selection-page">
            <section className="hero-section seat-selection-hero">
                <p className="eyebrow">
                    SELECT SEATS
                </p>

                <div className="seat-page-title">
                    <div>
                        <h1>
                            {journey.train_number}
                            {" — "}
                            {journey.train_name}
                        </h1>

                        <p>
                            {search.source}
                            {" → "}
                            {search.destination}
                            {" • "}
                            {classType}
                        </p>
                    </div>

                    <div className="seat-fare-summary">
                        <span>Fare per passenger</span>

                        <strong>
                            ₹
                            {Number(
                                fare.amount
                            ).toFixed(2)}
                        </strong>
                    </div>
                </div>
            </section>

            <section className="seat-selection-layout">
                <div className="seat-selection-main">
                    <section className="content-card seat-picker-card">
                        <div className="seat-picker-header">
                            <div>
                                <h2>Choose your seats</h2>

                                <p className="muted">
                                    Select one seat for each
                                    passenger travelling.
                                </p>
                            </div>

                            <div className="seat-legend">
                                <span>
                                    <i className="legend-box available" />
                                    Available
                                </span>

                                <span>
                                    <i className="legend-box selected" />
                                    Selected
                                </span>

                                <span>
                                    <i className="legend-box unavailable" />
                                    Unavailable
                                </span>
                            </div>
                        </div>

                        {coachNames.length === 0 ? (
                            <div className="seat-empty-state">
                                <strong>
                                    No seats available
                                </strong>

                                <span>
                                    There are no seats to
                                    display for this class.
                                </span>
                            </div>
                        ) : (
                            <>
                                <div
                                    className="coach-tabs"
                                    role="tablist"
                                    aria-label="Select coach"
                                >
                                    {coachNames.map(coach => {
                                        const coachSeats =
                                            coaches[coach];

                                        const available =
                                            coachSeats.filter(
                                                seat =>
                                                    seat.status ===
                                                    "AVAILABLE"
                                            ).length;

                                        const selectedInCoach =
                                            coachSeats.filter(
                                                seat =>
                                                    selected.includes(
                                                        seat.seat_id
                                                    )
                                            ).length;

                                        return (
                                            <button
                                                type="button"
                                                role="tab"
                                                aria-selected={
                                                    activeCoach ===
                                                    coach
                                                }
                                                className={`coach-tab ${
                                                    activeCoach ===
                                                    coach
                                                        ? "coach-tab-active"
                                                        : ""
                                                }`}
                                                key={coach}
                                                onClick={() =>
                                                    setActiveCoach(
                                                        coach
                                                    )
                                                }
                                            >
                                                <strong>
                                                    {coach}
                                                </strong>

                                                <span>
                                                    {selectedInCoach >
                                                    0
                                                        ? `${selectedInCoach} selected`
                                                        : `${available} available`}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="coach-panel">
                                    <div className="coach-heading">
                                        <div>
                                            <span>
                                                COACH
                                            </span>

                                            <h2>
                                                {activeCoach}
                                            </h2>
                                        </div>

                                        <div className="coach-availability">
                                            <strong>
                                                {availableCount}
                                            </strong>

                                            <span>
                                                seats available
                                            </span>
                                        </div>
                                    </div>

                                    <div className="coach-direction">
                                        <span>Coach layout</span>

                                        <span>
                                            Travel direction →
                                        </span>
                                    </div>

                                    <div className="seat-grid">
                                        {activeSeats.map(
                                            seat => {
                                                const isSelected =
                                                    selected.includes(
                                                        seat.seat_id
                                                    );

                                                const unavailable =
                                                    seat.status !==
                                                    "AVAILABLE";

                                                return (
                                                    <button
                                                        type="button"
                                                        key={
                                                            seat.seat_id
                                                        }
                                                        disabled={
                                                            unavailable ||
                                                            holding
                                                        }
                                                        aria-pressed={
                                                            isSelected
                                                        }
                                                        aria-label={`Seat ${seat.seat_number}, ${seat.berth_type}, ${
                                                            unavailable
                                                                ? "unavailable"
                                                                : isSelected
                                                                ? "selected"
                                                                : "available"
                                                        }`}
                                                        onClick={() =>
                                                            toggleSeat(
                                                                seat
                                                            )
                                                        }
                                                        className={`seat ${
                                                            isSelected
                                                                ? "seat-selected"
                                                                : unavailable
                                                                ? "seat-unavailable"
                                                                : "seat-available"
                                                        }`}
                                                    >
                                                        <strong>
                                                            {
                                                                seat.seat_number
                                                            }
                                                        </strong>

                                                        <small>
                                                            {
                                                                seat.berth_type
                                                            }
                                                        </small>
                                                    </button>
                                                );
                                            }
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </section>
                </div>

                <aside className="seat-booking-summary">
                    <div className="seat-summary-header">
                        <span>BOOKING SUMMARY</span>

                        <h2>
                            {selected.length}
                            {" "}
                            {selected.length === 1
                                ? "seat"
                                : "seats"}{" "}
                            selected
                        </h2>
                    </div>

                    <div className="seat-summary-route">
                        <strong>
                            {search.source}
                        </strong>

                        <span>→</span>

                        <strong>
                            {search.destination}
                        </strong>
                    </div>

                    <div className="seat-summary-details">
                        <div>
                            <span>Class</span>
                            <strong>
                                {classType}
                            </strong>
                        </div>

                        <div>
                            <span>Fare each</span>

                            <strong>
                                ₹
                                {Number(
                                    fare.amount
                                ).toFixed(2)}
                            </strong>
                        </div>
                    </div>

                    <div className="selected-seat-list">
                        <span>Selected seats</span>

                        {selectedSeats.length === 0 ? (
                            <p>
                                No seats selected yet.
                            </p>
                        ) : (
                            <div className="selected-seat-chips">
                                {selectedSeats.map(
                                    seat => (
                                        <button
                                            type="button"
                                            key={
                                                seat.seat_id
                                            }
                                            disabled={holding}
                                            onClick={() =>
                                                toggleSeat(
                                                    seat
                                                )
                                            }
                                            title="Remove seat"
                                        >
                                            <strong>
                                                {
                                                    seat.coach_number
                                                }
                                                {" / "}
                                                {
                                                    seat.seat_number
                                                }
                                            </strong>

                                            <span>×</span>
                                        </button>
                                    )
                                )}
                            </div>
                        )}
                    </div>

                    <div className="seat-summary-total">
                        <span>Total fare</span>

                        <strong>
                            ₹{totalFare.toFixed(2)}
                        </strong>
                    </div>

                    <button
                        type="button"
                        className="primary-button seat-continue-button"
                        disabled={
                            selected.length === 0 ||
                            holding
                        }
                        onClick={handleContinue}
                    >
                        {holding
                            ? "Holding seats..."
                            : selected.length === 0
                            ? "Select seats to continue"
                            : `Continue with ${selected.length} ${
                                selected.length === 1
                                    ? "seat"
                                    : "seats"
                            }`}
                    </button>

                    <p className="seat-hold-note">
                        Selected seats are held when you
                        continue to passenger details.
                    </p>
                </aside>
            </section>

            {error && (
                <div
                    className="form-error seat-selection-error"
                    role="alert"
                >
                    {error}
                </div>
            )}
        </main>
    );
}

export default SeatSelection;