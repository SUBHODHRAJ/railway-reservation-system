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
        return (
            <Navigate
                to="/my-bookings"
                replace
            />
        );
    }

    const amount = Number(
        payment?.amount ??
        booking.totalFare ??
        0
    );

    const handlePayment = async success => {
        if (
            !payment?.paymentId ||
            processing
        ) {
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

                return;
            }

            navigate("/payment-failed", {
                replace: true,
                state: {
                    booking,
                    paymentResult:
                        response.data
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

                <p>
                    Preparing secure payment...
                </p>
            </main>
        );
    }

    return (
        <main className="page-container transaction-page">
            <section className="transaction-heading">
                <div>
                    <p className="eyebrow">
                        PAYMENT
                    </p>

                    <h1>
                        Complete your booking
                    </h1>

                    <p>
                        Confirm the reservation details
                        before completing the simulated
                        payment.
                    </p>
                </div>

                <div className="transaction-step">
                    <span>Final step</span>
                    <strong>Payment</strong>
                </div>
            </section>

            <section className="transaction-layout">
                <article className="transaction-card payment-modern-card">
                    <header className="transaction-card-header">
                        <div>
                            <span className="transaction-label">
                                RESERVATION
                            </span>

                            <h2>
                                Payment details
                            </h2>

                            <p>
                                Booking #
                                {booking.bookingId}
                            </p>
                        </div>

                        <span className="transaction-ready-badge">
                            Ready
                        </span>
                    </header>

                    <div className="simulation-notice">
                        <div
                            className="simulation-mark"
                            aria-hidden="true"
                        >
                            i
                        </div>

                        <div>
                            <strong>
                                Simulation mode
                            </strong>

                            <span>
                                This is a development
                                payment. No real money
                                will be charged.
                            </span>
                        </div>
                    </div>

                    <section className="payment-reference-grid">
                        <div>
                            <span>PNR</span>

                            <strong>
                                {booking.pnr}
                            </strong>
                        </div>

                        <div>
                            <span>Booking ID</span>

                            <strong>
                                #{booking.bookingId}
                            </strong>
                        </div>

                        <div>
                            <span>Payment ID</span>

                            <strong>
                                {payment?.paymentId ||
                                    "—"}
                            </strong>
                        </div>

                        <div>
                            <span>Currency</span>

                            <strong>
                                {payment?.currency ||
                                    "INR"}
                            </strong>
                        </div>
                    </section>

                    <section className="payment-payable">
                        <div>
                            <span>
                                AMOUNT PAYABLE
                            </span>

                            <p>
                                Total reservation amount
                            </p>
                        </div>

                        <strong>
                            ₹
                            {amount.toLocaleString(
                                "en-IN",
                                {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }
                            )}
                        </strong>
                    </section>

                    {error && (
                        <div
                            className="form-error transaction-error"
                            role="alert"
                        >
                            {error}
                        </div>
                    )}

                    <div className="payment-modern-actions">
                        <button
                            type="button"
                            className="primary-button payment-confirm-button"
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
                                : `Pay ₹${amount.toLocaleString(
                                      "en-IN",
                                      {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2
                                      }
                                  )}`}
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

                    <p className="transaction-helper">
                        Selecting the failure option is
                        provided only for testing the
                        unsuccessful-payment flow.
                    </p>
                </article>

                <aside className="payment-side-summary">
                    <span className="transaction-label">
                        BOOKING SUMMARY
                    </span>

                    <h3>
                        Reservation ready
                    </h3>

                    <p>
                        Your booking has been created and
                        is waiting for payment completion.
                    </p>

                    <div className="payment-side-divider" />

                    <div className="payment-side-row">
                        <span>PNR</span>
                        <strong>{booking.pnr}</strong>
                    </div>

                    <div className="payment-side-row">
                        <span>Status</span>
                        <strong>Awaiting payment</strong>
                    </div>

                    <div className="payment-side-divider" />

                    <div className="payment-side-total">
                        <span>Total</span>

                        <strong>
                            ₹
                            {amount.toLocaleString(
                                "en-IN",
                                {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }
                            )}
                        </strong>
                    </div>
                </aside>
            </section>
        </main>
    );
}

export default Payment;