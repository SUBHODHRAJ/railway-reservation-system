import {
    useEffect,
    useMemo,
    useState
} from "react";

import { useNavigate } from "react-router-dom";

import {
    getMyBookings
} from "../api/bookingApi";

const FILTERS = [
    {
        key: "ALL",
        label: "All"
    },
    {
        key: "ACTIVE",
        label: "Active"
    },
    {
        key: "CANCELLED",
        label: "Cancelled"
    }
];

function MyBookings() {
    const navigate = useNavigate();

    const [bookings, setBookings] =
        useState([]);

    const [filter, setFilter] =
        useState("ALL");

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        const loadBookings = async () => {
            try {
                const response =
                    await getMyBookings();

                setBookings(
                    Array.isArray(response.data)
                        ? response.data
                        : []
                );
            } catch (error) {
                setError(
                    error.response?.data?.message ||
                    "Unable to load bookings"
                );
            } finally {
                setLoading(false);
            }
        };

        loadBookings();
    }, []);

    const formatDate = date => {
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
    };

    const counts = useMemo(() => {
        return bookings.reduce(
            (result, booking) => {
                result.all += 1;

                if (
                    booking.status ===
                    "CANCELLED"
                ) {
                    result.cancelled += 1;
                } else {
                    result.active += 1;
                }

                return result;
            },
            {
                all: 0,
                active: 0,
                cancelled: 0
            }
        );
    }, [bookings]);

    const visibleBookings =
        useMemo(() => {
            if (filter === "ACTIVE") {
                return bookings.filter(
                    booking =>
                        booking.status !==
                        "CANCELLED"
                );
            }

            if (filter === "CANCELLED") {
                return bookings.filter(
                    booking =>
                        booking.status ===
                        "CANCELLED"
                );
            }

            return bookings;
        }, [bookings, filter]);

    const getFilterCount = key => {
        if (key === "ACTIVE") {
            return counts.active;
        }

        if (key === "CANCELLED") {
            return counts.cancelled;
        }

        return counts.all;
    };

    const formatStatus = status => {
        if (!status) {
            return "—";
        }

        return String(status)
            .replaceAll("_", " ");
    };

    if (loading) {
        return (
            <main className="route-loading">
                <div
                    className="loading-spinner"
                    aria-hidden="true"
                />

                <p>Loading bookings...</p>
            </main>
        );
    }

    return (
        <main className="page-container bookings-page">
            <section className="hero-section bookings-hero">
                <p className="eyebrow">
                    YOUR JOURNEYS
                </p>

                <h1>My Bookings</h1>

                <p>
                    View reservations, payment
                    information and current booking
                    status.
                </p>
            </section>

            {error && (
                <div
                    className="form-error bookings-error"
                    role="alert"
                >
                    {error}
                </div>
            )}

            {!error &&
                bookings.length === 0 && (
                    <section className="content-card empty-state bookings-empty">
                        <div
                            className="empty-state-symbol"
                            aria-hidden="true"
                        >
                            —
                        </div>

                        <h2>
                            No bookings yet
                        </h2>

                        <p className="muted">
                            Your railway reservations
                            will appear here after you
                            complete a booking.
                        </p>

                        <button
                            type="button"
                            className="primary-button"
                            onClick={() =>
                                navigate(
                                    "/search"
                                )
                            }
                        >
                            Search trains
                        </button>
                    </section>
                )}

            {!error &&
                bookings.length > 0 && (
                    <>
                        <section className="booking-overview">
                            <article>
                                <span>
                                    Total bookings
                                </span>

                                <strong>
                                    {counts.all}
                                </strong>
                            </article>

                            <article>
                                <span>
                                    Active
                                </span>

                                <strong>
                                    {counts.active}
                                </strong>
                            </article>

                            <article>
                                <span>
                                    Cancelled
                                </span>

                                <strong>
                                    {counts.cancelled}
                                </strong>
                            </article>
                        </section>

                        <section className="bookings-toolbar">
                            <div
                                className="booking-filters"
                                aria-label="Filter bookings"
                            >
                                {FILTERS.map(
                                    item => (
                                        <button
                                            type="button"
                                            key={
                                                item.key
                                            }
                                            className={`booking-filter ${
                                                filter ===
                                                item.key
                                                    ? "booking-filter-active"
                                                    : ""
                                            }`}
                                            aria-pressed={
                                                filter ===
                                                item.key
                                            }
                                            onClick={() =>
                                                setFilter(
                                                    item.key
                                                )
                                            }
                                        >
                                            {
                                                item.label
                                            }

                                            <span>
                                                {getFilterCount(
                                                    item.key
                                                )}
                                            </span>
                                        </button>
                                    )
                                )}
                            </div>

                            <span className="bookings-result-count">
                                {
                                    visibleBookings.length
                                }{" "}
                                {visibleBookings.length ===
                                1
                                    ? "reservation"
                                    : "reservations"}
                            </span>
                        </section>

                        {visibleBookings.length ===
                        0 ? (
                            <section className="content-card booking-filter-empty">
                                <strong>
                                    No bookings in this
                                    category
                                </strong>

                                <p>
                                    Choose another filter
                                    to view your
                                    reservations.
                                </p>
                            </section>
                        ) : (
                            <section
                                className="booking-list"
                                aria-label="Your bookings"
                            >
                                {visibleBookings.map(
                                    booking => (
                                        <article
                                            className="booking-card"
                                            key={
                                                booking.booking_id
                                            }
                                        >
                                            <div className="booking-card-top">
                                                <div className="booking-train">
                                                    <span className="train-number">
                                                        {
                                                            booking.train_number
                                                        }
                                                    </span>

                                                    <div>
                                                        <h2>
                                                            {
                                                                booking.train_name
                                                            }
                                                        </h2>

                                                        <small>
                                                            {
                                                                booking.passenger_count
                                                            }{" "}
                                                            {Number(
                                                                booking.passenger_count
                                                            ) ===
                                                            1
                                                                ? "passenger"
                                                                : "passengers"}
                                                        </small>
                                                    </div>
                                                </div>

                                                <span
                                                    className={`booking-status status-${booking.status?.toLowerCase()}`}
                                                >
                                                    {formatStatus(
                                                        booking.status
                                                    )}
                                                </span>
                                            </div>

                                            <div className="booking-route">
                                                <div>
                                                    <strong>
                                                        {
                                                            booking.source_code
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            booking.source_name
                                                        }
                                                    </span>
                                                </div>

                                                <div
                                                    className="booking-route-line"
                                                    aria-hidden="true"
                                                >
                                                    <span />

                                                    <strong>
                                                        →
                                                    </strong>

                                                    <span />
                                                </div>

                                                <div className="booking-route-destination">
                                                    <strong>
                                                        {
                                                            booking.destination_code
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            booking.destination_name
                                                        }
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="booking-meta booking-meta-expanded">
                                                <div>
                                                    <span>
                                                        PNR
                                                    </span>

                                                    <strong className="booking-pnr">
                                                        {
                                                            booking.pnr
                                                        }
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        Journey
                                                        date
                                                    </span>

                                                    <strong>
                                                        {formatDate(
                                                            booking.journey_date
                                                        )}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        Payment
                                                    </span>

                                                    <strong
                                                        className={`booking-payment-status payment-${booking.payment_status?.toLowerCase()}`}
                                                    >
                                                        {formatStatus(
                                                            booking.payment_status ||
                                                                "NOT AVAILABLE"
                                                        )}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        Total fare
                                                    </span>

                                                    <strong>
                                                        ₹
                                                        {Number(
                                                            booking.total_fare
                                                        ).toFixed(
                                                            2
                                                        )}
                                                    </strong>
                                                </div>
                                            </div>

                                            <div className="booking-card-actions">
                                                <button
                                                    type="button"
                                                    className="secondary-action-button"
                                                    onClick={() =>
                                                        navigate(
                                                            `/booking/${booking.pnr}`
                                                        )
                                                    }
                                                >
                                                    View ticket
                                                </button>
                                            </div>
                                        </article>
                                    )
                                )}
                            </section>
                        )}
                    </>
                )}
        </main>
    );
}

export default MyBookings;
