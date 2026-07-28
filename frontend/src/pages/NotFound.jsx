import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function NotFound() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleReturn = () => {
        if (!user) {
            navigate("/login");
            return;
        }

        if (!user.emailVerified) {
            navigate("/verify-email");
            return;
        }

        if (user.role === "ADMIN") {
            navigate("/admin/dashboard");
            return;
        }

        navigate("/search");
    };

    return (
        <main className="page-container not-found-page">
            <section className="not-found-card">
                <span className="not-found-code">
                    404
                </span>

                <p className="eyebrow">
                    PAGE NOT FOUND
                </p>

                <h1>
                    This route doesn't exist
                </h1>

                <p>
                    The page may have moved, or the
                    address may be incorrect.
                </p>

                <button
                    type="button"
                    className="primary-button"
                    onClick={handleReturn}
                >
                    Return to TRAIN
                </button>
            </section>
        </main>
    );
}

export default NotFound;