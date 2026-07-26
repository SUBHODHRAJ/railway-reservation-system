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
    };

    const handleSubmit = async event => {
        event.preventDefault();

        setError("");

        if (form.source === form.destination) {
            setError(
                "Source and destination cannot be same"
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
        <main className="page-container">
            <section className="hero-section">
                <p className="eyebrow">
                    BOOK YOUR JOURNEY
                </p>

                <h1>Find your train</h1>

                <p>
                    Search available railway journeys by
                    station and date.
                </p>
            </section>

            <section className="content-card">
                <form
                    className="search-form"
                    onSubmit={handleSubmit}
                >
                    <div className="form-group">
                        <label htmlFor="source">
                            From
                        </label>

                        <select
                            id="source"
                            name="source"
                            value={form.source}
                            onChange={handleChange}
                            disabled={loadingStations}
                            required
                        >
                            <option value="">
                                Select source
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

                    <button
                        type="button"
                        className="swap-button"
                        onClick={() => {
                            setForm(previous => ({
                                ...previous,
                                source:
                                    previous.destination,
                                destination:
                                    previous.source
                            }));
                        }}
                    >
                        ⇄
                    </button>

                    <div className="form-group">
                        <label htmlFor="destination">
                            To
                        </label>

                        <select
                            id="destination"
                            name="destination"
                            value={form.destination}
                            onChange={handleChange}
                            disabled={loadingStations}
                            required
                        >
                            <option value="">
                                Select destination
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

                    <div className="form-group">
                        <label htmlFor="date">
                            Journey date
                        </label>

                        <input
                            id="date"
                            name="date"
                            type="date"
                            value={form.date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button
                        className="primary-button search-button"
                        type="submit"
                        disabled={
                            searching ||
                            loadingStations
                        }
                    >
                        {searching
                            ? "Searching..."
                            : "Search trains"}
                    </button>
                </form>

                {error && (
                    <div className="form-error top-space">
                        {error}
                    </div>
                )}
            </section>
        </main>
    );
}

export default Search;
