import {
    useLocation,
    useNavigate
} from "react-router-dom";

function PaymentFailed() {
    const location = useLocation();
    const navigate = useNavigate();

    const booking = location.state?.booking;

    return (
        <main className="page-container payment-failed-page">
            <section className="confirmation-card failure-card">
                <div
                    className="failure-icon"
                    aria-hidden="true"
                >
                    ×
                </div>

                <p className="eyebrow failure-eyebrow">
                    PAYMENT FAILED
                </p>

                <h1>Payment was not completed</h1>

                <p className="muted confirmation-subtitle">
                    Your booking was not confirmed. The
                    seats held for this reservation have
                    been released and can be booked again.
                </p>

                {booking?.pnr && (
                    <div className="failed-booking-reference">
                        <span>Booking reference</span>
                        <strong>{booking.pnr}</strong>
                    </div>
                )}

                <div className="failure-message">
                    No payment was collected for this
                    simulated transaction.
                </div>

                <div className="confirmation-actions">
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
                            navigate("/my-bookings")
                        }
                    >
                        My bookings
                    </button>
                </div>
            </section>
        </main>
    );
}

export default PaymentFailed;