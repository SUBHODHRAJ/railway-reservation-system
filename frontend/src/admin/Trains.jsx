import { useEffect, useState } from "react";
import { getAdminTrains } from "../api/adminApi";

function Trains() {
    const [trains, setTrains] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        getAdminTrains()
            .then(response =>
                setTrains(response.data)
            )
            .catch(error =>
                setError(
                    error.response?.data?.message ||
                    "Unable to load trains"
                )
            );
    }, []);

    return (
        <main className="page-container">
            <section className="hero-section">
                <p className="eyebrow">
                    ADMINISTRATION
                </p>

                <h1>Trains</h1>
            </section>

            {error ? (
                <div className="form-error">
                    {error}
                </div>
            ) : (
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Train Number</th>
                                <th>Name</th>
                                <th>Coaches</th>
                                <th>Journeys</th>
                            </tr>
                        </thead>

                        <tbody>
                            {trains.map(train => (
                                <tr key={train.id}>
                                    <td>{train.id}</td>
                                    <td>
                                        {
                                            train.train_number
                                        }
                                    </td>
                                    <td>
                                        {
                                            train.train_name
                                        }
                                    </td>
                                    <td>
                                        {train.coaches}
                                    </td>
                                    <td>
                                        {train.journeys}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}

export default Trains;