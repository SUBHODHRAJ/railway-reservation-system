import api from "./axios";

export const getStations = (q = "") => {
    return api.get("/trains/stations", {
        params: { q }
    });
};

export const searchTrains = ({
    source,
    destination,
    date
}) => {
    return api.get("/trains/search", {
        params: {
            source,
            destination,
            date
        }
    });
};

export const getJourney = journeyId => {
    return api.get(`/trains/journeys/${journeyId}`);
};

export const getAvailability = journeyId => {
    return api.get(
        `/trains/journeys/${journeyId}/availability`
    );
};

export const getSeats = (journeyId, classType) => {
    return api.get(
        `/trains/journeys/${journeyId}/seats`,
        {
            params: { classType }
        }
    );
};

export const getFare = ({
    trainId,
    source,
    destination,
    classType
}) => {
    return api.get("/trains/fare", {
        params: {
            trainId,
            source,
            destination,
            classType
        }
    });
};