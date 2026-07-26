import { useEffect, useState } from "react";
import { getAdminBookings } from "../api/adminApi";

function Bookings() {
    const [bookings, setBookings] =
        useState([]);

    const [error, setError] =
        useState("");

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
            );
    }, []);

    return (
        <main className="page-container">
            <section className="hero-section">
                <p className="eyebrow">
                    ADMINISTRATION
                </p>

                <h1>Bookings</h1>
            </section>

            {error ? (
                <div className="form-error">
                    {error}
                </div>
            ) : (
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>PNR</th>
                                <th>User</th>
                                <th>Train</th>
                                <th>Route</th>
                                <th>Date</th>
                                <th>Fare</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {bookings.map(booking => (
                                <tr key={booking.id}>
                                    <td>
                                        {booking.pnr}
                                    </td>

                                    <td>
                                        <strong>
                                            {
                                                booking.user_name
                                            }
                                        </strong>
                                        <br />
                                        <small>
                                            {booking.email}
                                        </small>
                                    </td>

                                    <td>
                                        {
                                            booking.train_number
                                        }
                                        <br />
                                        <small>
                                            {
                                                booking.train_name
                                            }
                                        </small>
                                    </td>

                                    <td>
                                        {booking.source}
                                        {" → "}
                                        {booking.destination}
                                    </td>

                                    <td>
                                        {
                                            booking.journey_date
                                        }
                                    </td>
                                    <td>
                                        ₹{Number(
                                            booking.total_fare
                                        ).toFixed(2)}
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
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}

export default Bookings;