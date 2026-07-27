const CLASS_CONFIG = {
    S:  { classType: "SL", seats: 72 },
    B:  { classType: "3A", seats: 64 },
    A:  { classType: "2A", seats: 48 },
    H:  { classType: "1A", seats: 24 },
    HA: { classType: "1A", seats: 24 },
    M:  { classType: "3A", seats: 64 }
};

const NON_RESERVABLE = new Set([
    "ENG",
    "EOG",
    "SLR",
    "SLRDP",
    "GEN",
    "GS",
    "UR",
    "PC",
    "LPR"
]);

const parseCoachComposition = (coachPosition) => {
    if (!coachPosition || typeof coachPosition !== "string") {
        return [];
    }

    return coachPosition
        .split("-")
        .map(coach => coach.trim().toUpperCase())
        .filter(Boolean)
        .filter(coach => !NON_RESERVABLE.has(coach))
        .map(coach => {
            const prefixMatch = coach.match(/^([A-Z]+)\d+$/);

            if (!prefixMatch) {
                return null;
            }

            const prefix = prefixMatch[1];
            const config = CLASS_CONFIG[prefix];

            if (!config) {
                return null;
            }

            return {
                coachNumber: coach,
                classType: config.classType,
                seatCount: config.seats
            };
        })
        .filter(Boolean);
};

module.exports = {
    parseCoachComposition
};
