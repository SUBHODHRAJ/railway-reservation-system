import { useEffect, useRef, useState } from "react";
import {
    Navigate,
    useLocation,
    useNavigate
} from "react-router-dom";

import {
    completePayment,
    createPayment
} from "../api/paymentApi";

function Payment() {
    const location = useLocation();
    const navigate = useNavigate();

    const state = location.state;
    const booking = state?.booking;

    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");

    const started = useRef(false);

    useEffect(() => {
        if (!booking?.bookingId || started.current) {
            return;
        }

        started.current = true;

        const initialisePayment = async () => {
            try {
                const response =
                    await createPayment(
                        booking.bookingId
                    );

                setPayment(response.data);
            } catch (error) {
                const data = error.response?.data;

                if (
                    error.response?.status === 409 &&
                    data?.paymentId &&
                    data?.status === "CREATED"
                ) {
                    setPayment({
                        paymentId: data.paymentId,
                        status: data.status,
                        amount:
                            booking.totalFare,
                        currency: "INR"
                    });
                } else {
                    setError(
                        data?.message ||
                        "Unable to create payment"
                    );
                }
            } finally {
                setLoading(false);
            }
        };

        initialisePayment();
    }, [booking]);

    if (!state || !booking?.bookingId) {
        return <Navigate to="/my-bookings" replace />;
    }

    const handlePayment = async success => {
        if (!payment?.paymentId) {
            return;
        }

        setProcessing(true);
        setError("");

        try {
            const response =
                await completePayment(
                    payment.paymentId,
                    success
                );

            if (success) {
                navigate("/confirmation", {
                    replace: true,
                    state: {
                        ...state,
                        paymentResult:
                            response.data
                    }
                });
            } else {
                navigate("/payment-failed", {
                    replace: true,
                    state: {
                        booking,
                        paymentResult:
                            response.data
                    }
                });
            }
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to complete payment"
            );
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <main className="route-loading">
                <div className="loading-spinner"></div>
                <p>Preparing payment...</p>
            </main>
        );
    }

    return (
        <main className="page-container payment-page">
            <section className="hero-section">
                <p className="eyebrow">
                    SIMULATED PAYMENT
                </p>

                <h1>Complete payment</h1>

                <p>
                    Development payment flow. No real
                    payment will be charged.
                </p>
            </section>

            <section className="content-card payment-card">
                <div className="payment-notice">
                    Development Simulation
                </div>

                <div className="review-row">
                    <span>PNR</span>
                    <strong>{booking.pnr}</strong>
                </div>

                <div className="review-row">
                    <span>Booking ID</span>
                    <strong>
                        #{booking.bookingId}
                    </strong>
                </div>

                <div className="review-row">
                    <span>Payment ID</span>
                    <strong>
                        {payment?.paymentId || "—"}
                    </strong>
                </div>

                <div className="review-row">
                    <span>Amount</span>
                    <strong className="payment-total">
                        ₹
                        {Number(
                            payment?.amount ??
                            booking.totalFare
                        ).toFixed(2)}
                    </strong>
                </div>

                {error && (
                    <div className="form-error top-space">
                        {error}
                    </div>
                )}

                <div className="payment-actions">
                    <button
                        type="button"
                        className="primary-button"
                        disabled={
                            processing ||
                            !payment?.paymentId
                        }
                        onClick={() =>
                            handlePayment(true)
                        }
                    >
                        {processing
                            ? "Processing..."
                            : "Simulate successful payment"}
                    </button>

                    <button
                        type="button"
                        className="danger-outline-button"
                        disabled={
                            processing ||
                            !payment?.paymentId
                        }
                        onClick={() =>
                            handlePayment(false)
                        }
                    >
                        Simulate failure
                    </button>
                </div>
            </section>
        </main>
    );
}

export default Payment;