import {
    useMemo,
    useState
} from "react";

import {
    Navigate,
    useLocation,
    useNavigate
} from "react-router-dom";
import {
    provisionJourney
} from "../api/trainApi";
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
    const [provisioningTrain, setProvisioningTrain] =
        useState(null);
    const [provisionError, setProvisionError] =
        useState("");
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
            return "Ã¢â‚¬â€";
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
    return Boolean(
        train?.trainNumber
    );
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
                            a.source?.departure
                        ) -
                        timeToMinutes(
                            b.source?.departure
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
                            a.destination?.arrival
                        ) -
                        timeToMinutes(
                            b.destination?.arrival
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
                            a.trainNumber
                        ).localeCompare(
                            String(
                                b.trainNumber
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
const handleViewAvailability = async train => {
    if (
        !train?.trainNumber ||
        provisioningTrain
    ) {
        return;
    }

    setProvisionError("");
    setProvisioningTrain(
        train.trainNumber
    );

    try {
        const response =
            await provisionJourney({
                trainNumber:
                    train.trainNumber,
                journeyDate:
                    search.date
            });

        const journeyId =
            response.data?.journeyId;

        if (!journeyId) {
            throw new Error(
                "Journey ID was not returned"
            );
        }

        navigate(
            `/journey/${journeyId}`,
            {
                state: {
                    search,
                    train: {
                        ...train,
                        journey_id:
                            journeyId,
                        train_id:
                            response.data
                                ?.trainId
                    }
                }
            }
        );
    } catch (error) {
        setProvisionError(
            error.response?.data
                ?.message ||
            error.message ||
            "Unable to prepare this journey."
        );
    } finally {
        setProvisioningTrain(null);
    }
};
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
                                Ã¢â€ â€™
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
                    {" Ã¢â€ â€™ "}
                    {
                        search.destination
                    }
                    {" Ã¢â‚¬Â¢ "}
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
                        Ã¢â‚¬â€
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
{provisionError && (
    <div
        className="form-error"
        role="alert"
    >
        {provisionError}
    </div>
)}
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
                                                train.trainNumber
                                            }
                                        >
                                            <header className="train-heading">
                                                <div className="train-identity">
                                                    <span className="train-number">
                                                        {
                                                            train.trainNumber
                                                        }
                                                    </span>

                                                    <div>
                                                        <h2>
                                                            {
                                                                train.trainName
                                                            }
                                                        </h2>

<p>
    {train.type ||
        "Train service"}
</p>                                                    </div>
                                                </div>

                                                <span
                                                    className={`status-badge ${
                                                        !bookable
                                                            ? "status-badge-muted"
                                                            : ""
                                                    }`}
                                                >
AVAILABLE
                                                </span>
                                            </header>

                                            <div className="route-summary">
                                                <div className="route-station route-origin">
                                                    <span className="route-caption">
                                                        DEPARTURE
                                                    </span>

                                                    <strong>
    {train.source?.departure ||
        "Ã¢â‚¬â€"}
</strong>

<span>
    {train.source?.code}
</span>

<small>
    {train.source?.name}
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
                                                            Ã¢â€ â€™
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
    {train.destination?.arrival ||
        "Ã¢â‚¬â€"}
</strong>

<span>
    {train.destination?.code}
</span>

<small>
    {train.destination?.name}
</small>
                                                </div>
                                            </div>

                                            <footer className="train-card-footer">
                                                <div className="journey-meta">
                                                    <span>
                                                        {
                                                            search.source
                                                        }
                                                        {" Ã¢â€ â€™ "}
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
        !bookable ||
        Boolean(provisioningTrain)
    }
    onClick={() =>
        handleViewAvailability(
            train
        )
    }
>
    {provisioningTrain ===
    train.trainNumber
        ? "Preparing journey..."
        : bookable
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
