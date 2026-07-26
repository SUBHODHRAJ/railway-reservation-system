const notFound = (req, res) => {
    res.status(404).json({
        message: "API endpoint not found"
    });
};

const errorHandler = (error, req, res, next) => {
    console.error(error);

    if (res.headersSent) {
        return next(error);
    }

    res.status(error.status || 500).json({
        message:
            process.env.NODE_ENV === "production"
                ? "Internal server error"
                : error.message || "Internal server error"
    });
};

module.exports = {
    notFound,
    errorHandler
};