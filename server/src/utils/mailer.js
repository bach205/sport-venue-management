const nodemailer = require("nodemailer");

let transporter;

const getRequiredEnv = (key) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: getRequiredEnv("SMTP_USER"),
      pass: getRequiredEnv("SMTP_PASS"),
    },
  });

  return transporter;
};

const sendMail = async (mailOptions) => {
  const from = process.env.SMTP_FROM || getRequiredEnv("SMTP_USER");
  const mailer = getTransporter();

  return mailer.sendMail({
    from,
    ...mailOptions,
  });
};

module.exports = {
  sendMail,
};
