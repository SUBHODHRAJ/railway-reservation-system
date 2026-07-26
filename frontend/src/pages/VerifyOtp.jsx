import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { sendOTP, verifyOTP } from "../api/otpApi";
import { useAuth } from "../context/AuthContext";

function VerifyOtp() {
    const { user, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [otp, setOtp] = useState("");
    const [countdown, setCountdown] = useState(0);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [sending, setSending] = useState(false);
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        if (countdown <= 0) {
            return;
        }

        const timer = setInterval(() => {
            setCountdown(previous =>
                previous > 0 ? previous - 1 : 0
            );
        }, 1000);

        return () => clearInterval(timer);
    }, [countdown]);

    const handleSendOTP = async () => {
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
                response.data.resendCooldownSeconds || 60
            );
        } catch (error) {
            const data = error.response?.data;

            if (
                error.response?.status === 429 &&
                data?.retryAfter
            ) {
                setCountdown(Number(data.retryAfter));
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
        const value = event.target.value
            .replace(/\D/g, "")
            .slice(0, 6);

        setOtp(value);
    };

    const handleVerify = async event => {
        event.preventDefault();

        setMessage("");
        setError("");

        if (!/^\d{6}$/.test(otp)) {
            setError("Enter a valid 6-digit verification code");
            return;
        }

        setVerifying(true);

        try {
            const response = await verifyOTP(otp);

        const updatedUser = await refreshProfile();

        setMessage(
        response.data.message ||
        "Email verified successfully"
        );

        setOtp("");

        setTimeout(() => {
        if (updatedUser.role === "ADMIN") {
            navigate("/admin/dashboard");
        } else {
            navigate("/search");
        }
        }, 800);
        } catch (error) {
            const data = error.response?.data;

            let errorMessage =
                data?.message ||
                "Unable to verify code";

            if (
                typeof data?.attemptsRemaining === "number"
            ) {
                errorMessage +=
                    ` ${data.attemptsRemaining} attempt${
                        data.attemptsRemaining === 1 ? "" : "s"
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
        <main className="auth-page">
            <section className="auth-card">
                <div className="auth-brand">
                    TRAIN
                </div>

                <h1>Verify your email</h1>

                <p className="auth-subtitle">
                    Verify your email before booking railway
                    tickets.
                </p>

                {user?.email && (
                    <div className="verification-email">
                        {user.email}
                    </div>
                )}

                <button
                    type="button"
                    className="secondary-button"
                    onClick={handleSendOTP}
                    disabled={sending || countdown > 0}
                >
                    {sending
                        ? "Sending..."
                        : countdown > 0
                          ? `Resend OTP in ${countdown}s`
                          : "Send OTP"}
                </button>

                <form
                    className="auth-form otp-form"
                    onSubmit={handleVerify}
                >
                    <div className="form-group">
                        <label htmlFor="otp">
                            Verification code
                        </label>

                        <input
                            id="otp"
                            name="otp"
                            className="otp-input"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            placeholder="000000"
                            value={otp}
                            onChange={handleOtpChange}
                            maxLength={6}
                            required
                        />
                    </div>

                    {error && (
                        <div className="form-error">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="form-success">
                            {message}
                        </div>
                    )}

                    <button
                        className="primary-button"
                        type="submit"
                        disabled={
                            verifying ||
                            otp.length !== 6
                        }
                    >
                        {verifying
                            ? "Verifying..."
                            : "Verify email"}
                    </button>
                </form>
            </section>
        </main>
    );
}

export default VerifyOtp;