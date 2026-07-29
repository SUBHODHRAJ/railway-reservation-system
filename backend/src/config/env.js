const requiredVariables = [
    "DB_HOST",
    "DB_USER",
    "DB_NAME",
    "JWT_SECRET"
];

const validateEnvironment = () => {
    const missing = requiredVariables.filter(
        name => !process.env[name]?.trim()
    );

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(", ")}`
        );
    }

    const port = Number(process.env.PORT || 5000);
    const dbPort = Number(process.env.DB_PORT || 3306);

    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
        throw new Error("PORT must be a valid port number");
    }

    if (!Number.isInteger(dbPort) || dbPort <= 0 || dbPort > 65535) {
        throw new Error("DB_PORT must be a valid port number");
    }

    if (
        process.env.NODE_ENV === "production" &&
        process.env.JWT_SECRET.length < 32
    ) {
        throw new Error(
            "JWT_SECRET must be at least 32 characters in production"
        );
    }
};

module.exports = {
    validateEnvironment
};