import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getDashboard } from "../api/adminApi";

function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const response =
                    await getDashboard();

                setData(response.data);
            } catch (error) {
                setError(
                    error.response?.data?.message ||
                    "Unable to load dashboard"
                );
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    if (loading) {
        return (
            <main className="route-loading">
                <div
                    className="loading-spinner"
                    aria-hidden="true"
                />

                <p>Loading dashboard...</p>
            </main>
        );
    }

    const totalBookings =
        Number(data?.bookings || 0);

    const confirmedBookings =
        Number(data?.confirmedBookings || 0);

    const confirmationRate =
        totalBookings > 0
            ? Math.round(
                  (confirmedBookings /
                      totalBookings) *
                      100
              )
            : 0;

    return (
        <main className="page-container admin-dashboard-page">
            <section className="hero-section admin-dashboard-hero">
                <p className="eyebrow">
                    ADMINISTRATION
                </p>

                <div className="admin-dashboard-title">
                    <div>
                        <h1>Dashboard</h1>

                        <p>
                            Overview of railway operations,
                            reservations and system activity.
                        </p>
                    </div>

                    <span className="admin-system-status">
                        <i aria-hidden="true" />
                        System operational
                    </span>
                </div>
            </section>

            {error ? (
                <div
                    className="form-error"
                    role="alert"
                >
                    {error}
                </div>
            ) : (
                <>
                    <section
                        className="admin-stats-grid"
                        aria-label="System statistics"
                    >
                        <Stat
                            label="Users"
                            value={data?.users}
                            description="Registered accounts"
                        />

                        <Stat
                            label="Trains"
                            value={data?.trains}
                            description="Railway services"
                        />

                        <Stat
                            label="Journeys"
                            value={data?.journeys}
                            description="Scheduled journeys"
                        />

                        <Stat
                            label="Bookings"
                            value={data?.bookings}
                            description="Total reservations"
                        />

                        <Stat
                            label="Confirmed"
                            value={
                                data?.confirmedBookings
                            }
                            description={`${confirmationRate}% confirmation rate`}
                        />

                        <Stat
                            label="Revenue"
                            value={`₹${Number(
                                data?.revenue || 0
                            ).toLocaleString(
                                "en-IN",
                                {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }
                            )}`}
                            description="Confirmed booking revenue"
                            wide
                        />
                    </section>

                    <section className="admin-management-section">
                        <div className="admin-section-heading">
                            <div>
                                <p className="eyebrow">
                                    MANAGEMENT
                                </p>

                                <h2>
                                    Administration
                                </h2>
                            </div>

                            <span>
                                Manage railway system data
                            </span>
                        </div>

                        <div className="admin-management-grid">
                            <AdminLink
                                to="/admin/users"
                                title="Users"
                                description="View registered passengers and account information."
                                action="Manage users"
                            />

                            <AdminLink
                                to="/admin/trains"
                                title="Trains"
                                description="Review train services and railway information."
                                action="Manage trains"
                            />

                            <AdminLink
                                to="/admin/journeys"
                                title="Journeys"
                                description="Review scheduled journeys, seat inventory and operational status."
                                action="Manage journeys"
                            />

                            <AdminLink
                                to="/admin/bookings"
                                title="Bookings"
                                description="View reservations, status and booking activity."
                                action="Manage bookings"
                            />
                        </div>
                    </section>
                </>
            )}
        </main>
    );
}

function Stat({
    label,
    value,
    description,
    wide = false
}) {
    return (
        <article
            className={`admin-stat-card ${
                wide
                    ? "admin-stat-card-wide"
                    : ""
            }`}
        >
            <span className="admin-stat-label">
                {label}
            </span>

            <strong className="admin-stat-value">
                {value ?? 0}
            </strong>

            <span className="admin-stat-description">
                {description}
            </span>
        </article>
    );
}

function AdminLink({
    to,
    title,
    description,
    action
}) {
    return (
        <Link
            to={to}
            className="admin-management-card"
        >
            <div>
                <h3>{title}</h3>
                <p>{description}</p>
            </div>

            <span>
                {action}
                {" →"}
            </span>
        </Link>
    );
}

export default Dashboard;