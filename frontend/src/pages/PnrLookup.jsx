import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { getBookingByPNR } from "../api/bookingApi";

function PnrLookup() {
    const navigate = useNavigate();

    const [pnr, setPnr] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = event => {
        const value = event.target.value
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "")
            .slice(0, 30);

        setPnr(value);
        setError("");
    };

    const handleSubmit = async event => {
        event.preventDefault();

        const value = pnr.trim();

        if (!value) {
            setError("Enter a PNR number.");
            return;
        }

        if (loading) {
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response =
                await getBookingByPNR(value);

            const foundPnr =
                response.data?.pnr || value;

            navigate(
                `/booking/${encodeURIComponent(
                    foundPnr
                )}`
            );
        } catch (error) {
            const status =
                error.response?.status;

            if (status === 404) {
                setError(
                    "No booking was found for this PNR."
                );
            } else {
                setError(
                    error.response?.data?.message ||
                    "Unable to look up this PNR."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="page-container pnr-page">
            <section className="hero-section pnr-hero">
                <p className="eyebrow">
                    PNR STATUS
                </p>

                <h1>Find your reservation</h1>

                <p>
                    Enter your booking PNR to open the
                    latest reservation, passenger and
                    ticket information.
                </p>
            </section>

            <section className="pnr-layout">
                <article className="content-card pnr-search-card">
                    <header>
                        <span className="pnr-card-label">
                            BOOKING LOOKUP
                        </span>

                        <h2>Enter PNR</h2>

                        <p>
                            Your PNR is available on the
                            confirmation screen and in My
                            Bookings.
                        </p>
                    </header>

                    <form
                        className="pnr-form"
                        onSubmit={handleSubmit}
                    >
                        <div className="form-group">
                            <label htmlFor="pnr">
                                PNR number
                            </label>

                            <input
                                id="pnr"
                                name="pnr"
                                type="text"
                                value={pnr}
                                onChange={handleChange}
                                placeholder="TR1785198332257793"
                                autoComplete="off"
                                spellCheck="false"
                                disabled={loading}
                                autoFocus
                                required
                            />

                            <span className="pnr-field-hint">
                                Letters and numbers only
                            </span>
                        </div>

                        {error && (
                            <div
                                className="form-error"
                                role="alert"
                            >
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="primary-button"
                            disabled={
                                loading || !pnr.trim()
                            }
                        >
                            {loading
                                ? "Finding booking..."
                                : "Check PNR status"}
                        </button>
                    </form>
                </article>

                <aside className="pnr-help-card">
                    <span className="pnr-card-label">
                        PNR INFORMATION
                    </span>

                    <h3>
                        One reference for your journey
                    </h3>

                    <p>
                        Your PNR identifies a reservation
                        and provides access to its current
                        booking status.
                    </p>

                    <div className="pnr-help-divider" />

                    <div className="pnr-help-item">
                        <span>01</span>

                        <div>
                            <strong>
                                Enter the PNR
                            </strong>

                            <p>
                                Use the reference generated
                                when the booking was created.
                            </p>
                        </div>
                    </div>

                    <div className="pnr-help-item">
                        <span>02</span>

                        <div>
                            <strong>
                                View current status
                            </strong>

                            <p>
                                Open the existing ticket
                                page with journey, seat and
                                passenger information.
                            </p>
                        </div>
                    </div>
                </aside>
            </section>
        </main>
    );
}

export default PnrLookup;