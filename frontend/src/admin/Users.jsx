import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    getUsers,
    updateUserRole
} from "../api/adminApi";

import { useAuth } from "../context/AuthContext";

function Users() {
    const { user: currentUser } = useAuth();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [query, setQuery] = useState("");
    const [updatingUserId, setUpdatingUserId] =
        useState(null);

    useEffect(() => {
        getUsers()
            .then(response =>
                setUsers(response.data)
            )
            .catch(error =>
                setError(
                    error.response?.data?.message ||
                    "Unable to load users"
                )
            )
            .finally(() =>
                setLoading(false)
            );
    }, []);

    const handleRoleChange = async (
        targetUser,
        role
    ) => {
        if (targetUser.role === role) {
            return;
        }

        if (
            Number(targetUser.id) ===
            Number(currentUser?.id)
        ) {
            setError(
                "You cannot change your own admin role"
            );
            return;
        }

        setError("");
        setSuccess("");
        setUpdatingUserId(targetUser.id);

        try {
            const response =
                await updateUserRole(
                    targetUser.id,
                    role
                );

            const updatedUser =
                response.data?.user;

            setUsers(current =>
                current.map(item =>
                    item.id === targetUser.id
                        ? {
                              ...item,
                              role:
                                  updatedUser?.role ??
                                  role
                          }
                        : item
                )
            );

            setSuccess(
                response.data?.message ||
                "User role updated successfully"
            );
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to update user role"
            );
        } finally {
            setUpdatingUserId(null);
        }
    };

    const filteredUsers = useMemo(() => {
        const value =
            query.trim().toLowerCase();

        if (!value) {
            return users;
        }

        return users.filter(user =>
            [
                user.id,
                user.name,
                user.email,
                user.role
            ].some(item =>
                String(item ?? "")
                    .toLowerCase()
                    .includes(value)
            )
        );
    }, [users, query]);

    const formatDate = value => {
        if (!value) {
            return "—";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return new Intl.DateTimeFormat(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        ).format(date);
    };

    return (
        <main className="page-container admin-list-page">
            <AdminHeader
                title="Users"
                description="View registered accounts and manage user roles."
                count={users.length}
                countLabel="users"
            />

            {error && (
                <div
                    className="form-error"
                    role="alert"
                >
                    {error}
                </div>
            )}

            {success && (
                <div
                    className="admin-success-message"
                    role="status"
                >
                    {success}
                </div>
            )}

            {loading ? (
                <AdminLoading text="Loading users..." />
            ) : (
                <section className="admin-table-card">
                    <div className="admin-table-toolbar">
                        <div>
                            <strong>
                                Registered users
                            </strong>

                            <span>
                                {filteredUsers.length} of{" "}
                                {users.length} shown
                            </span>
                        </div>

                        <input
                            type="search"
                            className="admin-search-input"
                            placeholder="Search users..."
                            aria-label="Search users"
                            value={query}
                            onChange={event =>
                                setQuery(
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <div className="table-wrapper admin-table-wrapper">
                        <table className="data-table admin-data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Verification</th>
                                    <th>Joined</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredUsers.map(
                                    user => {
                                        const isCurrentUser =
                                            Number(user.id) ===
                                            Number(
                                                currentUser?.id
                                            );

                                        const isUpdating =
                                            updatingUserId ===
                                            user.id;

                                        return (
                                            <tr key={user.id}>
                                                <td className="admin-id-cell">
                                                    #{user.id}
                                                </td>

                                                <td>
                                                    <strong className="admin-primary-cell">
                                                        {user.name}
                                                    </strong>

                                                    {isCurrentUser && (
                                                        <span className="admin-current-user">
                                                            You
                                                        </span>
                                                    )}
                                                </td>

                                                <td>
                                                    {user.email}
                                                </td>

                                                <td>
                                                    <select
                                                        className="admin-role-select"
                                                        value={
                                                            user.role
                                                        }
                                                        disabled={
                                                            isCurrentUser ||
                                                            isUpdating
                                                        }
                                                        aria-label={`Role for ${user.name}`}
                                                        title={
                                                            isCurrentUser
                                                                ? "You cannot change your own role"
                                                                : "Change user role"
                                                        }
                                                        onChange={
                                                            event =>
                                                                handleRoleChange(
                                                                    user,
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                        }
                                                    >
                                                        <option value="USER">
                                                            USER
                                                        </option>

                                                        <option value="ADMIN">
                                                            ADMIN
                                                        </option>
                                                    </select>

                                                    {isUpdating && (
                                                        <span className="admin-role-updating">
                                                            Updating...
                                                        </span>
                                                    )}
                                                </td>

                                                <td>
                                                    <span
                                                        className={`admin-verification ${
                                                            user.email_verified
                                                                ? "admin-verified"
                                                                : "admin-unverified"
                                                        }`}
                                                    >
                                                        <i
                                                            aria-hidden="true"
                                                        />

                                                        {user.email_verified
                                                            ? "Verified"
                                                            : "Not verified"}
                                                    </span>
                                                </td>

                                                <td>
                                                    {formatDate(
                                                        user.created_at
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    }
                                )}
                            </tbody>
                        </table>
                    </div>

                    {filteredUsers.length === 0 && (
                        <AdminEmpty
                            title="No users found"
                            text="No registered users match your search."
                        />
                    )}
                </section>
            )}
        </main>
    );
}

function AdminHeader({
    title,
    description,
    count,
    countLabel
}) {
    return (
        <section className="hero-section admin-list-hero">
            <p className="eyebrow">
                ADMINISTRATION
            </p>

            <div className="admin-list-title">
                <div>
                    <h1>{title}</h1>
                    <p>{description}</p>
                </div>

                <div className="admin-record-count">
                    <strong>{count}</strong>
                    <span>{countLabel}</span>
                </div>
            </div>
        </section>
    );
}

function AdminLoading({ text }) {
    return (
        <div className="admin-list-loading">
            <div
                className="loading-spinner"
                aria-hidden="true"
            />
            <span>{text}</span>
        </div>
    );
}

function AdminEmpty({ title, text }) {
    return (
        <div className="admin-table-empty">
            <strong>{title}</strong>
            <span>{text}</span>
        </div>
    );
}

export default Users;