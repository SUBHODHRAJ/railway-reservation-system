import { useEffect, useMemo, useState } from "react";
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

    const [loading, setLoading] = useState(true);
    const [holding, setHolding] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!classType) {
            return;
        }

        const loadSeats = async () => {
            try {
                const response =
                    await getSeats(journeyId, classType);

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

        setSelected(previous => {
            if (previous.includes(seat.seat_id)) {
                return previous.filter(
                    id => id !== seat.seat_id
                );
            }

            return [...previous, seat.seat_id];
        });
    };

    const handleContinue = async () => {
        if (selected.length === 0) {
            setError(
                "Select at least one available seat"
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

            const selectedSeats = seats.filter(
                seat =>
                    selected.includes(seat.seat_id)
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
                            await getSeats(journeyId, classType);

                setSeats(response.data);
                setSelected([]);
            } catch {
                // Keep original error visible.
            }
        } finally {
            setHolding(false);
        }
    };

    if (loading) {
        return (
            <main className="route-loading">
                <div className="loading-spinner"></div>
                <p>Loading seats...</p>
            </main>
        );
    }

    return (
        <main className="page-container">
            <section className="hero-section">
                <p className="eyebrow">
                    SELECT SEATS
                </p>

                <h1>
                    {journey.train_number}
                    {" at "}
                    {classType}
                </h1>

                <p>
                    {search.source}
                    {" → "}
                    {search.destination}
                </p>
            </section>

            <div className="seat-legend">
                <span>
                    <i className="legend-box available"></i>
                    Available
                </span>

                <span>
                    <i className="legend-box selected"></i>
                    Selected
                </span>

                <span>
                    <i className="legend-box unavailable"></i>
                    Unavailable
                </span>
            </div>

            {Object.entries(coaches).map(
                ([coach, coachSeats]) => (
                    <section
                        className="content-card coach-card"
                        key={coach}
                    >
                        <div className="coach-heading">
                            <h2>Coach {coach}</h2>

                            <span>{classType}</span>
                        </div>

                        <div className="seat-grid">
                            {coachSeats.map(seat => {
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
                                        key={seat.seat_id}
                                        disabled={unavailable}
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
                                            {seat.berth_type}
                                        </small>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                )
            )}

            <section className="booking-summary-bar">
                <div>
                    <strong>
                        {selected.length}
                    </strong>
                    {" seat"}
                    {selected.length === 1
                        ? ""
                        : "s"}
                    {" selected"}
                </div>

                <div>
                    ₹
                    {(
                        Number(fare.amount) *
                        selected.length
                    ).toFixed(2)}
                </div>

                <button
                    className="primary-button"
                    disabled={
                        selected.length === 0 ||
                        holding
                    }
                    onClick={handleContinue}
                >
                    {holding
                        ? "Holding seats..."
                        : "Continue"}
                </button>
            </section>

            {error && (
                <div className="form-error top-space">
                    {error}
                </div>
            )}
        </main>
    );
}

export default SeatSelection;
