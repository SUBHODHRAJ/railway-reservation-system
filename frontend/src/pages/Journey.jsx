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

import {
    getAvailability,
    getFare,
    getJourney
} from "../api/trainApi";

const CLASS_INFO = {
    SL: {
        name: "Sleeper",
        description: "Non-AC sleeper accommodation",
        order: 1
    },
    "3A": {
        name: "AC 3 Tier",
        description: "Air-conditioned three-tier sleeper",
        order: 2
    },
    "2A": {
        name: "AC 2 Tier",
        description: "Air-conditioned two-tier sleeper",
        order: 3
    },
    "1A": {
        name: "AC First Class",
        description: "Premium air-conditioned accommodation",
        order: 4
    },
    CC: {
        name: "AC Chair Car",
        description: "Air-conditioned seated accommodation",
        order: 5
    },
    EC: {
        name: "Executive Chair Car",
        description: "Premium air-conditioned seated accommodation",
        order: 6
    }
};

function Journey() {
    const { journeyId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const search = location.state?.search;

    const [journey, setJourney] =
        useState(null);

    const [availability, setAvailability] =
        useState([]);

    const [fares, setFares] =
        useState({});

    const [fareErrors, setFareErrors] =
        useState({});

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        if (!search) {
            return;
        }

        let active = true;

        const loadJourney = async () => {
            setLoading(true);
            setError("");

            try {
                const [
                    journeyResponse,
                    availabilityResponse
                ] = await Promise.all([
                    getJourney(journeyId),
                    getAvailability(journeyId)
                ]);

                if (!active) {
                    return;
                }

                const journeyData =
                    journeyResponse.data;

                const availabilityData =
                    Array.isArray(
                        availabilityResponse.data
                    )
                        ? availabilityResponse.data
                        : [];

                setJourney(journeyData);
                setAvailability(
                    availabilityData
                );

                const fareResults =
                    await Promise.allSettled(
                        availabilityData.map(
                            item =>
                                getFare({
                                    trainId:
                                        journeyData.train_id,
                                    source:
                                        search.source,
                                    destination:
                                        search.destination,
                                    classType:
                                        item.class_type
                                })
                        )
                    );

                if (!active) {
                    return;
                }

                const nextFares = {};
                const nextFareErrors = {};

                fareResults.forEach(
                    (result, index) => {
                        const classType =
                            availabilityData[
                                index
                            ]?.class_type;

                        if (!classType) {
                            return;
                        }

                        if (
                            result.status ===
                            "fulfilled"
                        ) {
                            nextFares[
                                classType
                            ] =
                                result.value.data;
                        } else {
                            nextFareErrors[
                                classType
                            ] = true;
                        }
                    }
                );

                setFares(nextFares);
                setFareErrors(
                    nextFareErrors
                );
            } catch (error) {
                if (!active) {
                    return;
                }

                setError(
                    error.response?.data
                        ?.message ||
                        "Unable to load journey."
                );
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadJourney();

        return () => {
            active = false;
        };
    }, [
        journeyId,
        search?.source,
        search?.destination,
        search?.date
    ]);

    const sortedAvailability =
        useMemo(() => {
            return [...availability].sort(
                (a, b) => {
                    const first =
                        CLASS_INFO[
                            a.class_type
                        ]?.order ??
                        999;

                    const second =
                        CLASS_INFO[
                            b.class_type
                        ]?.order ??
                        999;

                    return first - second;
                }
            );
        }, [availability]);

    const formatDate = date => {
        if (!date) {
            return "—";
        }

        const value =
            String(date).slice(0, 10);

        const [
            year,
            month,
            day
        ] = value.split("-");

        if (
            !year ||
            !month ||
            !day
        ) {
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

    const formatTime = value => {
        if (!value) {
            return "—";
        }

        return String(value)
            .slice(0, 5);
    };

    const formatStatus = value => {
        return String(
            value || "SCHEDULED"
        )
            .replaceAll("_", " ")
            .toUpperCase();
    };

    const getClassInfo = classType => {
        return (
            CLASS_INFO[classType] || {
                name: classType,
                description:
                    "Railway travel class",
                order: 999
            }
        );
    };

    const getAvailabilityState = (
        available,
        total
    ) => {
        if (available <= 0) {
            return {
                key: "unavailable",
                label: "Not available"
            };
        }

        const ratio =
            total > 0
                ? available / total
                : 0;

        if (
            available <= 10 ||
            ratio <= 0.1
        ) {
            return {
                key: "low",
                label: "Limited seats"
            };
        }

        return {
            key: "available",
            label: "Available"
        };
    };

    if (!search) {
        return (
            <Navigate
                to="/search"
                replace
            />
        );
    }

    if (loading) {
        return (
            <main className="route-loading">
                <div
                    className="loading-spinner"
                    aria-hidden="true"
                />

                <p>
                    Loading journey and
                    fares...
                </p>
            </main>
        );
    }

    if (error || !journey) {
        return (
            <main className="page-container">
                <div
                    className="form-error"
                    role="alert"
                >
                    {error ||
                        "Journey information is unavailable."}
                </div>

                <button
                    type="button"
                    className="secondary-action-button top-space"
                    onClick={() =>
                        navigate("/search")
                    }
                >
                    Back to search
                </button>
            </main>
        );
    }

    const route =
        Array.isArray(journey.route)
            ? journey.route
            : [];

    const sourceStop =
        route.find(
            stop =>
                stop.station_code ===
                search.source
        );

    const destinationStop =
        route.find(
            stop =>
                stop.station_code ===
                search.destination
        );

    const totalAvailable =
        availability.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.available_seats ||
                        0
                ),
            0
        );

    return (
        <main className="page-container journey-page">
            <section className="hero-section journey-hero">
                <p className="eyebrow">
                    SELECT TRAVEL CLASS
                </p>

                <div className="journey-title-row">
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
                            {formatDate(
                                journey.journey_date
                            )}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="secondary-action-button journey-back-button"
                        onClick={() =>
                            navigate(-1)
                        }
                    >
                        Back to trains
                    </button>
                </div>
            </section>

            <section className="content-card journey-overview">
                <div className="journey-overview-heading">
                    <div>
                        <span>Journey</span>

                        <strong>
                            {search.source}
                            {" → "}
                            {
                                search.destination
                            }
                        </strong>
                    </div>

                    <span className="journey-status">
                        {formatStatus(
                            journey.status
                        )}
                    </span>
                </div>

                <div className="journey-main-route">
                    <div className="journey-endpoint">
                        <span className="journey-time">
                            {formatTime(
                                sourceStop
                                    ?.departure_time ||
                                    sourceStop
                                        ?.arrival_time
                            )}
                        </span>

                        <strong>
                            {sourceStop
                                ?.station_code ||
                                search.source}
                        </strong>

                        <span>
                            {sourceStop
                                ?.station_name ||
                                "Departure station"}
                        </span>

                        {sourceStop?.city && (
                            <small>
                                {
                                    sourceStop.city
                                }
                            </small>
                        )}
                    </div>

                    <div
                        className="journey-track"
                        aria-hidden="true"
                    >
                        <span className="journey-track-dot" />

                        <div>
                            <span>→</span>
                        </div>

                        <span className="journey-track-dot" />
                    </div>

                    <div className="journey-endpoint journey-endpoint-right">
                        <span className="journey-time">
                            {formatTime(
                                destinationStop
                                    ?.arrival_time ||
                                    destinationStop
                                        ?.departure_time
                            )}
                        </span>

                        <strong>
                            {destinationStop
                                ?.station_code ||
                                search.destination}
                        </strong>

                        <span>
                            {destinationStop
                                ?.station_name ||
                                "Destination station"}
                        </span>

                        {destinationStop?.city && (
                            <small>
                                {
                                    destinationStop.city
                                }
                            </small>
                        )}
                    </div>
                </div>

                <div className="journey-quick-stats">
                    <div>
                        <span>
                            Travel classes
                        </span>

                        <strong>
                            {
                                availability.length
                            }
                        </strong>
                    </div>

                    <div>
                        <span>
                            Seats available
                        </span>

                        <strong>
                            {totalAvailable}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Route stations
                        </span>

                        <strong>
                            {route.length}
                        </strong>
                    </div>
                </div>

                {route.length > 0 && (
                    <div className="journey-route-stops">
                        <div className="route-stops-heading">
                            <span>
                                Train route
                            </span>

                            <strong>
                                {route.length}{" "}
                                {route.length ===
                                1
                                    ? "station"
                                    : "stations"}
                            </strong>
                        </div>

                        <div className="journey-route">
                            {route.map(
                                (
                                    stop,
                                    index
                                ) => {
                                    const isSource =
                                        stop.station_code ===
                                        search.source;

                                    const isDestination =
                                        stop.station_code ===
                                        search.destination;

                                    return (
                                        <div
                                            className={`route-stop ${
                                                isSource ||
                                                isDestination
                                                    ? "route-stop-highlight"
                                                    : ""
                                            }`}
                                            key={
                                                stop.station_id ??
                                                `${stop.station_code}-${index}`
                                            }
                                        >
                                            <span
                                                className="route-stop-marker"
                                                aria-hidden="true"
                                            />

                                            <strong>
                                                {
                                                    stop.station_code
                                                }
                                            </strong>

                                            <span>
                                                {
                                                    stop.station_name
                                                }
                                            </span>

                                            <small>
                                                {isSource
                                                    ? "Boarding station"
                                                    : isDestination
                                                      ? "Destination"
                                                      : stop.city ||
                                                        "Intermediate station"}
                                            </small>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    </div>
                )}
            </section>

            <section className="class-section journey-class-section">
                <div className="section-heading-row">
                    <div>
                        <p className="eyebrow">
                            AVAILABILITY & FARE
                        </p>

                        <h2>
                            Choose your class
                        </h2>

                        <p className="muted">
                            Fare shown is per
                            passenger for the
                            selected route.
                        </p>
                    </div>

                    <span>
                        {
                            availability.length
                        }{" "}
                        travel{" "}
                        {availability.length ===
                        1
                            ? "class"
                            : "classes"}
                    </span>
                </div>

                {sortedAvailability.length ===
                0 ? (
                    <section className="content-card journey-no-classes">
                        <strong>
                            No class availability
                        </strong>

                        <p>
                            No travel classes are
                            currently available
                            for this journey.
                        </p>
                    </section>
                ) : (
                    <div className="class-grid">
                        {sortedAvailability.map(
                            item => {
                                const available =
                                    Number(
                                        item.available_seats ||
                                            0
                                    );

                                const total =
                                    Number(
                                        item.total_seats ||
                                            0
                                    );

                                const fare =
                                    fares[
                                        item
                                            .class_type
                                    ];

                                const fareFailed =
                                    Boolean(
                                        fareErrors[
                                            item
                                                .class_type
                                        ]
                                    );

                                const info =
                                    getClassInfo(
                                        item.class_type
                                    );

                                const state =
                                    getAvailabilityState(
                                        available,
                                        total
                                    );

                                const percent =
                                    total > 0
                                        ? Math.min(
                                              100,
                                              Math.max(
                                                  0,
                                                  (available /
                                                      total) *
                                                      100
                                              )
                                          )
                                        : 0;

                                const disabled =
                                    available ===
                                        0 ||
                                    !fare;

                                return (
                                    <article
                                        className={`class-card class-card-${state.key}`}
                                        key={
                                            item.class_type
                                        }
                                    >
                                        <div className="class-card-header">
                                            <div>
                                                <span className="class-code">
                                                    {
                                                        item.class_type
                                                    }
                                                </span>

                                                <h3>
                                                    {
                                                        info.name
                                                    }
                                                </h3>

                                                <p className="class-description">
                                                    {
                                                        info.description
                                                    }
                                                </p>
                                            </div>

                                            <div className="class-fare">
                                                <span>
                                                    Fare
                                                </span>

                                                {fare ? (
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
                                                ) : (
                                                    <strong className="class-fare-unavailable">
                                                        —
                                                    </strong>
                                                )}

                                                <small>
                                                    per
                                                    passenger
                                                </small>
                                            </div>
                                        </div>

                                        <div className="class-availability">
                                            <div className="class-availability-heading">
                                                <div>
                                                    <span
                                                        className={`availability-state availability-state-${state.key}`}
                                                    >
                                                        {
                                                            state.label
                                                        }
                                                    </span>

                                                    <strong>
                                                        {available >
                                                        0
                                                            ? `${available} seats`
                                                            : "No seats"}
                                                    </strong>
                                                </div>

                                                <span>
                                                    {
                                                        total
                                                    }{" "}
                                                    total
                                                </span>
                                            </div>

                                            <div
                                                className={`availability-meter availability-meter-${state.key}`}
                                                aria-label={`${available} of ${total} seats available`}
                                            >
                                                <span
                                                    style={{
                                                        width: `${percent}%`
                                                    }}
                                                />
                                            </div>

                                            <small className="class-capacity-text">
                                                {available >
                                                0
                                                    ? `${Math.round(
                                                          percent
                                                      )}% of this class is currently available`
                                                    : "This class cannot currently be selected"}
                                            </small>
                                        </div>

                                        {fareFailed && (
                                            <div className="class-fare-message">
                                                Fare could
                                                not be
                                                loaded for
                                                this class.
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            className="primary-button class-select-button"
                                            disabled={
                                                disabled
                                            }
                                            onClick={() =>
                                                navigate(
                                                    `/journey/${journeyId}/seats`,
                                                    {
                                                        state: {
                                                            search,
                                                            journey,
                                                            classType:
                                                                item.class_type,
                                                            fare
                                                        }
                                                    }
                                                )
                                            }
                                        >
                                            {available ===
                                            0
                                                ? "Unavailable"
                                                : !fare
                                                  ? "Fare unavailable"
                                                  : `Select ${item.class_type}`}
                                        </button>
                                    </article>
                                );
                            }
                        )}
                    </div>
                )}
            </section>
        </main>
    );
}

export default Journey;