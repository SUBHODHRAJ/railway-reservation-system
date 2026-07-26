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

    return (
        <main className="page-container">
            <section className="hero-section">
                <p className="eyebrow">
                    SEARCH RESULTS
                </p>

                <h1>
                    {search.source}
                    {" → "}
                    {search.destination}
                </h1>

                <p>{search.date}</p>
            </section>

            {trains.length === 0 ? (
                <section className="content-card empty-state">
                    <h2>No trains found</h2>

                    <p className="muted">
                        No scheduled journeys are available
                        for this route and date.
                    </p>

                    <button
                        className="primary-button"
                        onClick={() =>
                            navigate("/search")
                        }
                    >
                        Search again
                    </button>
                </section>
            ) : (
                <div className="train-list">
                    {trains.map(train => (
                        <article
                            className="train-card"
                            key={train.journey_id}
                        >
                            <div className="train-heading">
                                <div>
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
                                <div>
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

                                <div className="route-line">
                                    <span>→</span>
                                </div>

                                <div>
                                    <strong>
                                        {train.arrival_time ||
                                            "—"}
                                    </strong>

                                    <span>
                                        {train.destination_code}
                                    </span>

                                    <small>
                                        {
                                            train.destination_name
                                        }
                                    </small>
                                </div>
                            </div>

                            <button
                                className="primary-button"
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
                        </article>
                    ))}
                </div>
            )}
        </main>
    );
}

export default SearchResults;