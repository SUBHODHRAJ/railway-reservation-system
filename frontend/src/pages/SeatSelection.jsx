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

const BERTH_INFO = {
    LB: "Lower Berth",
    MB: "Middle Berth",
    UB: "Upper Berth",
    SL: "Side Lower",
    SU: "Side Upper",
    WS: "Window Seat",
    MS: "Middle Seat",
    AS: "Aisle Seat"
};

const BERTH_ORDER = [
    "LB",
    "MB",
    "UB",
    "SL",
    "SU",
    "WS",
    "MS",
    "AS"
];

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

    const [seats, setSeats] =
        useState([]);

    const [selected, setSelected] =
        useState([]);

    const [activeCoach, setActiveCoach] =
        useState("");

    const [berthFilter, setBerthFilter] =
        useState("ALL");

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

        let active = true;

        const loadSeats = async () => {
            setLoading(true);
            setError("");

            try {
                const response =
                    await getSeats(
                        journeyId,
                        classType
                    );

                if (!active) {
                    return;
                }

                setSeats(
                    Array.isArray(
                        response.data
                    )
                        ? response.data
                        : []
                );
            } catch (error) {
                if (!active) {
                    return;
                }

                setError(
                    error.response?.data
                        ?.message ||
                        "Unable to load seats."
                );
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadSeats();

        return () => {
            active = false;
        };
    }, [journeyId, classType]);

    const coaches = useMemo(() => {
        return seats.reduce(
            (result, seat) => {
                const coach =
                    seat.coach_number;

                if (!result[coach]) {
                    result[coach] = [];
                }

                result[coach].push(
                    seat
                );

                return result;
            },
            {}
        );
    }, [seats]);

    const coachNames = useMemo(
        () =>
            Object.keys(coaches).sort(
                (a, b) =>
                    a.localeCompare(
                        b,
                        undefined,
                        {
                            numeric: true
                        }
                    )
            ),
        [coaches]
    );

    useEffect(() => {
        if (
            coachNames.length > 0 &&
            !coachNames.includes(
                activeCoach
            )
        ) {
            setActiveCoach(
                coachNames[0]
            );
        }
    }, [
        coachNames,
        activeCoach
    ]);

    const availableBerths =
        useMemo(() => {
            const types =
                new Set(
                    seats.map(
                        seat =>
                            seat.berth_type
                    )
                );

            return BERTH_ORDER.filter(
                type =>
                    types.has(type)
            );
        }, [seats]);

    useEffect(() => {
        if (
            berthFilter !== "ALL" &&
            !availableBerths.includes(
                berthFilter
            )
        ) {
            setBerthFilter("ALL");
        }
    }, [
        berthFilter,
        availableBerths
    ]);

    if (
        !search ||
        !journey ||
        !classType ||
        !fare
    ) {
        return (
            <Navigate
                to="/search"
                replace
            />
        );
    }

    const activeSeats =
        coaches[activeCoach] || [];

    const filteredSeats =
        berthFilter === "ALL"
            ? activeSeats
            : activeSeats.filter(
                  seat =>
                      seat.berth_type ===
                      berthFilter
              );

    const selectedSeats =
        seats.filter(seat =>
            selected.includes(
                seat.seat_id
            )
        );

    const overallAvailable =
        seats.filter(
            seat =>
                seat.status ===
                "AVAILABLE"
        ).length;

    const activeCoachAvailable =
        activeSeats.filter(
            seat =>
                seat.status ===
                "AVAILABLE"
        ).length;

    const totalFare =
        Number(fare.amount) *
        selected.length;

    const berthStats =
        availableBerths.reduce(
            (result, type) => {
                const matching =
                    seats.filter(
                        seat =>
                            seat.berth_type ===
                            type
                    );

                result[type] = {
                    total:
                        matching.length,
                    available:
                        matching.filter(
                            seat =>
                                seat.status ===
                                "AVAILABLE"
                        ).length,
                    selected:
                        matching.filter(
                            seat =>
                                selected.includes(
                                    seat.seat_id
                                )
                        ).length
                };

                return result;
            },
            {}
        );

    const toggleSeat = seat => {
        if (
            seat.status !==
                "AVAILABLE" ||
            holding
        ) {
            return;
        }

        setError("");

        setSelected(previous => {
            if (
                previous.includes(
                    seat.seat_id
                )
            ) {
                return previous.filter(
                    id =>
                        id !==
                        seat.seat_id
                );
            }

            return [
                ...previous,
                seat.seat_id
            ];
        });
    };

    const handleAutoSelect = () => {
        if (holding) {
            return;
        }

        setError("");

        const preferredSeats =
            seats.filter(
                seat =>
                    seat.status ===
                        "AVAILABLE" &&
                    !selected.includes(
                        seat.seat_id
                    ) &&
                    (berthFilter ===
                        "ALL" ||
                        seat.berth_type ===
                            berthFilter)
            );

        if (
            preferredSeats.length === 0
        ) {
            setError(
                berthFilter === "ALL"
                    ? "No more available seats can be selected."
                    : `No more available ${BERTH_INFO[berthFilter]} seats.`
            );

            return;
        }

        const sameCoachSeat =
            preferredSeats.find(
                seat =>
                    seat.coach_number ===
                    activeCoach
            );

        const nextSeat =
            sameCoachSeat ||
            preferredSeats[0];

        setSelected(previous => [
            ...previous,
            nextSeat.seat_id
        ]);

        setActiveCoach(
            nextSeat.coach_number
        );
    };

    const handleClearSelection = () => {
        if (holding) {
            return;
        }

        setSelected([]);
        setError("");
    };

    const handleContinue = async () => {
        if (
            selected.length === 0
        ) {
            setError(
                "Select at least one available seat."
            );
            return;
        }

        setError("");
        setHolding(true);

        try {
            const response =
                await holdSeats({
                    journeyId:
                        Number(
                            journeyId
                        ),
                    seatIds: selected
                });

            const seatsToBook =
                seats.filter(seat =>
                    selected.includes(
                        seat.seat_id
                    )
                );

            navigate(
                "/passengers",
                {
                    state: {
                        search,
                        journey,
                        classType,
                        fare,
                        seats:
                            seatsToBook,
                        hold:
                            response.data
                    }
                }
            );
        } catch (error) {
            setError(
                error.response?.data
                    ?.message ||
                    "Unable to hold selected seats."
            );

            try {
                const response =
                    await getSeats(
                        journeyId,
                        classType
                    );

                setSeats(
                    Array.isArray(
                        response.data
                    )
                        ? response.data
                        : []
                );

                setSelected([]);
            } catch {
                // Preserve original hold error.
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

                <p>
                    Loading seat
                    availability...
                </p>
            </main>
        );
    }

    return (
        <main className="page-container seat-selection-page">
            <section className="hero-section seat-selection-hero">
                <p className="eyebrow">
                    SELECT SEATS
                </p>

                <div className="seat-page-title">
                    <div>
                        <h1>
                            {
                                journey.train_number
                            }
                            {" — "}
                            {
                                journey.train_name
                            }
                        </h1>

                        <p>
                            {search.source}
                            {" → "}
                            {
                                search.destination
                            }
                            {" • "}
                            {classType}
                        </p>
                    </div>

                    <div className="seat-fare-summary">
                        <span>
                            Fare per
                            passenger
                        </span>

                        <strong>
                            ₹
                            {Number(
                                fare.amount
                            ).toLocaleString(
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
                </div>
            </section>

            <section className="seat-availability-overview">
                <div>
                    <span>
                        Coaches
                    </span>

                    <strong>
                        {
                            coachNames.length
                        }
                    </strong>
                </div>

                <div>
                    <span>
                        Available
                    </span>

                    <strong>
                        {
                            overallAvailable
                        }
                    </strong>
                </div>

                <div>
                    <span>
                        Selected
                    </span>

                    <strong>
                        {
                            selected.length
                        }
                    </strong>
                </div>

                <div>
                    <span>
                        Travel class
                    </span>

                    <strong>
                        {classType}
                    </strong>
                </div>
            </section>

            <section className="seat-selection-layout">
                <div className="seat-selection-main">
                    <section className="content-card seat-picker-card">
                        <div className="seat-picker-header">
                            <div>
                                <h2>
                                    Choose your
                                    seats
                                </h2>

                                <p className="muted">
                                    Select seats
                                    manually or use
                                    auto select to
                                    add the next
                                    available seat.
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

                        <div className="seat-toolbar">
                            <div className="seat-toolbar-heading">
                                <div>
                                    <span>
                                        BERTH
                                        PREFERENCE
                                    </span>

                                    <strong>
                                        Filter
                                        available
                                        seats
                                    </strong>
                                </div>

                                <div className="seat-toolbar-actions">
                                    <button
                                        type="button"
                                        className="secondary-action-button"
                                        onClick={
                                            handleAutoSelect
                                        }
                                        disabled={
                                            holding ||
                                            overallAvailable ===
                                                0
                                        }
                                    >
                                        Auto select
                                        1
                                    </button>

                                    <button
                                        type="button"
                                        className="seat-clear-button"
                                        onClick={
                                            handleClearSelection
                                        }
                                        disabled={
                                            holding ||
                                            selected.length ===
                                                0
                                        }
                                    >
                                        Clear
                                        selection
                                    </button>
                                </div>
                            </div>

                            <div
                                className="berth-filters"
                                aria-label="Berth preference"
                            >
                                <button
                                    type="button"
                                    className={`berth-filter ${
                                        berthFilter ===
                                        "ALL"
                                            ? "berth-filter-active"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        setBerthFilter(
                                            "ALL"
                                        )
                                    }
                                >
                                    <strong>
                                        All
                                    </strong>

                                    <span>
                                        {
                                            overallAvailable
                                        }{" "}
                                        available
                                    </span>
                                </button>

                                {availableBerths.map(
                                    type => {
                                        const stats =
                                            berthStats[
                                                type
                                            ];

                                        return (
                                            <button
                                                type="button"
                                                key={
                                                    type
                                                }
                                                className={`berth-filter ${
                                                    berthFilter ===
                                                    type
                                                        ? "berth-filter-active"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    setBerthFilter(
                                                        type
                                                    )
                                                }
                                            >
                                                <strong>
                                                    {
                                                        BERTH_INFO[
                                                            type
                                                        ]
                                                    }
                                                </strong>

                                                <span>
                                                    {
                                                        stats.available
                                                    }{" "}
                                                    available
                                                    {stats.selected >
                                                    0
                                                        ? ` • ${stats.selected} selected`
                                                        : ""}
                                                </span>
                                            </button>
                                        );
                                    }
                                )}
                            </div>
                        </div>

                        {coachNames.length ===
                        0 ? (
                            <div className="seat-empty-state">
                                <strong>
                                    No seats to
                                    display
                                </strong>

                                <span>
                                    Seat inventory
                                    is unavailable
                                    for this class.
                                </span>
                            </div>
                        ) : (
                            <>
                                <div
                                    className="coach-tabs"
                                    role="tablist"
                                    aria-label="Select coach"
                                >
                                    {coachNames.map(
                                        coach => {
                                            const coachSeats =
                                                coaches[
                                                    coach
                                                ];

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
                                                    key={
                                                        coach
                                                    }
                                                    onClick={() =>
                                                        setActiveCoach(
                                                            coach
                                                        )
                                                    }
                                                >
                                                    <strong>
                                                        {
                                                            coach
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            available
                                                        }{" "}
                                                        available
                                                    </span>

                                                    {selectedInCoach >
                                                        0 && (
                                                        <small>
                                                            {
                                                                selectedInCoach
                                                            }{" "}
                                                            selected
                                                        </small>
                                                    )}
                                                </button>
                                            );
                                        }
                                    )}
                                </div>

                                <div className="coach-panel">
                                    <div className="coach-heading">
                                        <div>
                                            <span>
                                                COACH
                                            </span>

                                            <h2>
                                                {
                                                    activeCoach
                                                }
                                            </h2>
                                        </div>

                                        <div className="coach-availability">
                                            <strong>
                                                {
                                                    activeCoachAvailable
                                                }
                                            </strong>

                                            <span>
                                                seats
                                                available
                                            </span>
                                        </div>
                                    </div>

                                    <div className="coach-direction">
                                        <span>
                                            {berthFilter ===
                                            "ALL"
                                                ? "All berth types"
                                                : BERTH_INFO[
                                                      berthFilter
                                                  ]}
                                        </span>

                                        <span>
                                            Travel
                                            direction
                                            →
                                        </span>
                                    </div>

                                    {filteredSeats.length ===
                                    0 ? (
                                        <div className="seat-filter-empty">
                                            <strong>
                                                No{" "}
                                                {BERTH_INFO[
                                                    berthFilter
                                                ] ||
                                                    ""}{" "}
                                                seats in
                                                this
                                                coach
                                            </strong>

                                            <p>
                                                Try
                                                another
                                                coach or
                                                select a
                                                different
                                                berth
                                                preference.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="seat-grid">
                                            {filteredSeats.map(
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
                                                            aria-label={`Seat ${seat.seat_number}, ${BERTH_INFO[seat.berth_type] || seat.berth_type}, ${
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

                                                            <span className="seat-berth-name">
                                                                {BERTH_INFO[
                                                                    seat.berth_type
                                                                ] ||
                                                                    seat.berth_type}
                                                            </span>
                                                        </button>
                                                    );
                                                }
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </section>
                </div>

                <aside className="seat-booking-summary">
                    <div className="seat-summary-header">
                        <span>
                            BOOKING SUMMARY
                        </span>

                        <h2>
                            {
                                selected.length
                            }{" "}
                            {selected.length ===
                            1
                                ? "seat"
                                : "seats"}{" "}
                            selected
                        </h2>
                    </div>

                    <div className="seat-summary-route">
                        <strong>
                            {
                                search.source
                            }
                        </strong>

                        <span>→</span>

                        <strong>
                            {
                                search.destination
                            }
                        </strong>
                    </div>

                    <div className="seat-summary-details">
                        <div>
                            <span>
                                Class
                            </span>

                            <strong>
                                {classType}
                            </strong>
                        </div>

                        <div>
                            <span>
                                Fare each
                            </span>

                            <strong>
                                ₹
                                {Number(
                                    fare.amount
                                ).toLocaleString(
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
                    </div>

                    <div className="selected-seat-list">
                        <span>
                            Selected seats
                        </span>

                        {selectedSeats.length ===
                        0 ? (
                            <div className="selected-seat-empty">
                                <strong>
                                    No seats
                                    selected
                                </strong>

                                <p>
                                    Choose an
                                    available seat
                                    from the coach
                                    layout.
                                </p>
                            </div>
                        ) : (
                            <div className="selected-seat-details">
                                {selectedSeats.map(
                                    seat => (
                                        <article
                                            key={
                                                seat.seat_id
                                            }
                                        >
                                            <div>
                                                <strong>
                                                    {
                                                        seat.coach_number
                                                    }
                                                    {" / "}
                                                    {
                                                        seat.seat_number
                                                    }
                                                </strong>

                                                <span>
                                                    {BERTH_INFO[
                                                        seat.berth_type
                                                    ] ||
                                                        seat.berth_type}
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                disabled={
                                                    holding
                                                }
                                                onClick={() =>
                                                    toggleSeat(
                                                        seat
                                                    )
                                                }
                                                aria-label={`Remove seat ${seat.seat_number}`}
                                                title="Remove seat"
                                            >
                                                ×
                                            </button>
                                        </article>
                                    )
                                )}
                            </div>
                        )}
                    </div>

                    <div className="seat-summary-total">
                        <div>
                            <span>
                                Total fare
                            </span>

                            {selected.length >
                                0 && (
                                <small>
                                    {
                                        selected.length
                                    }{" "}
                                    × ₹
                                    {Number(
                                        fare.amount
                                    ).toLocaleString(
                                        "en-IN",
                                        {
                                            minimumFractionDigits:
                                                2,
                                            maximumFractionDigits:
                                                2
                                        }
                                    )}
                                </small>
                            )}
                        </div>

                        <strong>
                            ₹
                            {totalFare.toLocaleString(
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
                        type="button"
                        className="primary-button seat-continue-button"
                        disabled={
                            selected.length ===
                                0 ||
                            holding
                        }
                        onClick={
                            handleContinue
                        }
                    >
                        {holding
                            ? "Holding seats..."
                            : selected.length ===
                                0
                              ? "Select seats to continue"
                              : `Continue with ${selected.length} ${
                                    selected.length ===
                                    1
                                        ? "seat"
                                        : "seats"
                                }`}
                    </button>

                    <p className="seat-hold-note">
                        Seat availability is
                        confirmed when your
                        selection is held before
                        passenger details.
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