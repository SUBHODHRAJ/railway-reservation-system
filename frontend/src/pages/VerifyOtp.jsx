import { useEffect, useState } from "react";
import {
    Navigate,
    useNavigate
} from "react-router-dom";

import {
    sendOTP,
    verifyOTP
} from "../api/otpApi";

import { useAuth } from "../context/AuthContext";

function VerifyOtp() {
    const { user, refreshProfile } = useAuth();
    const navigate = useNavigate();

    const [otp, setOtp] = useState("");
    const [countdown, setCountdown] =
        useState(0);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    const [sending, setSending] =
        useState(false);

    const [verifying, setVerifying] =
        useState(false);

    useEffect(() => {
        if (countdown <= 0) {
            return;
        }

        const timer = setInterval(() => {
            setCountdown(previous =>
                previous > 0
                    ? previous - 1
                    : 0
            );
        }, 1000);

        return () =>
            clearInterval(timer);
    }, [countdown]);

    const handleSendOTP = async () => {
        if (sending || countdown > 0) {
            return;
        }

        setMessage("");
        setError("");
        setSending(true);

        try {
            const response = await sendOTP();

            setMessage(
                response.data.message ||
                "Verification code sent"
            );

            setCountdown(
                response.data
                    .resendCooldownSeconds ||
                60
            );
        } catch (error) {
            const data =
                error.response?.data;

            if (
                error.response?.status ===
                    429 &&
                data?.retryAfter
            ) {
                setCountdown(
                    Number(data.retryAfter)
                );
            }

            setError(
                data?.message ||
                "Unable to send verification code"
            );
        } finally {
            setSending(false);
        }
    };

    const handleOtpChange = event => {
        const value =
            event.target.value
                .replace(/\D/g, "")
                .slice(0, 6);

        setError("");
        setOtp(value);
    };

    const handleVerify = async event => {
        event.preventDefault();

        if (verifying) {
            return;
        }

        setMessage("");
        setError("");

        if (!/^\d{6}$/.test(otp)) {
            setError(
                "Enter a valid 6-digit verification code"
            );
            return;
        }

        setVerifying(true);

        try {
            const response =
                await verifyOTP(otp);

            const updatedUser =
                await refreshProfile();

            setMessage(
                response.data.message ||
                "Email verified successfully"
            );

            setOtp("");

            setTimeout(() => {
                if (
                    updatedUser.role ===
                    "ADMIN"
                ) {
                    navigate(
                        "/admin/dashboard"
                    );
                } else {
                    navigate("/search");
                }
            }, 800);
        } catch (error) {
            const data =
                error.response?.data;

            let errorMessage =
                data?.message ||
                "Unable to verify code";

            if (
                typeof data?.attemptsRemaining ===
                "number"
            ) {
                errorMessage +=
                    ` ${data.attemptsRemaining} attempt${
                        data.attemptsRemaining ===
                        1
                            ? ""
                            : "s"
                    } remaining.`;
            }

            setError(errorMessage);
        } finally {
            setVerifying(false);
        }
    };

    if (user?.emailVerified) {
        return (
            <Navigate
                to={
                    user.role === "ADMIN"
                        ? "/admin/dashboard"
                        : "/search"
                }
                replace
            />
        );
    }

    return (
        <main className="auth-page auth-modern-page">
            <section className="auth-layout">
                <aside className="auth-intro">
                    <div className="auth-logo">
                        <span>TR</span>
                        <strong>TRAIN</strong>
                    </div>

                    <div className="auth-intro-content">
                        <p className="auth-eyebrow">
                            ACCOUNT SECURITY
                        </p>

                        <h1>
                            One final step.
                        </h1>

                        <p>
                            Verify your email address before
                            accessing railway reservations.
                        </p>
                    </div>

                    <div className="auth-route-decoration">
                        <span>ACCOUNT</span>

                        <div aria-hidden="true">
                            <i />
                            <strong>→</strong>
                            <i />
                        </div>

                        <span>VERIFIED</span>
                    </div>
                </aside>

                <section className="auth-panel">
                    <div className="auth-panel-inner auth-otp-inner">
                        <div className="auth-mobile-brand">
                            <span>TR</span>
                            <strong>TRAIN</strong>
                        </div>

                        <header className="auth-heading">
                            <p className="auth-eyebrow">
                                EMAIL VERIFICATION
                            </p>

                            <h2>Verify your email</h2>

                            <p>
                                Enter the six-digit code sent
                                to your email address.
                            </p>
                        </header>

                        {user?.email && (
                            <div className="verification-email auth-verification-email">
                                <span>
                                    Verification email
                                </span>

                                <strong>
                                    {user.email}
                                </strong>
                            </div>
                        )}

                        <div className="auth-send-code">
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={
                                    handleSendOTP
                                }
                                disabled={
                                    sending ||
                                    countdown > 0
                                }
                            >
                                {sending
                                    ? "Sending code..."
                                    : countdown > 0
                                    ? `Resend in ${countdown}s`
                                    : "Send verification code"}
                            </button>

                            {countdown > 0 && (
                                <span>
                                    A new code can be
                                    requested after the
                                    countdown.
                                </span>
                            )}
                        </div>

                        <form
                            className="auth-form auth-modern-form otp-form"
                            onSubmit={handleVerify}
                        >
                            <div className="form-group">
                                <label htmlFor="otp">
                                    Verification code
                                </label>

                                <input
                                    id="otp"
                                    name="otp"
                                    className="otp-input auth-otp-input"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={
                                        handleOtpChange
                                    }
                                    maxLength={6}
                                    disabled={verifying}
                                    autoFocus
                                    required
                                />

                                <span className="auth-field-hint">
                                    {otp.length}/6 digits
                                </span>
                            </div>

                            {error && (
                                <div
                                    className="form-error auth-message"
                                    role="alert"
                                >
                                    {error}
                                </div>
                            )}

                            {message && (
                                <div
                                    className="form-success auth-message"
                                    role="status"
                                >
                                    {message}
                                </div>
                            )}

                            <button
                                className="primary-button auth-submit-button"
                                type="submit"
                                disabled={
                                    verifying ||
                                    otp.length !== 6
                                }
                            >
                                {verifying
                                    ? "Verifying..."
                                    : "Verify and continue"}
                            </button>
                        </form>
                    </div>
                </section>
            </section>
        </main>
    );
}

export default VerifyOtp;