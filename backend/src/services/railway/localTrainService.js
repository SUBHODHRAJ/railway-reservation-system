const db = require("../../config/db");

const findByTrainNumber = async (trainNumber) => {
    const [rows] = await db.query(
        `SELECT id, train_number, train_name
         FROM trains
         WHERE train_number = ?
         LIMIT 1`,
        [String(trainNumber)]
    );

    return rows[0] || null;
};

module.exports = {
    findByTrainNumber
};
