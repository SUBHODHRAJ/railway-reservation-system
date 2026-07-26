const getConfig = () => {
    const baseUrl = process.env.RAILWAY_API_BASE_URL;
    const apiKey = process.env.RAILWAY_API_KEY;

    if (!baseUrl) {
        throw new Error("RAILWAY_API_BASE_URL is not configured");
    }

    if (!apiKey) {
        throw new Error("RAILWAY_API_KEY is not configured");
    }

    return {
        baseUrl: baseUrl.replace(/\/+$/, ""),
        apiKey
    };
};

const request = async (endpoint) => {
    const { baseUrl, apiKey } = getConfig();

    const response = await fetch(`${baseUrl}${endpoint}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: "application/json"
        }
    });

    const text = await response.text();

    let data;

    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = { message: text };
    }

    if (!response.ok) {
        const error = new Error(
            data?.message ||
            data?.error ||
            `RailRadar request failed with status ${response.status}`
        );

        error.status = response.status;
        error.provider = "railradar";
        error.data = data;

        throw error;
    }

    return data;
};

const getTrain = async (trainNumber) => {
    return request(`/trains/${encodeURIComponent(trainNumber)}`);
};

module.exports = {
    getTrain
};