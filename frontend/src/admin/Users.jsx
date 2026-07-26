import { useEffect, useState } from "react";
import { getUsers } from "../api/adminApi";

function Users() {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState("");

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
            );
    }, []);

    return (
        <AdminPage
            title="Users"
            error={error}
        >
            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Verified</th>
                            <th>Joined</th>
                        </tr>
                    </thead>

                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>{user.role}</td>
                                <td>
                                    {user.email_verified
                                        ? "Yes"
                                        : "No"}
                                </td>
                                <td>
                                    {user.created_at}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminPage>
    );
}

function AdminPage({ title, error, children }) {
    return (
        <main className="page-container">
            <section className="hero-section">
                <p className="eyebrow">
                    ADMINISTRATION
                </p>
                <h1>{title}</h1>
            </section>

            {error ? (
                <div className="form-error">
                    {error}
                </div>
            ) : (
                children
            )}
        </main>
    );
}

export default Users;