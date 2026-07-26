import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function VerifiedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <main className="route-loading">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </main>
        );
    }

    if (!user) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    if (!user.emailVerified) {
        return (
            <Navigate
                to="/verify-email"
                replace
            />
        );
    }

    return children;
}

export default VerifiedRoute;