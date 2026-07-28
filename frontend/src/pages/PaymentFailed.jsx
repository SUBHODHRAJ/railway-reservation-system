import {
    Navigate,
    useLocation,
    useNavigate
} from "react-router-dom";

function PaymentFailed() {
    const location = useLocation();
    const navigate = useNavigate();

    const booking =
        location.state?.booking;

    const paymentResult =
        location.state?.paymentResult;

    if (!booking) {
        return (
            <Navigate
                to="/my-bookings"
                replace
            />
        );
    }

    return (
        <main className="page-container transaction-result-page">
            <section className="transaction-result-card failure-modern">
                <header className="transaction-result-header">
                    <div
                        className="transaction-failure-mark"
                        aria-hidden="true"
                    >
                        ×
                    </div>

                    <p className="eyebrow failure-eyebrow">
                        PAYMENT FAILED
                    </p>

                    <h1>
                        Payment was not completed
                    </h1>

                    <p>
                        The transaction was unsuccessful,
                        so this reservation was not
                        confirmed.
                    </p>
                </header>

                <section className="failure-reference-modern">
                    <div>
                        <span>
                            BOOKING REFERENCE
                        </span>

                        <strong>
                            {booking.pnr || "—"}
                        </strong>
                    </div>

                    <span className="failure-status-badge">
                        Failed
                    </span>
                </section>

                <section className="failure-information">
                    <div
                        className="failure-information-mark"
                        aria-hidden="true"
                    >
                        i
                    </div>

                    <div>
                        <strong>
                            No payment was collected
                        </strong>

                        <p>
                            This was a simulated
                            transaction. The seats held for
                            this reservation have been
                            released and are available for
                            booking again.
                        </p>
                    </div>
                </section>

                <section className="failure-summary">
                    <div>
                        <span>PNR</span>

                        <strong>
                            {booking.pnr || "—"}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Payment status
                        </span>

                        <strong>
                            {paymentResult?.paymentStatus ||
                                paymentResult?.status ||
                                "FAILED"}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Reservation
                        </span>

                        <strong>
                            Not confirmed
                        </strong>
                    </div>

                    <div>
                        <span>Seat hold</span>

                        <strong>Released</strong>
                    </div>
                </section>

                <footer className="transaction-result-actions">
                    <button
                        type="button"
                        className="primary-button"
                        onClick={() =>
                            navigate("/search")
                        }
                    >
                        Search trains
                    </button>

                    <button
                        type="button"
                        className="secondary-action-button"
                        onClick={() =>
                            navigate(
                                "/my-bookings"
                            )
                        }
                    >
                        My bookings
                    </button>
                </footer>
            </section>
        </main>
    );
}

export default PaymentFailed;