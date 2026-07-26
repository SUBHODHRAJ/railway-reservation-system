import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/authApi";

function Register() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
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
        setSuccess("");

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const response = await registerUser({
                name: form.name.trim(),
                email: form.email.trim(),
                password: form.password
            });

            setSuccess(response.data.message);
            setTimeout(() => {navigate("/login");}, 1200);

            setForm({
                name: "",
                email: "",
                password: "",
                confirmPassword: ""
            });
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
        <main className="auth-page">
            <section className="auth-card">
                <div className="auth-brand">
                    TRAIN
                </div>

                <h1>Create account</h1>

                <p className="auth-subtitle">
                    Register to search and book railway journeys.
                </p>

                <form
                    className="auth-form"
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
                            required
                        />
                    </div>

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
                            placeholder="Create a password"
                            autoComplete="new-password"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">
                            Confirm password
                        </label>

                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            placeholder="Enter password again"
                            autoComplete="new-password"
                            required
                        />
                    </div>

                    {error && (
                        <div className="form-error">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="form-success">
                            {success}
                        </div>
                    )}

                    <button
                        className="primary-button"
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Creating account..."
                            : "Create account"}
                    </button>
                </form>
                <p className="auth-switch">
                    Already have an account?{" "}
                    <Link to="/login">
                        Sign in
                    </Link>
                </p>
            </section>
        </main>
    );
}

export default Register;