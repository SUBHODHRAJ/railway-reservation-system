import { useState } from "react";
import {
    Link,
    useNavigate
} from "react-router-dom";

import { registerUser } from "../api/authApi";

function Register() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const [showPassword, setShowPassword] =
        useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = event => {
        const { name, value } = event.target;

        setError("");
        setSuccess("");

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
        setSuccess("");

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await registerUser({
                name: form.name.trim(),
                email: form.email.trim(),
                password: form.password
            });

            setSuccess(
                response.data.message ||
                "Account created successfully."
            );

            setForm({
                name: "",
                email: "",
                password: "",
                confirmPassword: ""
            });

            setTimeout(() => {
                navigate("/login");
            }, 1200);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to create account"
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
                            START YOUR JOURNEY
                        </p>

                        <h1>
                            Travel planning made simpler.
                        </h1>

                        <p>
                            Create your account to search
                            journeys, reserve seats and keep
                            your bookings organized.
                        </p>
                    </div>

                    <div className="auth-route-decoration">
                        <span>SEARCH</span>

                        <div aria-hidden="true">
                            <i />
                            <strong>→</strong>
                            <i />
                        </div>

                        <span>BOOK</span>
                    </div>
                </aside>

                <section className="auth-panel">
                    <div className="auth-panel-inner auth-register-inner">
                        <div className="auth-mobile-brand">
                            <span>TR</span>
                            <strong>TRAIN</strong>
                        </div>

                        <header className="auth-heading">
                            <p className="auth-eyebrow">
                                CREATE ACCOUNT
                            </p>

                            <h2>Get started</h2>

                            <p>
                                Create an account to start
                                booking railway journeys.
                            </p>
                        </header>

                        <form
                            className="auth-form auth-modern-form"
                            onSubmit={handleSubmit}
                        >
                            <div className="form-group">
                                <label htmlFor="name">
                                    Full name
                                </label>

                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Enter your full name"
                                    autoComplete="name"
                                    disabled={loading}
                                    autoFocus
                                    required
                                />
                            </div>

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
                                        placeholder="Create a password"
                                        autoComplete="new-password"
                                        disabled={loading}
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="auth-password-toggle"
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

                            <div className="form-group">
                                <label htmlFor="confirmPassword">
                                    Confirm password
                                </label>

                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={
                                        form.confirmPassword
                                    }
                                    onChange={handleChange}
                                    placeholder="Enter password again"
                                    autoComplete="new-password"
                                    disabled={loading}
                                    required
                                />
                            </div>

                            {error && (
                                <div
                                    className="form-error auth-message"
                                    role="alert"
                                >
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div
                                    className="form-success auth-message"
                                    role="status"
                                >
                                    {success}
                                </div>
                            )}

                            <button
                                className="primary-button auth-submit-button"
                                type="submit"
                                disabled={loading}
                            >
                                {loading
                                    ? "Creating account..."
                                    : "Create account"}
                            </button>
                        </form>

                        <p className="auth-switch auth-modern-switch">
                            Already registered?{" "}
                            <Link to="/login">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </section>
            </section>
        </main>
    );
}

export default Register;