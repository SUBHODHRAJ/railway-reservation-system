const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const sendOTP = async (email, otp) => {
    await transporter.sendMail({
        from: `"Train Reservation" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Verify your email",
        text:
            `Your Train Reservation verification code is ${otp}. ` +
            `It expires in 10 minutes.`
    });
};

module.exports = {
    sendOTP
};