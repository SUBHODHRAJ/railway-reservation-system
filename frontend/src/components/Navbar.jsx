import {
    Link,
    useNavigate
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const homePath =
        user?.role === "ADMIN"
            ? "/admin/dashboard"
            : user
                ? "/search"
                : "/login";

    return (
        <header className="navbar">
            <div className="navbar-inner">
                <Link
                    to={homePath}
                    className="navbar-brand"
                >
                    TRAIN
                </Link>

                {user && (
                    <nav className="navbar-links">
                        {user.role === "ADMIN" ? (
                            <>
                                <Link to="/admin/dashboard">
                                    Dashboard
                                </Link>

                                <Link to="/admin/users">
                                    Users
                                </Link>

                                <Link to="/admin/trains">
                                    Trains
                                </Link>

                                <Link to="/admin/bookings">
                                    Bookings
                                </Link>
                            </>
                        ) : user.emailVerified ? (
                            <>
                                <Link to="/search">
                                    Search
                                </Link>

                                <Link to="/my-bookings">
                                    My Bookings
                                </Link>
                            </>
                        ) : (
                            <Link to="/verify-email">
                                Verify Email
                            </Link>
                        )}

                        <span className="navbar-user">
                            {user.name}
                        </span>

                        <button
                            type="button"
                            className="logout-button"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </nav>
                )}
            </div>
        </header>
    );
}

export default Navbar;