import {
    useMemo,
    useState
} from "react";

import {
    Navigate,
    useLocation,
    useNavigate
} from "react-router-dom";

function SearchResults() {
    const location = useLocation();
    const navigate = useNavigate();

    const search =
        location.state?.search;

    const trains =
        location.state?.trains;

    const [sortBy, setSortBy] =
        useState("DEFAULT");

    const [showBookableOnly, setShowBookableOnly] =
        useState(false);

    if (
        !search ||
        !Array.isArray(trains)
    ) {
        return (
            <Navigate
                to="/search"
                replace
            />
        );
    }

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

    const normaliseStatus = status => {
        return String(
            status || "SCHEDULED"
        )
            .replaceAll("_", " ")
            .toUpperCase();
    };

    const canBook = train => {
        const status =
            normaliseStatus(
                train.status
            );

        return ![
            "CANCELLED",
            "INACTIVE"
        ].includes(status);
    };

    const timeToMinutes = value => {
        if (!value) {
            return Number.MAX_SAFE_INTEGER;
        }

        const match =
            String(value).match(
                /(\d{1,2}):(\d{2})/
            );

        if (!match) {
            return Number.MAX_SAFE_INTEGER;
        }

        return (
            Number(match[1]) *
                60 +
            Number(match[2])
        );
    };

    const visibleTrains =
        useMemo(() => {
            let result = [
                ...trains
            ];

            if (showBookableOnly) {
                result =
                    result.filter(
                        canBook
                    );
            }

            if (
                sortBy ===
                "DEPARTURE"
            ) {
                result.sort(
                    (a, b) =>
                        timeToMinutes(
                            a.departure_time
                        ) -
                        timeToMinutes(
                            b.departure_time
                        )
                );
            }

            if (
                sortBy ===
                "ARRIVAL"
            ) {
                result.sort(
                    (a, b) =>
                        timeToMinutes(
                            a.arrival_time
                        ) -
                        timeToMinutes(
                            b.arrival_time
                        )
                );
            }

            if (
                sortBy ===
                "TRAIN_NUMBER"
            ) {
                result.sort(
                    (a, b) =>
                        String(
                            a.train_number
                        ).localeCompare(
                            String(
                                b.train_number
                            ),
                            undefined,
                            {
                                numeric: true
                            }
                        )
                );
            }

            return result;
        }, [
            trains,
            sortBy,
            showBookableOnly
        ]);

    const bookableCount =
        useMemo(
            () =>
                trains.filter(
                    canBook
                ).length,
            [trains]
        );

    return (
        <main className="page-container results-page">
            <section className="hero-section results-hero">
                <div className="results-hero-content">
                    <div>
                        <p className="eyebrow">
                            AVAILABLE TRAINS
                        </p>

                        <h1 className="results-route-title">
                            <span>
                                {
                                    search.source
                                }
                            </span>

                            <span
                                className="route-arrow"
                                aria-hidden="true"
                            >
                                →
                            </span>

                            <span>
                                {
                                    search.destination
                                }
                            </span>
                        </h1>

                        <p>
                            {formatDate(
                                search.date
                            )}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="secondary-button modify-search-button"
                        onClick={() =>
                            navigate(
                                "/search"
                            )
                        }
                    >
                        Modify search
                    </button>
                </div>
            </section>

            <section className="results-summary">
                <div>
                    <strong>
                        {trains.length}
                    </strong>

                    <span>
                        {trains.length ===
                        1
                            ? " train found"
                            : " trains found"}
                    </span>
                </div>

                <p>
                    {search.source}
                    {" → "}
                    {
                        search.destination
                    }
                    {" • "}
                    {formatDate(
                        search.date
                    )}
                </p>
            </section>

            {trains.length === 0 ? (
                <section className="content-card empty-state results-empty-state">
                    <div
                        className="empty-state-symbol"
                        aria-hidden="true"
                    >
                        —
                    </div>

                    <p className="eyebrow">
                        NO SERVICES
                    </p>

                    <h2>
                        No trains found
                    </h2>

                    <p className="muted">
                        There are no
                        scheduled journeys
                        available for this
                        route and date. Try
                        another date or
                        change your stations.
                    </p>

                    <button
                        className="primary-button"
                        type="button"
                        onClick={() =>
                            navigate(
                                "/search"
                            )
                        }
                    >
                        Modify search
                    </button>
                </section>
            ) : (
                <>
                    <section className="results-controls">
                        <div className="results-filter-summary">
                            <strong>
                                {
                                    bookableCount
                                }
                            </strong>

                            <span>
                                {bookableCount ===
                                1
                                    ? " bookable service"
                                    : " bookable services"}
                            </span>
                        </div>

                        <div className="results-control-actions">
                            <label className="bookable-toggle">
                                <input
                                    type="checkbox"
                                    checked={
                                        showBookableOnly
                                    }
                                    onChange={
                                        event =>
                                            setShowBookableOnly(
                                                event
                                                    .target
                                                    .checked
                                            )
                                    }
                                />

                                <span>
                                    Bookable only
                                </span>
                            </label>

                            <div className="results-sort-control">
                                <label htmlFor="train-sort">
                                    Sort by
                                </label>

                                <select
                                    id="train-sort"
                                    value={
                                        sortBy
                                    }
                                    onChange={
                                        event =>
                                            setSortBy(
                                                event
                                                    .target
                                                    .value
                                            )
                                    }
                                >
                                    <option value="DEFAULT">
                                        Recommended
                                    </option>

                                    <option value="DEPARTURE">
                                        Departure time
                                    </option>

                                    <option value="ARRIVAL">
                                        Arrival time
                                    </option>

                                    <option value="TRAIN_NUMBER">
                                        Train number
                                    </option>
                                </select>
                            </div>
                        </div>
                    </section>

                    {visibleTrains.length ===
                    0 ? (
                        <section className="content-card results-filter-empty">
                            <strong>
                                No bookable
                                services
                            </strong>

                            <p>
                                Services were
                                found, but none
                                match the current
                                filter.
                            </p>

                            <button
                                type="button"
                                className="secondary-action-button"
                                onClick={() =>
                                    setShowBookableOnly(
                                        false
                                    )
                                }
                            >
                                Show all trains
                            </button>
                        </section>
                    ) : (
                        <section
                            className="train-list"
                            aria-label={`${visibleTrains.length} ${
                                visibleTrains.length ===
                                1
                                    ? "train"
                                    : "trains"
                            }`}
                        >
                            {visibleTrains.map(
                                train => {
                                    const bookable =
                                        canBook(
                                            train
                                        );

                                    return (
                                        <article
                                            className={`train-card ${
                                                !bookable
                                                    ? "train-card-disabled"
                                                    : ""
                                            }`}
                                            key={
                                                train.journey_id
                                            }
                                        >
                                            <header className="train-heading">
                                                <div className="train-identity">
                                                    <span className="train-number">
                                                        {
                                                            train.train_number
                                                        }
                                                    </span>

                                                    <div>
                                                        <h2>
                                                            {
                                                                train.train_name
                                                            }
                                                        </h2>

                                                        <p>
                                                            Journey #
                                                            {
                                                                train.journey_id
                                                            }
                                                        </p>
                                                    </div>
                                                </div>

                                                <span
                                                    className={`status-badge ${
                                                        !bookable
                                                            ? "status-badge-muted"
                                                            : ""
                                                    }`}
                                                >
                                                    {normaliseStatus(
                                                        train.status
                                                    )}
                                                </span>
                                            </header>

                                            <div className="route-summary">
                                                <div className="route-station route-origin">
                                                    <span className="route-caption">
                                                        DEPARTURE
                                                    </span>

                                                    <strong>
                                                        {train.departure_time ||
                                                            "—"}
                                                    </strong>

                                                    <span>
                                                        {
                                                            train.source_code
                                                        }
                                                    </span>

                                                    <small>
                                                        {
                                                            train.source_name
                                                        }
                                                    </small>
                                                </div>

                                                <div className="route-line">
                                                    <span
                                                        className="route-dot"
                                                        aria-hidden="true"
                                                    />

                                                    <div className="route-track">
                                                        <span
                                                            aria-hidden="true"
                                                        >
                                                            →
                                                        </span>
                                                    </div>

                                                    <span
                                                        className="route-dot"
                                                        aria-hidden="true"
                                                    />
                                                </div>

                                                <div className="route-station route-destination">
                                                    <span className="route-caption">
                                                        ARRIVAL
                                                    </span>

                                                    <strong>
                                                        {train.arrival_time ||
                                                            "—"}
                                                    </strong>

                                                    <span>
                                                        {
                                                            train.destination_code
                                                        }
                                                    </span>

                                                    <small>
                                                        {
                                                            train.destination_name
                                                        }
                                                    </small>
                                                </div>
                                            </div>

                                            <footer className="train-card-footer">
                                                <div className="journey-meta">
                                                    <span>
                                                        {
                                                            search.source
                                                        }
                                                        {" → "}
                                                        {
                                                            search.destination
                                                        }
                                                    </span>

                                                    <small>
                                                        {formatDate(
                                                            search.date
                                                        )}
                                                    </small>
                                                </div>

                                                <button
                                                    className="primary-button"
                                                    type="button"
                                                    disabled={
                                                        !bookable
                                                    }
                                                    onClick={() =>
                                                        navigate(
                                                            `/journey/${train.journey_id}`,
                                                            {
                                                                state: {
                                                                    search,
                                                                    train
                                                                }
                                                            }
                                                        )
                                                    }
                                                >
                                                    {bookable
                                                        ? "View availability"
                                                        : "Unavailable"}
                                                </button>
                                            </footer>
                                        </article>
                                    );
                                }
                            )}
                        </section>
                    )}
                </>
            )}
        </main>
    );
}

export default SearchResults;