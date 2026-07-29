const railwayService = require("./railwayService");

const DAY_NAMES = [
    "sun",
    "mon",
    "tue",
    "wed",
    "thu",
    "fri",
    "sat"
];

const normalizeDate = value => {
    const match = String(value || "").match(
        /^(\d{4})-(\d{2})-(\d{2})$/
    );

    if (!match) {
        throw new Error("Invalid journey date");
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const date = new Date(
        Date.UTC(year, month - 1, day)
    );

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        throw new Error("Invalid journey date");
    }

    return date;
};

const checkOperatingDate = (
    train,
    journeyDate
) => {
    const date = normalizeDate(journeyDate);
    const dayName = DAY_NAMES[date.getUTCDay()];

    const runDays = (train.runDays || []).map(
        day => String(day).toLowerCase()
    );

    return {
        train,
        journeyDate,
        dayName,
        runsOnDate: runDays.includes(dayName)
    };
};

const getOperatingDate = async (
    trainNumber,
    journeyDate
) => {
    const train = await railwayService.getTrain(
        trainNumber
    );

    return checkOperatingDate(
        train,
        journeyDate
    );
};

module.exports = {
    normalizeDate,
    checkOperatingDate,
    getOperatingDate
};