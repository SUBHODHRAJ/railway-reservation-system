import { useEffect, useState } from "react";

import {
    Link,
    NavLink,
    useLocation,
    useNavigate
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Navbar() {
    const { user, logout } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();

    const [menuOpen, setMenuOpen] =
        useState(false);

    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        setMenuOpen(false);
        logout();
        navigate("/login");
    };

    const homePath =
        user?.role === "ADMIN"
            ? "/admin/dashboard"
            : user
            ? "/search"
            : "/login";

    const getNavClass = ({ isActive }) =>
        `navbar-link ${
            isActive
                ? "navbar-link-active"
                : ""
        }`;

    const userInitial =
        user?.name?.trim()?.charAt(0)?.toUpperCase() ||
        user?.email?.charAt(0)?.toUpperCase() ||
        "U";

    return (
        <header className="navbar">
            <div className="navbar-inner">
                <Link
                    to={homePath}
                    className="navbar-brand"
                    aria-label="TRAIN home"
                >
                    <span
                        className="navbar-brand-mark"
                        aria-hidden="true"
                    >
                        T
                    </span>

                    <span className="navbar-brand-text">
                        TRAIN
                    </span>
                </Link>

                {user && (
                    <>
                        <button
                            type="button"
                            className="navbar-menu-button"
                            aria-label={
                                menuOpen
                                    ? "Close navigation menu"
                                    : "Open navigation menu"
                            }
                            aria-expanded={menuOpen}
                            aria-controls="main-navigation"
                            onClick={() =>
                                setMenuOpen(
                                    previous => !previous
                                )
                            }
                        >
                            <span />
                            <span />
                            <span />
                        </button>

                        <div
                            id="main-navigation"
                            className={`navbar-content ${
                                menuOpen
                                    ? "navbar-content-open"
                                    : ""
                            }`}
                        >
                            <nav
                                className="navbar-links"
                                aria-label="Main navigation"
                            >
                                {user.role === "ADMIN" ? (
                                    <>
                                        <NavLink
                                            to="/admin/dashboard"
                                            className={
                                                getNavClass
                                            }
                                        >
                                            Dashboard
                                        </NavLink>

                                        <NavLink
                                            to="/admin/users"
                                            className={
                                                getNavClass
                                            }
                                        >
                                            Users
                                        </NavLink>

                                        <NavLink
                                            to="/admin/trains"
                                            className={
                                                getNavClass
                                            }
                                        >
                                            Trains
                                        </NavLink>

                                        <NavLink
                                            to="/admin/bookings"
                                            className={
                                                getNavClass
                                            }
                                        >
                                            Bookings
                                        </NavLink>
                                    </>
                                ) : user.emailVerified ? (
                                    <>
                                        <NavLink
                                            to="/search"
                                            className={
                                                getNavClass
                                            }
                                        >
                                            Search trains
                                        </NavLink>

                                        <NavLink
                                            to="/my-bookings"
                                            className={
                                                getNavClass
                                            }
                                        >
                                            My Bookings
                                        </NavLink>
                                    </>
                                ) : (
                                    <NavLink
                                        to="/verify-email"
                                        className={
                                            getNavClass
                                        }
                                    >
                                        Verify Email
                                    </NavLink>
                                )}
                            </nav>

                            <div className="navbar-account">
                                <div
                                    className="navbar-avatar"
                                    aria-hidden="true"
                                >
                                    {userInitial}
                                </div>

                                <div className="navbar-user-details">
                                    <strong>
                                        {user.name ||
                                            "Account"}
                                    </strong>

                                    <span>
                                        {user.role === "ADMIN"
                                            ? "Administrator"
                                            : user.emailVerified
                                            ? "Passenger"
                                            : "Verification required"}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    className="logout-button"
                                    onClick={handleLogout}
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </header>
    );
}

export default Navbar;