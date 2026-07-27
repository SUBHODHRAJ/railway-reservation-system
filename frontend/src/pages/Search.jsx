import { useEffect, useState } from "react";
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
                setStations(response.data);
            } catch (error) {
                setError(
                    error.response?.data?.message ||
                    "Unable to load stations"
                );
            } finally {
                setLoadingStations(false);
            }
        };

        loadStations();
    }, []);

    const handleChange = event => {
        const { name, value } = event.target;

        setForm(previous => ({
            ...previous,
            [name]: value
        }));

        if (error) {
            setError("");
        }
    };

    const handleSwap = () => {
        setForm(previous => ({
            ...previous,
            source: previous.destination,
            destination: previous.source
        }));

        if (error) {
            setError("");
        }
    };

    const handleSubmit = async event => {
        event.preventDefault();

        setError("");

        if (!form.source || !form.destination || !form.date) {
            setError("Select your route and journey date.");
            return;
        }

        if (form.source === form.destination) {
            setError(
                "Source and destination must be different stations."
            );
            return;
        }

        setSearching(true);

        try {
            const response = await searchTrains(form);

            navigate("/search-results", {
                state: {
                    search: form,
                    trains: response.data
                }
            });
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to search trains"
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

                <h1>Where would you like to go?</h1>

                <p>
                    Search scheduled trains and start your
                    journey in a few simple steps.
                </p>
            </section>

            <section className="content-card search-card">
                <div className="search-card-heading">
                    <div>
                        <h2>Search trains</h2>

                        <p className="muted">
                            Choose your stations and journey date.
                        </p>
                    </div>
                </div>

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
                                loadingStations || searching
                            }
                            required
                        >
                            <option value="">
                                {loadingStations
                                    ? "Loading stations..."
                                    : "Select departure station"}
                            </option>

                            {stations.map(station => (
                                <option
                                    key={station.id}
                                    value={station.station_code}
                                >
                                    {station.station_code}
                                    {" — "}
                                    {station.station_name}
                                </option>
                            ))}
                        </select>
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
                                loadingStations || searching
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
                            value={form.destination}
                            onChange={handleChange}
                            disabled={
                                loadingStations || searching
                            }
                            required
                        >
                            <option value="">
                                {loadingStations
                                    ? "Loading stations..."
                                    : "Select arrival station"}
                            </option>

                            {stations.map(station => (
                                <option
                                    key={station.id}
                                    value={station.station_code}
                                >
                                    {station.station_code}
                                    {" — "}
                                    {station.station_name}
                                </option>
                            ))}
                        </select>
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
        </main>
    );
}

export default Search;
