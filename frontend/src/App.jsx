import {
    BrowserRouter,
    Navigate,
    Route,
    Routes
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import VerifiedRoute from "./components/VerifiedRoute";
import AdminRoute from "./components/AdminRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";

import Search from "./pages/Search";
import SearchResults from "./pages/SearchResults";
import Journey from "./pages/Journey";
import SeatSelection from "./pages/SeatSelection";
import PassengerDetails from "./pages/PassengerDetails";
import BookingReview from "./pages/BookingReview";

import Payment from "./pages/Payment";
import Confirmation from "./pages/Confirmation";
import PaymentFailed from "./pages/PaymentFailed";
import PnrLookup from "./pages/PnrLookup";
import Profile from "./pages/Profile";
import MyBookings from "./pages/MyBookings";
import BookingDetails from "./pages/BookingDetails";
import NotFound from "./pages/NotFound";
import Dashboard from "./admin/Dashboard";
import AdminUsers from "./admin/Users";
import AdminTrains from "./admin/Trains";
import AdminBookings from "./admin/Bookings";

function HomeRedirect() {
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
        return <Navigate to="/login" replace />;
    }

    if (!user.emailVerified) {
        return <Navigate to="/verify-email" replace />;
    }

    if (user.role === "ADMIN") {
        return (
            <Navigate
                to="/admin/dashboard"
                replace
            />
        );
    }

    return <Navigate to="/search" replace />;
}

function App() {
    return (
        <BrowserRouter>
            <Navbar />

            <Routes>
                <Route
                    path="/"
                    element={<HomeRedirect />}
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                <Route
                    path="/verify-email"
                    element={
                        <ProtectedRoute>
                            <VerifyOtp />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/search"
                    element={
                        <VerifiedRoute>
                            <Search />
                        </VerifiedRoute>
                    }
                />

                <Route
                    path="/search-results"
                    element={
                        <VerifiedRoute>
                            <SearchResults />
                        </VerifiedRoute>
                    }
                />

                <Route
                    path="/journey/:journeyId"
                    element={
                        <VerifiedRoute>
                            <Journey />
                        </VerifiedRoute>
                    }
                />

                <Route
                    path="/journey/:journeyId/seats"
                    element={
                        <VerifiedRoute>
                            <SeatSelection />
                        </VerifiedRoute>
                    }
                />

                <Route
                    path="/passengers"
                    element={
                        <VerifiedRoute>
                            <PassengerDetails />
                        </VerifiedRoute>
                    }
                />

                <Route
                    path="/booking-review"
                    element={
                        <VerifiedRoute>
                            <BookingReview />
                        </VerifiedRoute>
                    }
                />

                <Route
                    path="/payment"
                    element={
                        <VerifiedRoute>
                            <Payment />
                        </VerifiedRoute>
                    }
                />

                <Route
                    path="/confirmation"
                    element={
                        <VerifiedRoute>
                            <Confirmation />
                        </VerifiedRoute>
                    }
                />

                <Route
                    path="/payment-failed"
                    element={
                        <VerifiedRoute>
                            <PaymentFailed />
                        </VerifiedRoute>
                    }
                />

                <Route
                    path="/my-bookings"
                    element={
                        <VerifiedRoute>
                            <MyBookings />
                        </VerifiedRoute>
                    }
                />

                <Route
                    path="/booking/:pnr"
                    element={
                        <VerifiedRoute>
                            <BookingDetails />
                        </VerifiedRoute>
                    }
                />
                <Route
                    path="/pnr"
                    element={
                        <VerifiedRoute>
                            <PnrLookup />
                        </VerifiedRoute>
                    }
                />

                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/dashboard"
                    element={
                        <AdminRoute>
                            <Dashboard />
                        </AdminRoute>
                    }
                />

                <Route
                    path="/admin/users"
                    element={
                        <AdminRoute>
                            <AdminUsers />
                        </AdminRoute>
                    }
                />

                <Route
                    path="/admin/trains"
                    element={
                        <AdminRoute>
                            <AdminTrains />
                        </AdminRoute>
                    }
                />

                <Route
                    path="/admin/bookings"
                    element={
                        <AdminRoute>
                            <AdminBookings />
                        </AdminRoute>
                    }
                />

                <Route
                    path="*"
                    element={<NotFound />}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;