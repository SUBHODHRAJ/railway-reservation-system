import {
    Navigate,
    useLocation,
    useNavigate
} from "react-router-dom";

function SearchResults() {
    const location = useLocation();
    const navigate = useNavigate();

    const search = location.state?.search;
    const trains = location.state?.trains;

    if (!search || !trains) {
        return <Navigate to="/search" replace />;
    }

    const formatDate = date => {
        if (!date) {
            return "";
        }

        const [year, month, day] = date.split("-");

        return new Intl.DateTimeFormat("en-IN", {
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

    return (
        <main className="page-container results-page">
            <section className="hero-section results-hero">
                <div className="results-hero-content">
                    <div>
                        <p className="eyebrow">
                            AVAILABLE TRAINS
                        </p>

                        <h1 className="results-route-title">
                            <span>{search.source}</span>

                            <span
                                className="route-arrow"
                                aria-hidden="true"
                            >
                                →
                            </span>

                            <span>{search.destination}</span>
                        </h1>

                        <p>
                            {formatDate(search.date)}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="secondary-button modify-search-button"
                        onClick={() =>
                            navigate("/search")
                        }
                    >
                        Modify search
                    </button>
                </div>
            </section>

            <section className="results-summary">
                <p>
                    <strong>{trains.length}</strong>
                    {" "}
                    {trains.length === 1
                        ? "train"
                        : "trains"}{" "}
                    found
                </p>

                <span>
                    {search.source}
                    {" → "}
                    {search.destination}
                    {" • "}
                    {formatDate(search.date)}
                </span>
            </section>

            {trains.length === 0 ? (
                <section className="content-card empty-state">
                    <div
                        className="empty-state-symbol"
                        aria-hidden="true"
                    >
                        —
                    </div>

                    <h2>No trains found</h2>

                    <p className="muted">
                        No scheduled journeys are available
                        for this route and date. Try another
                        date or modify your route.
                    </p>

                    <button
                        className="primary-button"
                        type="button"
                        onClick={() =>
                            navigate("/search")
                        }
                    >
                        Modify search
                    </button>
                </section>
            ) : (
                <section
                    className="train-list"
                    aria-label="Available trains"
                >
                    {trains.map(train => (
                        <article
                            className="train-card"
                            key={train.journey_id}
                        >
                            <div className="train-heading">
                                <div className="train-identity">
                                    <span className="train-number">
                                        {train.train_number}
                                    </span>

                                    <h2>
                                        {train.train_name}
                                    </h2>
                                </div>

                                <span className="status-badge">
                                    {train.status}
                                </span>
                            </div>

                            <div className="route-summary">
                                <div className="route-station route-origin">
                                    <strong>
                                        {train.departure_time ||
                                            "—"}
                                    </strong>

                                    <span>
                                        {train.source_code}
                                    </span>

                                    <small>
                                        {train.source_name}
                                    </small>
                                </div>

                                <div
                                    className="route-line"
                                    aria-hidden="true"
                                >
                                    <span className="route-dot" />

                                    <div className="route-track">
                                        <span>→</span>
                                    </div>

                                    <span className="route-dot" />
                                </div>

                                <div className="route-station route-destination">
                                    <strong>
                                        {train.arrival_time ||
                                            "—"}
                                    </strong>

                                    <span>
                                        {train.destination_code}
                                    </span>

                                    <small>
                                        {train.destination_name}
                                    </small>
                                </div>
                            </div>

                            <div className="train-card-footer">
                                <div className="journey-meta">
                                    <span>
                                        Journey #{train.journey_id}
                                    </span>
                                </div>

                                <button
                                    className="primary-button"
                                    type="button"
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
                                    View availability
                                </button>
                            </div>
                        </article>
                    ))}
                </section>
            )}
        </main>
    );
}

export default SearchResults;
