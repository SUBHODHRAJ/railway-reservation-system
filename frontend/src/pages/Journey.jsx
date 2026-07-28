import { useEffect, useState } from "react";
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

function Journey() {
    const { journeyId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const search = location.state?.search;

    const [journey, setJourney] = useState(null);
    const [availability, setAvailability] = useState([]);
    const [fares, setFares] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadJourney = async () => {
            try {
                const [
                    journeyResponse,
                    availabilityResponse
                ] = await Promise.all([
                    getJourney(journeyId),
                    getAvailability(journeyId)
                ]);

                const journeyData =
                    journeyResponse.data;

                const availabilityData =
                    availabilityResponse.data;

                setJourney(journeyData);
                setAvailability(availabilityData);

                if (search) {
                    const fareResults =
                        await Promise.allSettled(
                            availabilityData.map(item =>
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

                    const nextFares = {};

                    fareResults.forEach(
                        (result, index) => {
                            if (
                                result.status ===
                                "fulfilled"
                            ) {
                                const classType =
                                    availabilityData[index]
                                        .class_type;

                                nextFares[classType] =
                                    result.value.data;
                            }
                        }
                    );

                    setFares(nextFares);
                }
            } catch (error) {
                setError(
                    error.response?.data?.message ||
                    "Unable to load journey"
                );
            } finally {
                setLoading(false);
            }
        };

        loadJourney();
    }, [journeyId, search]);

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
            weekday: "short",
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

    const getClassName = classType => {
        const names = {
            SL: "Sleeper",
            "3A": "AC 3 Tier",
            "2A": "AC 2 Tier",
            "1A": "AC First Class"
        };

        return names[classType] || classType;
    };

    if (!search) {
        return <Navigate to="/search" replace />;
    }

    if (loading) {
        return (
            <main className="route-loading">
                <div
                    className="loading-spinner"
                    aria-hidden="true"
                />

                <p>Loading journey...</p>
            </main>
        );
    }

    if (error) {
        return (
            <main className="page-container">
                <div
                    className="form-error"
                    role="alert"
                >
                    {error}
                </div>
            </main>
        );
    }

    const sourceStop = journey.route?.find(
        stop =>
            stop.station_code === search.source
    );

    const destinationStop = journey.route?.find(
        stop =>
            stop.station_code === search.destination
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
                            {journey.train_number}
                            {" — "}
                            {journey.train_name}
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
                            {search.destination}
                        </strong>
                    </div>

                    <span className="journey-status">
                        {journey.status || "SCHEDULED"}
                    </span>
                </div>

                <div className="journey-main-route">
                    <div className="journey-endpoint">
                        <span className="journey-time">
                            {sourceStop?.departure_time ||
                                sourceStop?.arrival_time ||
                                "—"}
                        </span>

                        <strong>
                            {sourceStop?.station_code ||
                                search.source}
                        </strong>

                        <span>
                            {sourceStop?.station_name ||
                                "Departure station"}
                        </span>

                        {sourceStop?.city && (
                            <small>
                                {sourceStop.city}
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
                            {destinationStop?.arrival_time ||
                                destinationStop?.departure_time ||
                                "—"}
                        </span>

                        <strong>
                            {destinationStop?.station_code ||
                                search.destination}
                        </strong>

                        <span>
                            {destinationStop?.station_name ||
                                "Destination station"}
                        </span>

                        {destinationStop?.city && (
                            <small>
                                {destinationStop.city}
                            </small>
                        )}
                    </div>
                </div>

                {journey.route?.length > 0 && (
                    <div className="journey-route-stops">
                        <div className="route-stops-heading">
                            <span>Route</span>

                            <strong>
                                {journey.route.length}
                                {" "}
                                {journey.route.length === 1
                                    ? "station"
                                    : "stations"}
                            </strong>
                        </div>

                        <div className="journey-route">
                            {journey.route.map(
                                (stop, index) => (
                                    <div
                                        className="route-stop"
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
                                            {stop.station_code}
                                        </strong>

                                        <span>
                                            {stop.station_name}
                                        </span>

                                        <small>
                                            {stop.city}
                                        </small>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                )}
            </section>

            <section className="class-section journey-class-section">
                <div className="section-heading-row">
                    <div>
                        <p className="eyebrow">
                            AVAILABILITY
                        </p>

                        <h2>Choose your class</h2>
                    </div>

                    <span>
                        {availability.length} travel{" "}
                        {availability.length === 1
                            ? "class"
                            : "classes"}
                    </span>
                </div>

                <div className="class-grid">
                    {availability.map(item => {
                        const available = Number(
                            item.available_seats
                        );

                        const total = Number(
                            item.total_seats
                        );

                        const fare =
                            fares[item.class_type];

                        const availabilityPercent =
                            total > 0
                                ? Math.min(
                                    100,
                                    Math.max(
                                        0,
                                        (available / total) *
                                            100
                                    )
                                )
                                : 0;

                        return (
                            <article
                                className={`class-card ${
                                    available === 0
                                        ? "class-card-unavailable"
                                        : ""
                                }`}
                                key={item.class_type}
                            >
                                <div className="class-card-header">
                                    <div>
                                        <span className="class-code">
                                            {item.class_type}
                                        </span>

                                        <h3>
                                            {getClassName(
                                                item.class_type
                                            )}
                                        </h3>
                                    </div>

                                    {fare && (
                                        <div className="class-fare">
                                            <span>Fare</span>

                                            <strong>
                                                ₹
                                                {Number(
                                                    fare.amount
                                                ).toFixed(2)}
                                            </strong>
                                        </div>
                                    )}
                                </div>

                                <div className="class-availability">
                                    <div>
                                        <strong
                                            className={
                                                available > 0
                                                    ? "available-text"
                                                    : "unavailable-text"
                                            }
                                        >
                                            {available > 0
                                                ? `${available} seats available`
                                                : "Not available"}
                                        </strong>

                                        <span>
                                            {total} total seats
                                        </span>
                                    </div>

                                    <div
                                        className="availability-meter"
                                        aria-hidden="true"
                                    >
                                        <span
                                            style={{
                                                width: `${availabilityPercent}%`
                                            }}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="primary-button class-select-button"
                                    disabled={
                                        available === 0 ||
                                        !fare
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
                                    {available === 0
                                        ? "Unavailable"
                                        : !fare
                                        ? "Fare unavailable"
                                        : "Select seats"}
                                </button>
                            </article>
                        );
                    })}
                </div>
            </section>
        </main>
    );
}

export default Journey;