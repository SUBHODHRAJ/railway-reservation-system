import { useState } from "react";
import {
    Link,
    useNavigate
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: "",
        password: ""
    });

    const [showPassword, setShowPassword] =
        useState(false);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = event => {
        const { name, value } = event.target;

        setError("");

        setForm(previous => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSubmit = async event => {
        event.preventDefault();

        if (loading) {
            return;
        }

        setError("");
        setLoading(true);

        try {
            const result = await login({
                email: form.email.trim(),
                password: form.password
            });

            const user = result.user;

            if (!user.emailVerified) {
                navigate("/verify-email");
            } else if (user.role === "ADMIN") {
                navigate("/admin/dashboard");
            } else {
                navigate("/search");
            }
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to sign in. Check your details and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-page auth-modern-page">
            <section className="auth-layout">
                <aside className="auth-intro">
                    <Link
                        to="/login"
                        className="auth-logo"
                        aria-label="TRAIN"
                    >
                        <span>TR</span>
                        <strong>TRAIN</strong>
                    </Link>

                    <div className="auth-intro-content">
                        <p className="auth-eyebrow">
                            RAILWAY RESERVATIONS
                        </p>

                        <h1>
                            Your journey starts here.
                        </h1>

                        <p>
                            Search trains, choose your seats
                            and manage reservations from one
                            place.
                        </p>
                    </div>

                    <div className="auth-route-decoration">
                        <span>MAS</span>

                        <div aria-hidden="true">
                            <i />
                            <strong>→</strong>
                            <i />
                        </div>

                        <span>NDLS</span>
                    </div>
                </aside>

                <section className="auth-panel">
                    <div className="auth-panel-inner">
                        <div className="auth-mobile-brand">
                            <span>TR</span>
                            <strong>TRAIN</strong>
                        </div>

                        <header className="auth-heading">
                            <p className="auth-eyebrow">
                                WELCOME BACK
                            </p>

                            <h2>Sign in</h2>

                            <p>
                                Enter your account details to
                                continue.
                            </p>
                        </header>

                        <form
                            className="auth-form auth-modern-form"
                            onSubmit={handleSubmit}
                        >
                            <div className="form-group">
                                <label htmlFor="email">
                                    Email address
                                </label>

                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    autoFocus
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">
                                    Password
                                </label>

                                <div className="auth-password-field">
                                    <input
                                        id="password"
                                        name="password"
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                        disabled={loading}
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="auth-password-toggle"
                                        aria-label={
                                            showPassword
                                                ? "Hide password"
                                                : "Show password"
                                        }
                                        onClick={() =>
                                            setShowPassword(
                                                previous =>
                                                    !previous
                                            )
                                        }
                                    >
                                        {showPassword
                                            ? "Hide"
                                            : "Show"}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div
                                    className="form-error auth-message"
                                    role="alert"
                                >
                                    {error}
                                </div>
                            )}

                            <button
                                className="primary-button auth-submit-button"
                                type="submit"
                                disabled={loading}
                            >
                                {loading
                                    ? "Signing in..."
                                    : "Sign in"}
                            </button>
                        </form>

                        <p className="auth-switch auth-modern-switch">
                            New to TRAIN?{" "}
                            <Link to="/register">
                                Create an account
                            </Link>
                        </p>
                    </div>
                </section>
            </section>
        </main>
    );
}

export default Login;