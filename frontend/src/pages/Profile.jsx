import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    changePassword
} from "../api/authApi";

import {
    useAuth
} from "../context/AuthContext";

function Profile() {
    const navigate = useNavigate();

    const {
        user,
        refreshProfile,
        updateAccount
    } = useAuth();

    const [profileForm, setProfileForm] =
        useState({
            name: "",
            email: ""
        });

    const [passwordForm, setPasswordForm] =
        useState({
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
        });

    const [editing, setEditing] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [changingPassword, setChangingPassword] =
        useState(false);

    const [refreshing, setRefreshing] =
        useState(false);

    const [profileMessage, setProfileMessage] =
        useState("");

    const [profileError, setProfileError] =
        useState("");

    const [passwordMessage, setPasswordMessage] =
        useState("");

    const [passwordError, setPasswordError] =
        useState("");

    useEffect(() => {
        setProfileForm({
            name: user?.name || "",
            email: user?.email || ""
        });
    }, [user]);

    const userInitial =
        user?.name
            ?.trim()
            ?.charAt(0)
            ?.toUpperCase() ||
        user?.email
            ?.charAt(0)
            ?.toUpperCase() ||
        "U";

    const handleProfileChange = event => {
        const {
            name,
            value
        } = event.target;

        setProfileForm(previous => ({
            ...previous,
            [name]: value
        }));

        setProfileMessage("");
        setProfileError("");
    };

    const handlePasswordChange = event => {
        const {
            name,
            value
        } = event.target;

        setPasswordForm(previous => ({
            ...previous,
            [name]: value
        }));

        setPasswordMessage("");
        setPasswordError("");
    };

    const handleRefresh = async () => {
        if (refreshing) {
            return;
        }

        setRefreshing(true);
        setProfileMessage("");
        setProfileError("");

        try {
            await refreshProfile();

            setProfileMessage(
                "Account information refreshed."
            );
        } catch (error) {
            setProfileError(
                error.response?.data?.message ||
                "Unable to refresh account information."
            );
        } finally {
            setRefreshing(false);
        }
    };

    const handleEdit = () => {
        setProfileForm({
            name: user?.name || "",
            email: user?.email || ""
        });

        setProfileMessage("");
        setProfileError("");
        setEditing(true);
    };

    const handleCancelEdit = () => {
        setProfileForm({
            name: user?.name || "",
            email: user?.email || ""
        });

        setProfileMessage("");
        setProfileError("");
        setEditing(false);
    };

    const handleProfileSubmit = async event => {
        event.preventDefault();

        if (saving) {
            return;
        }

        const name =
            profileForm.name.trim();

        const email =
            profileForm.email
                .trim()
                .toLowerCase();

        if (!name || !email) {
            setProfileError(
                "Name and email are required."
            );
            return;
        }

        if (name.length > 100) {
            setProfileError(
                "Name must be 100 characters or fewer."
            );
            return;
        }

        if (email.length > 150) {
            setProfileError(
                "Email must be 150 characters or fewer."
            );
            return;
        }

        setSaving(true);
        setProfileMessage("");
        setProfileError("");

        try {
            const result =
                await updateAccount({
                    name,
                    email
                });

            setEditing(false);

            setProfileMessage(
                result.message ||
                "Profile updated successfully."
            );
        } catch (error) {
            setProfileError(
                error.response?.data?.message ||
                "Unable to update profile."
            );
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordSubmit =
        async event => {
            event.preventDefault();

            if (changingPassword) {
                return;
            }

            const {
                currentPassword,
                newPassword,
                confirmPassword
            } = passwordForm;

            setPasswordMessage("");
            setPasswordError("");

            if (
                !currentPassword ||
                !newPassword ||
                !confirmPassword
            ) {
                setPasswordError(
                    "Complete all password fields."
                );
                return;
            }

            if (newPassword.length < 8) {
                setPasswordError(
                    "New password must be at least 8 characters."
                );
                return;
            }

            if (newPassword.length > 128) {
                setPasswordError(
                    "New password must be 128 characters or fewer."
                );
                return;
            }

            if (
                currentPassword ===
                newPassword
            ) {
                setPasswordError(
                    "New password must be different from your current password."
                );
                return;
            }

            if (
                newPassword !==
                confirmPassword
            ) {
                setPasswordError(
                    "New passwords do not match."
                );
                return;
            }

            setChangingPassword(true);

            try {
                const { data } =
                    await changePassword({
                        currentPassword,
                        newPassword
                    });

                setPasswordForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: ""
                });

                setPasswordMessage(
                    data.message ||
                    "Password changed successfully."
                );
            } catch (error) {
                setPasswordError(
                    error.response?.data?.message ||
                    "Unable to change password."
                );
            } finally {
                setChangingPassword(false);
            }
        };

    return (
        <main className="page-container profile-page">
            <section className="hero-section profile-hero">
                <p className="eyebrow">
                    YOUR ACCOUNT
                </p>

                <h1>Account</h1>

                <p>
                    Manage your profile, verification
                    status and account security.
                </p>
            </section>

            <section className="profile-layout">
                <aside className="profile-summary-card">
                    <div
                        className="profile-avatar-large"
                        aria-hidden="true"
                    >
                        {userInitial}
                    </div>

                    <h2>
                        {user?.name || "Account"}
                    </h2>

                    <p>
                        {user?.email || "—"}
                    </p>

                    <span
                        className={`profile-verification-badge ${
                            user?.emailVerified
                                ? "profile-verified"
                                : "profile-unverified"
                        }`}
                    >
                        {user?.emailVerified
                            ? "Email verified"
                            : "Verification required"}
                    </span>

                    <div className="profile-summary-divider" />

                    <div className="profile-summary-row">
                        <span>
                            Account type
                        </span>

                        <strong>
                            {user?.role === "ADMIN"
                                ? "Administrator"
                                : "Passenger"}
                        </strong>
                    </div>

                    {!user?.emailVerified &&
                        user?.role !== "ADMIN" && (
                            <button
                                type="button"
                                className="primary-button profile-verify-button"
                                onClick={() =>
                                    navigate(
                                        "/verify-email"
                                    )
                                }
                            >
                                Verify email
                            </button>
                        )}
                </aside>

                <div className="profile-main-column">
                    <article className="content-card profile-details-card">
                        <header className="profile-details-heading">
                            <div>
                                <span className="profile-card-label">
                                    ACCOUNT INFORMATION
                                </span>

                                <h2>
                                    Profile details
                                </h2>

                                <p>
                                    Update the name and
                                    email associated with
                                    your account.
                                </p>
                            </div>

                            {!editing && (
                                <div className="profile-heading-actions">
                                    <button
                                        type="button"
                                        className="secondary-action-button"
                                        onClick={handleRefresh}
                                        disabled={
                                            refreshing
                                        }
                                    >
                                        {refreshing
                                            ? "Refreshing..."
                                            : "Refresh"}
                                    </button>

                                    <button
                                        type="button"
                                        className="primary-button"
                                        onClick={
                                            handleEdit
                                        }
                                    >
                                        Edit profile
                                    </button>
                                </div>
                            )}
                        </header>

                        {editing ? (
                            <form
                                className="profile-edit-form"
                                onSubmit={
                                    handleProfileSubmit
                                }
                            >
                                <div className="profile-form-grid">
                                    <div className="form-group">
                                        <label htmlFor="profile-name">
                                            Full name
                                        </label>

                                        <input
                                            id="profile-name"
                                            name="name"
                                            type="text"
                                            value={
                                                profileForm.name
                                            }
                                            onChange={
                                                handleProfileChange
                                            }
                                            maxLength={100}
                                            disabled={
                                                saving
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="profile-email">
                                            Email address
                                        </label>

                                        <input
                                            id="profile-email"
                                            name="email"
                                            type="email"
                                            value={
                                                profileForm.email
                                            }
                                            onChange={
                                                handleProfileChange
                                            }
                                            maxLength={150}
                                            disabled={
                                                saving
                                            }
                                            required
                                        />

                                        <small className="profile-input-hint">
                                            Changing your
                                            email requires
                                            verification
                                            again.
                                        </small>
                                    </div>
                                </div>

                                {profileError && (
                                    <div
                                        className="form-error"
                                        role="alert"
                                    >
                                        {
                                            profileError
                                        }
                                    </div>
                                )}

                                <div className="profile-edit-actions">
                                    <button
                                        type="submit"
                                        className="primary-button"
                                        disabled={
                                            saving
                                        }
                                    >
                                        {saving
                                            ? "Saving..."
                                            : "Save changes"}
                                    </button>

                                    <button
                                        type="button"
                                        className="secondary-action-button"
                                        onClick={
                                            handleCancelEdit
                                        }
                                        disabled={
                                            saving
                                        }
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="profile-details-grid">
                                <div>
                                    <span>
                                        Full name
                                    </span>

                                    <strong>
                                        {user?.name ||
                                            "—"}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Email address
                                    </span>

                                    <strong>
                                        {user?.email ||
                                            "—"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Role</span>

                                    <strong>
                                        {user?.role ||
                                            "—"}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Email status
                                    </span>

                                    <strong>
                                        {user?.emailVerified
                                            ? "Verified"
                                            : "Not verified"}
                                    </strong>
                                </div>
                            </div>
                        )}

                        {!editing &&
                            profileMessage && (
                                <div
                                    className="form-success profile-message"
                                    role="status"
                                >
                                    {
                                        profileMessage
                                    }
                                </div>
                            )}

                        {!editing &&
                            profileError && (
                                <div
                                    className="form-error profile-message"
                                    role="alert"
                                >
                                    {profileError}
                                </div>
                            )}
                    </article>

                    <article className="content-card profile-security-card">
                        <header>
                            <span className="profile-card-label">
                                SECURITY
                            </span>

                            <h2>
                                Change password
                            </h2>

                            <p>
                                Confirm your current
                                password before choosing
                                a new one.
                            </p>
                        </header>

                        <form
                            className="password-change-form"
                            onSubmit={
                                handlePasswordSubmit
                            }
                        >
                            <div className="form-group">
                                <label htmlFor="current-password">
                                    Current password
                                </label>

                                <input
                                    id="current-password"
                                    name="currentPassword"
                                    type="password"
                                    value={
                                        passwordForm.currentPassword
                                    }
                                    onChange={
                                        handlePasswordChange
                                    }
                                    autoComplete="current-password"
                                    disabled={
                                        changingPassword
                                    }
                                    required
                                />
                            </div>

                            <div className="password-new-grid">
                                <div className="form-group">
                                    <label htmlFor="new-password">
                                        New password
                                    </label>

                                    <input
                                        id="new-password"
                                        name="newPassword"
                                        type="password"
                                        value={
                                            passwordForm.newPassword
                                        }
                                        onChange={
                                            handlePasswordChange
                                        }
                                        minLength={8}
                                        maxLength={128}
                                        autoComplete="new-password"
                                        disabled={
                                            changingPassword
                                        }
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirm-password">
                                        Confirm new password
                                    </label>

                                    <input
                                        id="confirm-password"
                                        name="confirmPassword"
                                        type="password"
                                        value={
                                            passwordForm.confirmPassword
                                        }
                                        onChange={
                                            handlePasswordChange
                                        }
                                        minLength={8}
                                        maxLength={128}
                                        autoComplete="new-password"
                                        disabled={
                                            changingPassword
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            <p className="password-requirement">
                                Use at least 8 characters.
                            </p>

                            {passwordMessage && (
                                <div
                                    className="form-success"
                                    role="status"
                                >
                                    {
                                        passwordMessage
                                    }
                                </div>
                            )}

                            {passwordError && (
                                <div
                                    className="form-error"
                                    role="alert"
                                >
                                    {passwordError}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="primary-button"
                                disabled={
                                    changingPassword
                                }
                            >
                                {changingPassword
                                    ? "Changing password..."
                                    : "Change password"}
                            </button>
                        </form>
                    </article>

                    <article className="profile-navigation-card">
                        <div>
                            <strong>
                                Reservation access
                            </strong>

                            <p>
                                Quickly return to your
                                railway booking tools.
                            </p>
                        </div>

                        <div>
                            {user?.role ===
                            "ADMIN" ? (
                                <button
                                    type="button"
                                    className="primary-button"
                                    onClick={() =>
                                        navigate(
                                            "/admin/dashboard"
                                        )
                                    }
                                >
                                    Admin dashboard
                                </button>
                            ) : user?.emailVerified ? (
                                <>
                                    <button
                                        type="button"
                                        className="primary-button"
                                        onClick={() =>
                                            navigate(
                                                "/my-bookings"
                                            )
                                        }
                                    >
                                        My bookings
                                    </button>

                                    <button
                                        type="button"
                                        className="secondary-action-button"
                                        onClick={() =>
                                            navigate(
                                                "/pnr"
                                            )
                                        }
                                    >
                                        Check PNR
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    className="primary-button"
                                    onClick={() =>
                                        navigate(
                                            "/verify-email"
                                        )
                                    }
                                >
                                    Verify email
                                </button>
                            )}
                        </div>
                    </article>
                </div>
            </section>
        </main>
    );
}

export default Profile;