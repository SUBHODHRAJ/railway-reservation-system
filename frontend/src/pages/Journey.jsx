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
    const [availability, setAvailability] =
        useState([]);

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

                setJourney(journeyData);
                setAvailability(
                    availabilityResponse.data
                );

                if (search) {
                    const fareResults =
                        await Promise.allSettled(
                            availabilityResponse.data.map(
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

                    const nextFares = {};

                    fareResults.forEach(
                        (result, index) => {
                            if (
                                result.status ===
                                "fulfilled"
                            ) {
                                const classType =
                                    availabilityResponse
                                        .data[index]
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

    if (!search) {
        return <Navigate to="/search" replace />;
    }

    if (loading) {
        return (
            <main className="route-loading">
                <div className="loading-spinner"></div>
                <p>Loading journey...</p>
            </main>
        );
    }

    if (error) {
        return (
            <main className="page-container">
                <div className="form-error">
                    {error}
                </div>
            </main>
        );
    }

    return (
        <main className="page-container">
            <section className="hero-section">
                <p className="eyebrow">
                    SELECT CLASS
                </p>

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
                    {journey.journey_date}
                </p>
            </section>

            <section className="content-card">
                <h2>Route</h2>

                <div className="journey-route">
                    {journey.route.map(stop => (
                        <div
                            className="route-stop"
                            key={stop.station_id}
                        >
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
                    ))}
                </div>
            </section>

            <section className="class-section">
                <h2>Availability</h2>

                <div className="class-grid">
                    {availability.map(item => {
                        const available =
                            Number(
                                item.available_seats
                            );

                        const fare =
                            fares[item.class_type];

                        return (
                            <article
                                className="class-card"
                                key={item.class_type}
                            >
                                <h3>
                                    {item.class_type}
                                </h3>

                                <strong
                                    className={
                                        available > 0
                                            ? "available-text"
                                            : "unavailable-text"
                                    }
                                >
                                    {available} available
                                </strong>

                                <span>
                                    {item.total_seats}
                                    {" total seats"}
                                </span>

                                {fare && (
                                    <div className="fare">
                                        ₹
                                        {Number(
                                            fare.amount
                                        ).toFixed(2)}
                                    </div>
                                )}

                                <button
                                    className="primary-button"
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
                                    Select seats
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