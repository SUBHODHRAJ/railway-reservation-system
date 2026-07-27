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
                const response = await createPayment(
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
                        amount: booking.totalFare,
                        currency: "INR"
                    });
                } else {
                    setError(
                        data?.message ||
                        "Unable to prepare payment."
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

    const amount = Number(
        payment?.amount ?? booking.totalFare ?? 0
    );

    const handlePayment = async success => {
        if (!payment?.paymentId || processing) {
            return;
        }

        setProcessing(true);
        setError("");

        try {
            const response = await completePayment(
                payment.paymentId,
                success
            );

            if (success) {
                navigate("/confirmation", {
                    replace: true,
                    state: {
                        ...state,
                        paymentResult: response.data
                    }
                });

                return;
            }

            navigate("/payment-failed", {
                replace: true,
                state: {
                    booking,
                    paymentResult: response.data
                }
            });
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to complete payment."
            );
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <main className="route-loading">
                <div
                    className="loading-spinner"
                    aria-hidden="true"
                />

                <p>Preparing secure payment...</p>
            </main>
        );
    }

    return (
        <main className="page-container payment-page">
            <section className="hero-section payment-hero">
                <p className="eyebrow">
                    PAYMENT
                </p>

                <h1>Complete your booking</h1>

                <p>
                    Review the payment details and confirm
                    your reservation.
                </p>
            </section>

            <section className="payment-layout">
                <div className="content-card payment-card">
                    <div className="payment-card-header">
                        <div>
                            <h2>Payment details</h2>

                            <p className="muted">
                                Reservation #{booking.bookingId}
                            </p>
                        </div>

                        <span className="payment-status-badge">
                            Ready
                        </span>
                    </div>

                    <div className="payment-notice">
                        <strong>Simulation mode</strong>

                        <span>
                            No real payment will be charged.
                        </span>
                    </div>

                    <div className="payment-details-list">
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

                        <div className="review-row payment-amount-row">
                            <span>Amount payable</span>

                            <strong className="payment-total">
                                ₹{amount.toFixed(2)}
                            </strong>
                        </div>
                    </div>

                    {error && (
                        <div
                            className="form-error top-space"
                            role="alert"
                        >
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
                                ? "Processing payment..."
                                : `Pay ₹${amount.toFixed(2)}`}
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
                            Simulate payment failure
                        </button>
                    </div>

                    <p className="payment-helper">
                        This payment screen is currently
                        configured for development testing.
                    </p>
                </div>
            </section>
        </main>
    );
}

export default Payment;