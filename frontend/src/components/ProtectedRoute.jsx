import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children }) {
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

    return children;
}

export default ProtectedRoute;