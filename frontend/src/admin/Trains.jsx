import { useEffect, useMemo, useState } from "react";

import { getAdminTrains } from "../api/adminApi";

function Trains() {
    const [trains, setTrains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");

    useEffect(() => {
        getAdminTrains()
            .then(response =>
                setTrains(response.data)
            )
            .catch(error =>
                setError(
                    error.response?.data?.message ||
                    "Unable to load trains"
                )
            )
            .finally(() =>
                setLoading(false)
            );
    }, []);

    const filteredTrains = useMemo(() => {
        const value =
            query.trim().toLowerCase();

        if (!value) {
            return trains;
        }

        return trains.filter(train =>
            [
                train.id,
                train.train_number,
                train.train_name
            ].some(item =>
                String(item ?? "")
                    .toLowerCase()
                    .includes(value)
            )
        );
    }, [trains, query]);

    return (
        <main className="page-container admin-list-page">
            <section className="hero-section admin-list-hero">
                <p className="eyebrow">
                    ADMINISTRATION
                </p>

                <div className="admin-list-title">
                    <div>
                        <h1>Trains</h1>

                        <p>
                            View railway services, coach
                            inventory and scheduled journeys.
                        </p>
                    </div>

                    <div className="admin-record-count">
                        <strong>
                            {trains.length}
                        </strong>

                        <span>trains</span>
                    </div>
                </div>
            </section>

            {error ? (
                <div
                    className="form-error"
                    role="alert"
                >
                    {error}
                </div>
            ) : loading ? (
                <div className="admin-list-loading">
                    <div
                        className="loading-spinner"
                        aria-hidden="true"
                    />

                    <span>Loading trains...</span>
                </div>
            ) : (
                <section className="admin-table-card">
                    <div className="admin-table-toolbar">
                        <div>
                            <strong>
                                Railway services
                            </strong>

                            <span>
                                {filteredTrains.length} of{" "}
                                {trains.length} shown
                            </span>
                        </div>

                        <input
                            type="search"
                            className="admin-search-input"
                            placeholder="Search trains..."
                            aria-label="Search trains"
                            value={query}
                            onChange={event =>
                                setQuery(
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <div className="table-wrapper admin-table-wrapper">
                        <table className="data-table admin-data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Train Number</th>
                                    <th>Train Name</th>
                                    <th>Coaches</th>
                                    <th>Journeys</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredTrains.map(
                                    train => (
                                        <tr key={train.id}>
                                            <td className="admin-id-cell">
                                                #{train.id}
                                            </td>

                                            <td>
                                                <strong className="admin-train-number">
                                                    {
                                                        train.train_number
                                                    }
                                                </strong>
                                            </td>

                                            <td>
                                                <strong className="admin-primary-cell">
                                                    {
                                                        train.train_name
                                                    }
                                                </strong>
                                            </td>

                                            <td>
                                                <span className="admin-count-badge">
                                                    {train.coaches ??
                                                        0}
                                                </span>
                                            </td>

                                            <td>
                                                <span className="admin-count-badge">
                                                    {train.journeys ??
                                                        0}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                    {filteredTrains.length === 0 && (
                        <div className="admin-table-empty">
                            <strong>
                                No trains found
                            </strong>

                            <span>
                                No railway services match
                                your search.
                            </span>
                        </div>
                    )}
                </section>
            )}
        </main>
    );
}

export default Trains;