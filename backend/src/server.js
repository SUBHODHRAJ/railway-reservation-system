require("dotenv").config();
const {
    validateEnvironment
} = require("./config/env");

validateEnvironment();
const {
    notFound,
    errorHandler
} = require("./middleware/errorMiddleware");
const express = require("express");
const cors = require("cors");
const db = require("./config/db");
const {
    cleanupExpiredReservations
} = require("./services/booking/reservationExpiryService");
const authRoutes = require("./routes/authRoutes");
const railwayRoutes = require("./routes/railwayRoutes");
const trainRoutes = require("./routes/trainRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const otpRoutes = require("./routes/otpRoutes");

const app = express();

const allowedOrigins = (
    process.env.FRONTEND_URL ||
    "http://localhost:5173"
)
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

app.use(
    cors({
        origin(origin, callback) {
            if (
                !origin ||
                allowedOrigins.includes(origin)
            ) {
                return callback(null, true);
            }

            return callback(
                new Error(
                    "Origin not allowed by CORS"
                )
            );
        },
        methods: [
            "GET",
            "POST",
            "PATCH",
            "PUT",
            "DELETE"
        ],
        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]
    })
);
app.use(express.json({
    limit: "100kb"
}));

app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/trains", trainRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/railway", railwayRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Railway Reservation API running"
    });
});

app.get("/api/health", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT DATABASE() AS db, NOW() AS time"
        );

        res.json({
            status: "OK",
            database: rows[0].db,
            time: rows[0].time
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            status: "ERROR",
            message: "Database connection failed"
        });
    }
});
const PORT = process.env.PORT || 5000;

app.use(notFound);
app.use(errorHandler);

let cleanupTimer;
let isShuttingDown = false;

const runReservationCleanup = async () => {
    try {
        const result = await cleanupExpiredReservations();

        if (
            result.releasedSeats > 0 ||
            result.expiredBookings > 0
        ) {
            console.log(
                `Reservation cleanup: ${result.releasedSeats} seat(s) released, ${result.expiredBookings} booking(s) expired`
            );
        }
    } catch (error) {
        console.error(
            "Reservation cleanup failed:",
            error
        );
    }
};

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    runReservationCleanup();

    cleanupTimer = setInterval(
        runReservationCleanup,
        60 * 1000
    );

    cleanupTimer.unref();
});

const shutdown = signal => {
    if (isShuttingDown) {
        return;
    }

    isShuttingDown = true;
    console.log(`${signal} received. Shutting down...`);

    if (cleanupTimer) {
        clearInterval(cleanupTimer);
    }

    server.close(async error => {
        if (error) {
            console.error("HTTP server shutdown failed:", error);
            process.exitCode = 1;
        }

        try {
            await db.end();
            console.log("Database pool closed");
        } catch (dbError) {
            console.error(
                "Database pool shutdown failed:",
                dbError
            );
            process.exitCode = 1;
        }

        if (process.exitCode) {
            console.error("Shutdown completed with errors");
        }
    });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
