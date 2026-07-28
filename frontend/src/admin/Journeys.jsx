import { useEffect, useMemo, useState } from "react";

import {
    getAdminJourneys,
    updateAdminJourneyStatus
} from "../api/adminApi";

const STATUS_OPTIONS = [
    "SCHEDULED",
    "CANCELLED",
    "COMPLETED"
];

function Journeys() {
    const [journeys, setJourneys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] =
        useState("ALL");

    const loadJourneys = async () => {
        try {
            setError("");

            const response =
                await getAdminJourneys();

            setJourneys(response.data);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to load journeys"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadJourneys();
    }, []);

    const filteredJourneys = useMemo(() => {
        const term =
            query.trim().toLowerCase();

        return journeys.filter(journey => {
            const matchesStatus =
                statusFilter === "ALL" ||
                journey.status === statusFilter;

            const matchesQuery =
                !term ||
                String(journey.train_number)
                    .toLowerCase()
                    .includes(term) ||
                String(journey.train_name)
                    .toLowerCase()
                    .includes(term) ||
                String(journey.journey_date)
                    .toLowerCase()
                    .includes(term);

            return matchesStatus && matchesQuery;
        });
    }, [journeys, query, statusFilter]);

    const handleStatusChange = async (
        journey,
        status
    ) => {
        if (
            status === journey.status ||
            updatingId
        ) {
            return;
        }

        setUpdatingId(journey.id);
        setError("");
        setMessage("");

        try {
            await updateAdminJourneyStatus(
                journey.id,
                status
            );

            setJourneys(previous =>
                previous.map(item =>
                    item.id === journey.id
                        ? {
                              ...item,
                              status
                          }
                        : item
                )
            );

            setMessage(
                `Journey #${journey.id} updated to ${status}.`
            );
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to update journey status"
            );
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) {
        return (
            <main className="route-loading">
                <div className="loading-spinner" />
                <p>Loading journeys...</p>
            </main>
        );
    }

    return (
        <main className="page-container admin-page">
            <section className="hero-section admin-page-hero">
                <p className="eyebrow">
                    ADMINISTRATION
                </p>

                <h1>Journeys</h1>

                <p>
                    Review scheduled train journeys,
                    inventory and reservation activity.
                </p>
            </section>

            <section className="admin-toolbar">
                <div className="admin-toolbar-heading">
                    <span>JOURNEY MANAGEMENT</span>

                    <strong>
                        {filteredJourneys.length} of{" "}
                        {journeys.length} journeys
                    </strong>
                </div>

                <div className="admin-toolbar-controls">
                    <input
                        type="search"
                        placeholder="Search train or date"
                        value={query}
                        onChange={event =>
                            setQuery(event.target.value)
                        }
                    />

                    <select
                        value={statusFilter}
                        onChange={event =>
                            setStatusFilter(
                                event.target.value
                            )
                        }
                    >
                        <option value="ALL">
                            All statuses
                        </option>

                        {STATUS_OPTIONS.map(status => (
                            <option
                                value={status}
                                key={status}
                            >
                                {formatStatus(status)}
                            </option>
                        ))}
                    </select>
                </div>
            </section>

            {error && (
                <div
                    className="form-error admin-feedback"
                    role="alert"
                >
                    {error}
                </div>
            )}

            {message && (
                <div className="admin-success admin-feedback">
                    {message}
                </div>
            )}

            <section className="admin-table-card">
                {filteredJourneys.length === 0 ? (
                    <div className="admin-empty-state">
                        <strong>
                            No journeys found
                        </strong>

                        <p>
                            Adjust the search or status
                            filter to view other journeys.
                        </p>
                    </div>
                ) : (
                    <div className="admin-table-scroll">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Journey</th>
                                    <th>Train</th>
                                    <th>Date</th>
                                    <th>Inventory</th>
                                    <th>Bookings</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredJourneys.map(
                                    journey => {
                                        const total =
                                            Number(
                                                journey.total_seats
                                            );

                                        const available =
                                            Number(
                                                journey.available_seats
                                            );

                                        return (
                                            <tr
                                                key={
                                                    journey.id
                                                }
                                            >
                                                <td>
                                                    <strong>
                                                        #
                                                        {
                                                            journey.id
                                                        }
                                                    </strong>
                                                </td>

                                                <td>
                                                    <div className="admin-table-primary">
                                                        <strong>
                                                            {
                                                                journey.train_number
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                journey.train_name
                                                            }
                                                        </span>
                                                    </div>
                                                </td>

                                                <td>
                                                    {formatDate(
                                                        journey.journey_date
                                                    )}
                                                </td>

                                                <td>
                                                    <div className="admin-inventory">
                                                        <strong>
                                                            {
                                                                available
                                                            }
                                                            /
                                                            {
                                                                total
                                                            }
                                                        </strong>

                                                        <span>
                                                            seats available
                                                        </span>
                                                    </div>
                                                </td>

                                                <td>
                                                    {
                                                        journey.bookings
                                                    }
                                                </td>

                                                <td>
                                                    {journey.status ===
                                                    "COMPLETED" ? (
                                                        <span className="admin-status admin-status-completed">
                                                            Completed
                                                        </span>
                                                    ) : (
                                                        <select
                                                            className={`admin-status-select admin-status-${journey.status.toLowerCase()}`}
                                                            value={
                                                                journey.status
                                                            }
                                                            disabled={
                                                                updatingId ===
                                                                journey.id
                                                            }
                                                            onChange={event =>
                                                                handleStatusChange(
                                                                    journey,
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        >
                                                            {STATUS_OPTIONS.map(
                                                                status => (
                                                                    <option
                                                                        value={
                                                                            status
                                                                        }
                                                                        key={
                                                                            status
                                                                        }
                                                                    >
                                                                        {formatStatus(
                                                                            status
                                                                        )}
                                                                    </option>
                                                                )
                                                            )}
                                                        </select>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    }
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}

function formatStatus(status) {
    return (
        status.charAt(0) +
        status.slice(1).toLowerCase()
    );
}

function formatDate(date) {
    if (!date) {
        return "—";
    }

    const value =
        String(date).slice(0, 10);

    const [year, month, day] =
        value.split("-");

    if (!year || !month || !day) {
        return date;
    }

    return new Intl.DateTimeFormat(
        "en-IN",
        {
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
}

export default Journeys;
