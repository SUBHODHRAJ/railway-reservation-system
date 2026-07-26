import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getDashboard } from "../api/adminApi";

function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] =
        useState(true);
    const [error, setError] =
        useState("");

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
                <div className="loading-spinner"></div>
                <p>Loading dashboard...</p>
            </main>
        );
    }

    return (
        <main className="page-container">
            <section className="hero-section">
                <p className="eyebrow">
                    ADMINISTRATION
                </p>

                <h1>Dashboard</h1>

                <p>
                    Railway Reservation System overview.
                </p>
            </section>

            {error ? (
                <div className="form-error">
                    {error}
                </div>
            ) : (
                <div className="stats-grid">
                    <Stat
                        label="Users"
                        value={data.users}
                    />

                    <Stat
                        label="Trains"
                        value={data.trains}
                    />

                    <Stat
                        label="Journeys"
                        value={data.journeys}
                    />

                    <Stat
                        label="Bookings"
                        value={data.bookings}
                    />

                    <Stat
                        label="Confirmed"
                        value={
                            data.confirmedBookings
                        }
                    />
                    <Stat
                        label="Revenue"
                        value={`₹${Number(
                            data.revenue
                        ).toFixed(2)}`}
                    />
                </div>
            )}

            <div className="admin-navigation">
                <Link to="/admin/users">
                    Users
                </Link>

                <Link to="/admin/trains">
                    Trains
                </Link>

                <Link to="/admin/bookings">
                    Bookings
                </Link>
            </div>
        </main>
    );
}

function Stat({ label, value }) {
    return (
        <article className="stat-card">
            <span>{label}</span>
            <strong>{value}</strong>
        </article>
    );
}

export default Dashboard;