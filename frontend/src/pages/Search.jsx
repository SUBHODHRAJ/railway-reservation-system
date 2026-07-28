import {
    useEffect,
    useMemo,
    useState
} from "react";

import { useNavigate } from "react-router-dom";

import {
    getStations,
    searchTrains
} from "../api/trainApi";

const RECENT_SEARCHES_KEY =
    "railway_recent_searches";

const MAX_RECENT_SEARCHES = 4;

function Search() {
    const navigate = useNavigate();

    const [stations, setStations] =
        useState([]);

    const [form, setForm] = useState({
        source: "",
        destination: "",
        date: ""
    });

    const [recentSearches, setRecentSearches] =
        useState([]);

    const [loadingStations, setLoadingStations] =
        useState(true);

    const [searching, setSearching] =
        useState(false);

    const [error, setError] =
        useState("");

    const today = new Date();

    const minDate = [
        today.getFullYear(),
        String(
            today.getMonth() + 1
        ).padStart(2, "0"),
        String(
            today.getDate()
        ).padStart(2, "0")
    ].join("-");

    useEffect(() => {
        try {
            const saved =
                JSON.parse(
                    localStorage.getItem(
                        RECENT_SEARCHES_KEY
                    ) || "[]"
                );

            if (Array.isArray(saved)) {
                const valid =
                    saved.filter(
                        item =>
                            item?.source &&
                            item?.destination &&
                            item?.date &&
                            item.date >= minDate
                    );

                setRecentSearches(valid);

                if (valid.length > 0) {
                    setForm({
                        source:
                            valid[0].source,
                        destination:
                            valid[0]
                                .destination,
                        date:
                            valid[0].date
                    });
                }
            }
        } catch {
            localStorage.removeItem(
                RECENT_SEARCHES_KEY
            );
        }
    }, []);

    useEffect(() => {
        const loadStations = async () => {
            try {
                const response =
                    await getStations();

                setStations(
                    Array.isArray(
                        response.data
                    )
                        ? response.data
                        : []
                );
            } catch (error) {
                setError(
                    error.response?.data
                        ?.message ||
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
                result[
                    station.station_code
                ] = station;

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
        const {
            name,
            value
        } = event.target;

        setForm(previous => ({
            ...previous,
            [name]: value
        }));

        setError("");
    };

    const handleSwap = () => {
        setForm(previous => ({
            ...previous,
            source:
                previous.destination,
            destination:
                previous.source
        }));

        setError("");
    };

    const saveRecentSearch = search => {
        const next = [
            search,
            ...recentSearches.filter(
                item =>
                    !(
                        item.source ===
                            search.source &&
                        item.destination ===
                            search.destination &&
                        item.date ===
                            search.date
                    )
            )
        ].slice(
            0,
            MAX_RECENT_SEARCHES
        );

        setRecentSearches(next);

        localStorage.setItem(
            RECENT_SEARCHES_KEY,
            JSON.stringify(next)
        );
    };

    const applyRecentSearch = search => {
        setForm({
            source: search.source,
            destination:
                search.destination,
            date: search.date
        });

        setError("");
    };

    const removeRecentSearch = index => {
        const next =
            recentSearches.filter(
                (_, itemIndex) =>
                    itemIndex !== index
            );

        setRecentSearches(next);

        localStorage.setItem(
            RECENT_SEARCHES_KEY,
            JSON.stringify(next)
        );
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

        const search = {
            source: form.source,
            destination:
                form.destination,
            date: form.date
        };

        setSearching(true);

        try {
            const response =
                await searchTrains(
                    search
                );

            saveRecentSearch(search);

            navigate(
                "/search-results",
                {
                    state: {
                        search,
                        trains:
                            Array.isArray(
                                response.data
                            )
                                ? response.data
                                : []
                    }
                }
            );
        } catch (error) {
            setError(
                error.response?.data
                    ?.message ||
                "Unable to search trains."
            );
        } finally {
            setSearching(false);
        }
    };

    const formatRecentDate = date => {
        if (!date) {
            return "";
        }

        const [
            year,
            month,
            day
        ] = date.split("-");

        return new Intl.DateTimeFormat(
            "en-IN",
            {
                day: "numeric",
                month: "short"
            }
        ).format(
            new Date(
                Number(year),
                Number(month) - 1,
                Number(day)
            )
        );
    };

    return (
        <main className="page-container search-page">
            <section className="hero-section search-hero">
                <p className="eyebrow">
                    RAILWAY RESERVATION
                </p>

                <h1>
                    Where would you like
                    to go?
                </h1>

                <p>
                    Search scheduled trains,
                    compare availability and
                    reserve your journey.
                </p>
            </section>

            <section className="content-card search-card">
                <header className="search-card-heading">
                    <div>
                        <h2>
                            Search trains
                        </h2>

                        <p className="muted">
                            Choose your
                            departure,
                            destination and
                            journey date.
                        </p>
                    </div>

                    {!loadingStations && (
                        <span className="search-station-count">
                            {stations.length}{" "}
                            {stations.length ===
                            1
                                ? "station"
                                : "stations"}
                        </span>
                    )}
                </header>

                <form
                    className="search-form"
                    onSubmit={
                        handleSubmit
                    }
                >
                    <div className="form-group station-field">
                        <label htmlFor="source">
                            From
                        </label>

                        <select
                            id="source"
                            name="source"
                            value={
                                form.source
                            }
                            onChange={
                                handleChange
                            }
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
                                {
                                    sourceStation.station_name
                                }

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
                            onClick={
                                handleSwap
                            }
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
                            onChange={
                                handleChange
                            }
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
                            value={
                                form.date
                            }
                            onChange={
                                handleChange
                            }
                            disabled={
                                searching
                            }
                            required
                        />

                        <span className="search-field-detail">
                            Select your
                            travel date
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

            {recentSearches.length >
                0 && (
                <section className="recent-searches-section">
                    <div className="recent-searches-heading">
                        <div>
                            <p className="eyebrow">
                                RECENT
                            </p>

                            <h2>
                                Recent searches
                            </h2>
                        </div>

                        <button
                            type="button"
                            className="recent-clear-button"
                            onClick={() => {
                                setRecentSearches(
                                    []
                                );

                                localStorage.removeItem(
                                    RECENT_SEARCHES_KEY
                                );
                            }}
                        >
                            Clear all
                        </button>
                    </div>

                    <div className="recent-search-grid">
                        {recentSearches.map(
                            (
                                item,
                                index
                            ) => (
                                <article
                                    className="recent-search-card"
                                    key={`${item.source}-${item.destination}-${item.date}`}
                                >
                                    <button
                                        type="button"
                                        className="recent-search-main"
                                        onClick={() =>
                                            applyRecentSearch(
                                                item
                                            )
                                        }
                                    >
                                        <strong>
                                            {
                                                item.source
                                            }
                                            <span>
                                                →
                                            </span>
                                            {
                                                item.destination
                                            }
                                        </strong>

                                        <small>
                                            {formatRecentDate(
                                                item.date
                                            )}
                                        </small>
                                    </button>

                                    <button
                                        type="button"
                                        className="recent-search-remove"
                                        aria-label={`Remove ${item.source} to ${item.destination} search`}
                                        onClick={() =>
                                            removeRecentSearch(
                                                index
                                            )
                                        }
                                    >
                                        ×
                                    </button>
                                </article>
                            )
                        )}
                    </div>
                </section>
            )}

            <section className="search-benefits">
                <article>
                    <span>01</span>

                    <div>
                        <strong>
                            Find your journey
                        </strong>

                        <p>
                            Search available
                            scheduled services by
                            route and date.
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
                            Review class
                            availability and
                            select available
                            seats.
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
                            Access your PNR,
                            ticket and reservation
                            details anytime.
                        </p>
                    </div>
                </article>
            </section>
        </main>
    );
}

export default Search;