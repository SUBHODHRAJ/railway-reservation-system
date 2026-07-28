import { useEffect, useMemo, useState } from "react";

import { getAdminBookings } from "../api/adminApi";

function Bookings() {
    const [bookings, setBookings] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [query, setQuery] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("ALL");

    useEffect(() => {
        getAdminBookings()
            .then(response =>
                setBookings(response.data)
            )
            .catch(error =>
                setError(
                    error.response?.data?.message ||
                    "Unable to load bookings"
                )
            )
            .finally(() =>
                setLoading(false)
            );
    }, []);

    const filteredBookings = useMemo(() => {
        const value =
            query.trim().toLowerCase();

        return bookings.filter(booking => {
            const matchesStatus =
                statusFilter === "ALL" ||
                booking.status === statusFilter;

            const matchesQuery =
                !value ||
                [
                    booking.pnr,
                    booking.user_name,
                    booking.email,
                    booking.train_number,
                    booking.train_name,
                    booking.source,
                    booking.destination
                ].some(item =>
                    String(item ?? "")
                        .toLowerCase()
                        .includes(value)
                );

            return (
                matchesStatus &&
                matchesQuery
            );
        });
    }, [
        bookings,
        query,
        statusFilter
    ]);

    const statuses = useMemo(
        () =>
            [
                ...new Set(
                    bookings
                        .map(
                            booking =>
                                booking.status
                        )
                        .filter(Boolean)
                )
            ],
        [bookings]
    );

    const formatDate = value => {
        if (!value) {
            return "—";
        }

        const dateValue =
            String(value).slice(0, 10);

        const [year, month, day] =
            dateValue.split("-");

        if (!year || !month || !day) {
            return value;
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
    };

    return (
        <main className="page-container admin-list-page">
            <section className="hero-section admin-list-hero">
                <p className="eyebrow">
                    ADMINISTRATION
                </p>

                <div className="admin-list-title">
                    <div>
                        <h1>Bookings</h1>

                        <p>
                            Review reservations, passengers,
                            journeys, fares and booking status.
                        </p>
                    </div>

                    <div className="admin-record-count">
                        <strong>
                            {bookings.length}
                        </strong>

                        <span>bookings</span>
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

                    <span>
                        Loading bookings...
                    </span>
                </div>
            ) : (
                <section className="admin-table-card">
                    <div className="admin-table-toolbar admin-booking-toolbar">
                        <div>
                            <strong>
                                Reservations
                            </strong>

                            <span>
                                {filteredBookings.length} of{" "}
                                {bookings.length} shown
                            </span>
                        </div>

                        <div className="admin-table-filters">
                            <select
                                aria-label="Filter bookings by status"
                                value={statusFilter}
                                onChange={event =>
                                    setStatusFilter(
                                        event.target
                                            .value
                                    )
                                }
                            >
                                <option value="ALL">
                                    All statuses
                                </option>

                                {statuses.map(
                                    status => (
                                        <option
                                            key={status}
                                            value={status}
                                        >
                                            {status}
                                        </option>
                                    )
                                )}
                            </select>

                            <input
                                type="search"
                                className="admin-search-input"
                                placeholder="Search bookings..."
                                aria-label="Search bookings"
                                value={query}
                                onChange={event =>
                                    setQuery(
                                        event.target
                                            .value
                                    )
                                }
                            />
                        </div>
                    </div>

                    <div className="table-wrapper admin-table-wrapper">
                        <table className="data-table admin-data-table admin-bookings-table">
                            <thead>
                                <tr>
                                    <th>PNR</th>
                                    <th>Passenger</th>
                                    <th>Train</th>
                                    <th>Route</th>
                                    <th>Date</th>
                                    <th>Fare</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredBookings.map(
                                    booking => (
                                        <tr
                                            key={
                                                booking.id ??
                                                booking.pnr
                                            }
                                        >
                                            <td>
                                                <strong className="admin-pnr">
                                                    {
                                                        booking.pnr
                                                    }
                                                </strong>
                                            </td>

                                            <td>
                                                <strong className="admin-primary-cell">
                                                    {
                                                        booking.user_name
                                                    }
                                                </strong>

                                                <span className="admin-secondary-cell">
                                                    {
                                                        booking.email
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <strong className="admin-train-number">
                                                    {
                                                        booking.train_number
                                                    }
                                                </strong>

                                                <span className="admin-secondary-cell">
                                                    {
                                                        booking.train_name
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <div className="admin-route-cell">
                                                    <strong>
                                                        {
                                                            booking.source
                                                        }
                                                    </strong>

                                                    <span>
                                                        →
                                                    </span>

                                                    <strong>
                                                        {
                                                            booking.destination
                                                        }
                                                    </strong>
                                                </div>
                                            </td>

                                            <td>
                                                {formatDate(
                                                    booking.journey_date
                                                )}
                                            </td>

                                            <td>
                                                <strong className="admin-fare-cell">
                                                    ₹
                                                    {Number(
                                                        booking.total_fare
                                                    ).toLocaleString(
                                                        "en-IN",
                                                        {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2
                                                        }
                                                    )}
                                                </strong>
                                            </td>

                                            <td>
                                                <span
                                                    className={`booking-status status-${booking.status?.toLowerCase()}`}
                                                >
                                                    {
                                                        booking.status
                                                    }
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                    {filteredBookings.length === 0 && (
                        <div className="admin-table-empty">
                            <strong>
                                No bookings found
                            </strong>

                            <span>
                                No reservations match the
                                current filters.
                            </span>
                        </div>
                    )}
                </section>
            )}
        </main>
    );
}

export default Bookings;