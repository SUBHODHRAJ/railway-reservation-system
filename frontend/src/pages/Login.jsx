import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: "",
        password: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = event => {
        const { name, value } = event.target;

        setForm(previous => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSubmit = async event => {
    event.preventDefault();

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
            "Unable to login"
        );
    } finally {
        setLoading(false);
    }
};
    return (
        <main className="auth-page">
            <section className="auth-card">
                <div className="auth-brand">
                    TRAIN
                </div>

                <h1>Welcome back</h1>

                <p className="auth-subtitle">
                    Sign in to manage your railway journeys.
                </p>

                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                >
                    <div className="form-group">
                        <label htmlFor="email">
                            Email
                        </label>

                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">
                            Password
                        </label>

                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    {error && (
                        <div className="form-error">
                            {error}
                        </div>
                    )}

                    <button
                        className="primary-button"
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Signing in..."
                            : "Sign in"}
                    </button>
                </form>
                <p className="auth-switch">Don't have an account?{" "}
                    <Link to="/register">
                        Create account
                    </Link>
                </p>
            </section>
        </main>
    );
}

export default Login;