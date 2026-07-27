const BASE = process.env.BASE_URL || "http://localhost:5000/api";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@train.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const USER_EMAIL = process.env.USER_EMAIL;
const USER_PASSWORD = process.env.USER_PASSWORD;

const SOURCE = process.env.SOURCE || "MAS";
const DESTINATION = process.env.DESTINATION || "NDLS";
const JOURNEY_DATE = process.env.JOURNEY_DATE || "2026-08-16";
const CLASS_TYPE = process.env.CLASS_TYPE || "SL";

let passed = 0;
let failed = 0;

const results = [];

function pass(name, detail = "") {
    passed++;
    results.push({
        test: name,
        status: "PASS",
        detail
    });

    console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, error) {
    failed++;

    const detail =
        error instanceof Error
            ? error.message
            : String(error);

    results.push({
        test: name,
        status: "FAIL",
        detail
    });

    console.error(`✗ ${name} — ${detail}`);
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

async function request(path, options = {}) {
    const response = await fetch(`${BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const text = await response.text();

    let data = null;

    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }
    }

    if (!response.ok) {
        const message =
            data?.message ||
            JSON.stringify(data) ||
            `HTTP ${response.status}`;

        throw new Error(
            `${response.status} ${response.statusText}: ${message}`
        );
    }

    return data;
}

function auth(token) {
    return {
        Authorization: `Bearer ${token}`
    };
}

async function test(name, fn) {
    try {
        const result = await fn();
        pass(name, result?.detail || "");
        return result?.value ?? result;
    } catch (error) {
        fail(name, error);
        throw error;
    }
}

async function main() {
    if (!ADMIN_PASSWORD) {
        throw new Error(
            "ADMIN_PASSWORD environment variable is required"
        );
    }

    if (!USER_EMAIL || !USER_PASSWORD) {
        throw new Error(
            "USER_EMAIL and USER_PASSWORD environment variables are required"
        );
    }

    console.log("\nRAILWAY RESERVATION E2E TEST");
    console.log("============================");
    console.log(
        `${SOURCE} -> ${DESTINATION} | ${JOURNEY_DATE} | ${CLASS_TYPE}\n`
    );

    const adminLogin = await test("Admin login", async () => {
        const data = await request("/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD
            })
        });

        assert(data.token, "Admin JWT missing");
        assert(data.user?.role === "ADMIN", "Account is not ADMIN");

        return {
            value: data,
            detail: data.user.email
        };
    });

    const userLogin = await test("User login", async () => {
        const data = await request("/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: USER_EMAIL,
                password: USER_PASSWORD
            })
        });

        assert(data.token, "User JWT missing");
        assert(data.user?.role === "USER", "Account is not USER");
        assert(
            data.user?.emailVerified === true,
            "User email is not verified"
        );

        return {
            value: data,
            detail: data.user.email
        };
    });

    const adminToken = adminLogin.token;
    const userToken = userLogin.token;

    // Keeps admin login in the E2E flow and verifies the token.
    await test("Admin profile", async () => {
        const data = await request("/auth/profile", {
            headers: auth(adminToken)
        });

        assert(data.role === "ADMIN", "Admin profile role mismatch");

        return {
            detail: `ID ${data.id}`
        };
    });

    const searchResult = await test("Train search", async () => {
        const params = new URLSearchParams({
            source: SOURCE,
            destination: DESTINATION,
            date: JOURNEY_DATE
        });

        const data = await request(
            `/trains/search?${params.toString()}`
        );

        const journeys = Array.isArray(data) ? data : [data];

        const journey = journeys.find(
            item =>
                String(item.source_code).toUpperCase() ===
                    SOURCE.toUpperCase() &&
                String(item.destination_code).toUpperCase() ===
                    DESTINATION.toUpperCase()
        ) || journeys[0];

        assert(journey, "No journey returned");
        assert(journey.journey_id, "journey_id missing");

        return {
            value: journey,
            detail: `${journey.train_number} ${journey.train_name}`
        };
    });

    const journeyId = searchResult.journey_id;
    const trainId = searchResult.train_id;

    await test("Journey details", async () => {
        const data = await request(
            `/trains/journeys/${journeyId}`
        );

        assert(data, "Journey response missing");

        return {
            detail: `Journey ${journeyId}`
        };
    });

    const availabilityBefore = await test(
        "Availability",
        async () => {
            const data = await request(
                `/trains/journeys/${journeyId}/availability`
            );

            assert(Array.isArray(data), "Availability must be an array");

            const selectedClass = data.find(
                row => row.class_type === CLASS_TYPE
            );

            assert(
                selectedClass,
                `${CLASS_TYPE} availability missing`
            );

            const available =
                Number(selectedClass.available_seats);

            assert(
                available > 0,
                `No ${CLASS_TYPE} seats available`
            );

            return {
                value: data,
                detail: `${available} ${CLASS_TYPE} available`
            };
        }
    );

    const seats = await test("Seat listing", async () => {
        const params = new URLSearchParams({
            classType: CLASS_TYPE
        });

        const data = await request(
            `/trains/journeys/${journeyId}/seats?${params}`
        );

        assert(Array.isArray(data), "Seat response must be an array");

        const availableSeats = data.filter(
            seat => seat.status === "AVAILABLE"
        );

        assert(
            availableSeats.length > 0,
            "No AVAILABLE seats returned"
        );

        return {
            value: availableSeats,
            detail: `${availableSeats.length} selectable seats`
        };
    });

    const selectedSeat = seats[0];

    const fare = await test("Fare lookup", async () => {
        const params = new URLSearchParams({
            trainId: String(trainId),
            source: SOURCE,
            destination: DESTINATION,
            classType: CLASS_TYPE
        });

        const data = await request(
            `/trains/fare?${params.toString()}`
        );

        assert(data.amount, "Fare amount missing");
        assert(Number(data.amount) > 0, "Fare must be positive");

        return {
            value: data,
            detail: `INR ${data.amount}`
        };
    });

    await test("Seat hold", async () => {
        const data = await request("/bookings/hold", {
            method: "POST",
            headers: auth(userToken),
            body: JSON.stringify({
                journeyId,
                seatIds: [selectedSeat.seat_id]
            })
        });

        assert(
            data.seatIds?.includes(selectedSeat.seat_id),
            "Held seat ID mismatch"
        );

        return {
            detail:
                `${selectedSeat.coach_number}/${selectedSeat.seat_number}`
        };
    });

    await test("Hold reflected in availability", async () => {
        const data = await request(
            `/trains/journeys/${journeyId}/availability`
        );

        const before = availabilityBefore.find(
            row => row.class_type === CLASS_TYPE
        );

        const after = data.find(
            row => row.class_type === CLASS_TYPE
        );

        assert(after, `${CLASS_TYPE} availability missing`);

        assert(
            Number(after.available_seats) ===
                Number(before.available_seats) - 1,
            "Availability did not decrease by 1"
        );

        return {
            detail: `${after.available_seats} remaining`
        };
    });

    const booking = await test("Create booking", async () => {
        const data = await request("/bookings", {
            method: "POST",
            headers: auth(userToken),
            body: JSON.stringify({
                journeyId,
                source: SOURCE,
                destination: DESTINATION,
                classType: CLASS_TYPE,
                passengers: [
                    {
                        name: "E2E Test Passenger",
                        age: 22,
                        gender: "MALE",
                        seatId: selectedSeat.seat_id
                    }
                ]
            })
        });

        assert(data.bookingId, "bookingId missing");
        assert(data.pnr, "PNR missing");
        assert(
            data.status === "PENDING",
            `Expected PENDING, received ${data.status}`
        );

        assert(
            Number(data.totalFare) === Number(fare.amount),
            "Booking fare does not match fare API"
        );

        return {
            value: data,
            detail: `PNR ${data.pnr}`
        };
    });

    const payment = await test("Create payment", async () => {
        const data = await request("/payments/create", {
            method: "POST",
            headers: auth(userToken),
            body: JSON.stringify({
                bookingId: booking.bookingId
            })
        });

        assert(data.paymentId, "paymentId missing");
        assert(
            data.status === "CREATED",
            `Expected CREATED, received ${data.status}`
        );

        assert(
            Number(data.amount) === Number(booking.totalFare),
            "Payment amount mismatch"
        );

        return {
            value: data,
            detail: `Payment ${data.paymentId}`
        };
    });

    await test("Complete payment", async () => {
        const data = await request("/payments/complete", {
            method: "POST",
            headers: auth(userToken),
            body: JSON.stringify({
                paymentId: payment.paymentId,
                success: true
            })
        });

        assert(
            data.bookingStatus === "CONFIRMED",
            `Expected CONFIRMED, received ${data.bookingStatus}`
        );

        return {
            detail: "CONFIRMED"
        };
    });

    await test("PNR verification", async () => {
        const data = await request(
            `/bookings/pnr/${encodeURIComponent(booking.pnr)}`,
            {
                headers: auth(userToken)
            }
        );

        assert(
            data.status === "CONFIRMED",
            `Expected CONFIRMED, received ${data.status}`
        );

        assert(
            data.pnr === booking.pnr,
            "PNR mismatch"
        );

        const passenger = data.passengers?.find(
            p =>
                p.coach_number === selectedSeat.coach_number &&
                Number(p.seat_number) ===
                    Number(selectedSeat.seat_number)
        );

        assert(
            passenger,
            "Selected seat missing from PNR response"
        );

        return {
            detail: booking.pnr
        };
    });

    await test("Seat booked", async () => {
        const params = new URLSearchParams({
            classType: CLASS_TYPE
        });

        const data = await request(
            `/trains/journeys/${journeyId}/seats?${params}`
        );

        const seat = data.find(
            item =>
                Number(item.seat_id) ===
                Number(selectedSeat.seat_id)
        );

        assert(seat, "Booked seat missing");
        assert(
            seat.status === "BOOKED",
            `Expected BOOKED, received ${seat.status}`
        );

        return {
            detail:
                `${seat.coach_number}/${seat.seat_number}`
        };
    });

    await test("Cancel booking", async () => {
        const data = await request(
            `/bookings/${booking.bookingId}/cancel`,
            {
                method: "PATCH",
                headers: auth(userToken)
            }
        );

        assert(
            data.bookingStatus === "CANCELLED",
            `Expected CANCELLED, received ${data.bookingStatus}`
        );

        return {
            detail: data.refund || "CANCELLED"
        };
    });

    await test("Cancellation verification", async () => {
        const data = await request(
            `/bookings/pnr/${encodeURIComponent(booking.pnr)}`,
            {
                headers: auth(userToken)
            }
        );

        assert(
            data.status === "CANCELLED",
            `Expected CANCELLED, received ${data.status}`
        );

        const successfulPayment = data.payments?.find(
            p => Number(p.id) === Number(payment.paymentId)
        );

        assert(
            successfulPayment?.status === "REFUNDED",
            "Payment was not REFUNDED"
        );

        return {
            detail: "Booking cancelled + payment refunded"
        };
    });

    await test("Seat released", async () => {
        const params = new URLSearchParams({
            classType: CLASS_TYPE
        });

        const data = await request(
            `/trains/journeys/${journeyId}/seats?${params}`
        );

        const seat = data.find(
            item =>
                Number(item.seat_id) ===
                Number(selectedSeat.seat_id)
        );

        assert(seat, "Seat missing after cancellation");

        assert(
            seat.status === "AVAILABLE",
            `Expected AVAILABLE, received ${seat.status}`
        );

        return {
            detail:
                `${seat.coach_number}/${seat.seat_number}`
        };
    });
}

(async () => {
    try {
        await main();
    } catch (error) {
        console.error(`\nE2E stopped: ${error.message}`);
    } finally {
        console.log("\n============================");
        console.log(`PASSED: ${passed}`);
        console.log(`FAILED: ${failed}`);
        console.log(`TOTAL : ${passed + failed}`);

        if (failed > 0) {
            process.exitCode = 1;
        } else {
            console.log("\n✓ ALL E2E TESTS PASSED");
        }
    }
})();