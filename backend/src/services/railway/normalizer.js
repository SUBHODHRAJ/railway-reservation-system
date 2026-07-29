const normalizeTrain = (response) => {
    const payload = response?.data;
    const train = payload?.train;
    const route = payload?.route;

    if (!train || !Array.isArray(route)) {
        throw new Error("Invalid railway provider response");
    }

    return {
        trainNumber: train.number,
        trainName: train.name,
        type: train.type,
        category: train.category,

        source: {
            code: train.source?.code,
            name: train.source?.name
        },

        destination: {
            code: train.destination?.code,
            name: train.destination?.name
        },

        runDays: train.runDays || [],

        distanceKm: train.distance ?? null,
        durationMinutes: train.duration ?? null,

        returnTrain: train.returnTrain ?? null,

        coachPosition: train.coachPosition ?? null,

        route: route
            .filter((stop) => stop.isHalt)
            .map((stop) => ({
                sequence: stop.sequence,

                stationCode: stop.station?.code,
                stationName: stop.station?.name,

                arrival: stop.arrival ?? null,
                arrivalDay: stop.arrivalDay ?? null,

                departure: stop.departure ?? null,
                departureDay: stop.departureDay ?? null,

                platform: stop.platform ?? null,
                distanceKm: stop.distance ?? null
            }))
    };
};
const normalizeTrainsBetween = response => {
    const payload = response?.data;

    if (!payload || !Array.isArray(payload.trains)) {
        throw new Error("Invalid trains-between provider response");
    }

    return {
        source: payload.from,
        destination: payload.to,
        count: payload.count ?? payload.trains.length,

        trains: payload.trains.map(item => ({
            trainNumber: item.train?.number,
            trainName: item.train?.name,
            type: item.train?.type,
            runDays: item.train?.runDays || [],

            source: {
                code: item.from?.code,
                name: item.from?.name,
                city: item.from?.city,
                departure: item.from?.departure,
                day: item.from?.day,
                sequence: item.from?.sequence
            },

            destination: {
                code: item.to?.code,
                name: item.to?.name,
                city: item.to?.city,
                arrival: item.to?.arrival,
                day: item.to?.day,
                sequence: item.to?.sequence
            },

            distanceKm: item.distance ?? null,
            durationMinutes: item.duration ?? null,
            haltsBetween: item.totalHaltsBetween ?? null
        }))
    };
};

const normalizeLiveTrainStatus = response => {
    const payload = response?.data;

    if (!payload || !payload.trainNumber) {
        throw new Error("Invalid live-status provider response");
    }

    return {
        trainNumber: payload.trainNumber,
        trainName: payload.trainName,
        startDate: payload.startDate,
        lastUpdatedAt: payload.lastUpdatedAt,

        status: payload.status,
        isLive: Boolean(payload.isLive),
        trackingMode: payload.trackingMode,

        delayMinutes: payload.delayMinutes ?? 0,

        currentLocation: payload.currentLocation ?? null,
        nextHalt: payload.nextHalt ?? null,

        train: {
            number: payload.train?.number,
            name: payload.train?.name,
            type: payload.train?.type,
            category: payload.train?.category,
            source: payload.train?.source,
            destination: payload.train?.destination,
            runDays: payload.train?.runDays || [],
            distanceKm: payload.train?.distance ?? null,
            durationMinutes: payload.train?.duration ?? null,
            coachPosition: payload.train?.coachPosition ?? null
        },

        route: Array.isArray(payload.route)
            ? payload.route.map(stop => ({
                sequence: stop.sequence,
                stationCode: stop.stationCode,
                stationName: stop.stationName,
                status: stop.status,

                scheduledArrival:
                    stop.scheduledArrival ?? null,
                scheduledDeparture:
                    stop.scheduledDeparture ?? null,

                actualArrival:
                    stop.actualArrival ?? null,
                actualDeparture:
                    stop.actualDeparture ?? null,

                delayArrival:
                    stop.delayArrival ?? null,
                delayDeparture:
                    stop.delayDeparture ?? null,

                platform: stop.platform ?? null,
                distanceKm: stop.distance ?? null,

                coachPosition:
                    stop.coachPosition ?? null
            }))
            : []
    };
};
module.exports = {
    normalizeTrain,
    normalizeTrainsBetween,
    normalizeLiveTrainStatus
};

