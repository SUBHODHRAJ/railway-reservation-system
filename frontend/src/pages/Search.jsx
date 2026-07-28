import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    getStations,
    searchTrains
} from "../api/trainApi";

function Search() {
    const navigate = useNavigate();

    const [stations, setStations] = useState([]);

    const [form, setForm] = useState({
        source: "",
        destination: "",
        date: ""
    });

    const [loadingStations, setLoadingStations] =
        useState(true);

    const [searching, setSearching] =
        useState(false);

    const [error, setError] = useState("");

    const today = new Date();

    const minDate = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    useEffect(() => {
        const loadStations = async () => {
            try {
                const response = await getStations();

                setStations(
                    Array.isArray(response.data)
                        ? response.data
                        : []
                );
            } catch (error) {
                setError(
                    error.response?.data?.message ||
                    "Unable to load stations."
                );
            } finally {
                setLoadingStations(false);
            }
        };

        loadStations();
    }, []);

    const stationMap = useMemo(() => {
        return stations.reduce(
            (result, station) => {
                result[station.station_code] =
                    station;

                return result;
            },
            {}
        );
    }, [stations]);

    const sourceStation =
        stationMap[form.source];

    const destinationStation =
        stationMap[form.destination];

    const handleChange = event => {
        const { name, value } =
            event.target;

        setForm(previous => ({
            ...previous,
            [name]: value
        }));

        setError("");
    };

    const handleSwap = () => {
        setForm(previous => ({
            ...previous,
            source: previous.destination,
            destination: previous.source
        }));

        setError("");
    };

    const handleSubmit = async event => {
        event.preventDefault();

        if (searching) {
            return;
        }

        setError("");

        if (
            !form.source ||
            !form.destination ||
            !form.date
        ) {
            setError(
                "Select your route and journey date."
            );
            return;
        }

        if (
            form.source ===
            form.destination
        ) {
            setError(
                "Source and destination must be different stations."
            );
            return;
        }

        if (form.date < minDate) {
            setError(
                "Journey date cannot be in the past."
            );
            return;
        }

        setSearching(true);

        try {
            const response =
                await searchTrains(form);

            navigate("/search-results", {
                state: {
                    search: form,
                    trains: Array.isArray(
                        response.data
                    )
                        ? response.data
                        : []
                }
            });
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to search trains."
            );
        } finally {
            setSearching(false);
        }
    };

    return (
        <main className="page-container search-page">
            <section className="hero-section search-hero">
                <p className="eyebrow">
                    RAILWAY RESERVATION
                </p>

                <h1>
                    Where would you like to go?
                </h1>

                <p>
                    Search scheduled trains, compare
                    availability and reserve your journey.
                </p>
            </section>

            <section className="content-card search-card">
                <header className="search-card-heading">
                    <div>
                        <h2>Search trains</h2>

                        <p className="muted">
                            Choose your departure,
                            destination and journey date.
                        </p>
                    </div>

                    {!loadingStations && (
                        <span className="search-station-count">
                            {stations.length}{" "}
                            {stations.length === 1
                                ? "station"
                                : "stations"}
                        </span>
                    )}
                </header>

                <form
                    className="search-form"
                    onSubmit={handleSubmit}
                >
                    <div className="form-group station-field">
                        <label htmlFor="source">
                            From
                        </label>

                        <select
                            id="source"
                            name="source"
                            value={form.source}
                            onChange={handleChange}
                            disabled={
                                loadingStations ||
                                searching
                            }
                            required
                        >
                            <option value="">
                                {loadingStations
                                    ? "Loading stations..."
                                    : "Select departure station"}
                            </option>

                            {stations.map(
                                station => (
                                    <option
                                        key={
                                            station.id
                                        }
                                        value={
                                            station.station_code
                                        }
                                    >
                                        {
                                            station.station_code
                                        }
                                        {" — "}
                                        {
                                            station.station_name
                                        }
                                    </option>
                                )
                            )}
                        </select>

                        {sourceStation && (
                            <span className="search-field-detail">
                                {sourceStation.station_name}
                                {sourceStation.city
                                    ? ` • ${sourceStation.city}`
                                    : ""}
                            </span>
                        )}
                    </div>

                    <div className="swap-control">
                        <span
                            className="swap-label"
                            aria-hidden="true"
                        >
                            Route
                        </span>

                        <button
                            type="button"
                            className="swap-button"
                            onClick={handleSwap}
                            disabled={
                                loadingStations ||
                                searching ||
                                (!form.source &&
                                    !form.destination)
                            }
                            aria-label="Swap departure and destination stations"
                            title="Swap stations"
                        >
                            ⇄
                        </button>
                    </div>

                    <div className="form-group station-field">
                        <label htmlFor="destination">
                            To
                        </label>

                        <select
                            id="destination"
                            name="destination"
                            value={
                                form.destination
                            }
                            onChange={handleChange}
                            disabled={
                                loadingStations ||
                                searching
                            }
                            required
                        >
                            <option value="">
                                {loadingStations
                                    ? "Loading stations..."
                                    : "Select arrival station"}
                            </option>

                            {stations.map(
                                station => (
                                    <option
                                        key={
                                            station.id
                                        }
                                        value={
                                            station.station_code
                                        }
                                    >
                                        {
                                            station.station_code
                                        }
                                        {" — "}
                                        {
                                            station.station_name
                                        }
                                    </option>
                                )
                            )}
                        </select>

                        {destinationStation && (
                            <span className="search-field-detail">
                                {
                                    destinationStation.station_name
                                }
                                {destinationStation.city
                                    ? ` • ${destinationStation.city}`
                                    : ""}
                            </span>
                        )}
                    </div>

                    <div className="form-group date-field">
                        <label htmlFor="date">
                            Journey date
                        </label>

                        <input
                            id="date"
                            name="date"
                            type="date"
                            min={minDate}
                            value={form.date}
                            onChange={handleChange}
                            disabled={searching}
                            required
                        />

                        <span className="search-field-detail">
                            Select your travel date
                        </span>
                    </div>

                    <div className="search-action">
                        <button
                            className="primary-button search-button"
                            type="submit"
                            disabled={
                                searching ||
                                loadingStations
                            }
                        >
                            {searching
                                ? "Searching trains..."
                                : "Search trains"}
                        </button>
                    </div>
                </form>

                {error && (
                    <div
                        className="form-error top-space"
                        role="alert"
                    >
                        {error}
                    </div>
                )}
            </section>

            <section className="search-benefits">
                <article>
                    <span>01</span>

                    <div>
                        <strong>
                            Find your journey
                        </strong>

                        <p>
                            Search available scheduled
                            services by route and date.
                        </p>
                    </div>
                </article>

                <article>
                    <span>02</span>

                    <div>
                        <strong>
                            Choose your seat
                        </strong>

                        <p>
                            Review class availability and
                            select available seats.
                        </p>
                    </div>
                </article>

                <article>
                    <span>03</span>

                    <div>
                        <strong>
                            Manage your booking
                        </strong>

                        <p>
                            Access your PNR, ticket and
                            reservation details anytime.
                        </p>
                    </div>
                </article>
            </section>
        </main>
    );
}

export default Search;