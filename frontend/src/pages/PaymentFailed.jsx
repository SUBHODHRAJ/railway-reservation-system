import {
    useLocation,
    useNavigate
} from "react-router-dom";

function PaymentFailed() {
    const location = useLocation();
    const navigate = useNavigate();

    const booking = location.state?.booking;

    return (
        <main className="page-container">
            <section className="confirmation-card">
                <div className="failure-icon">
                    ×
                </div>

                <p className="eyebrow">
                    PAYMENT FAILED
                </p>

                <h1>Booking wasn't confirmed</h1>

                <p className="muted">
                    The simulated payment failed and
                    the held seats were released.
                </p>

                {booking?.pnr && (
                    <div className="pnr-box">
                        <span>PNR</span>
                        <strong>{booking.pnr}</strong>
                    </div>
                )}

                <button
                    type="button"
                    className="primary-button"
                    onClick={() =>
                        navigate("/search")
                    }
                >
                    Search trains
                </button>
            </section>
        </main>
    );
}

export default PaymentFailed;