const sgMail = require("../config/mail");

const sendMagicEmail = async (
  email,
  magicLink
) => {
  return await sgMail.send({
    to: email,

    from: process.env.EMAIL_FROM,

    subject: "Login to GHM",

    html: `
      <div style="font-family:sans-serif">
        <h2>Login to GHM</h2>

        <p>Click below to login:</p>

        <a 
          href="${magicLink}"
          style="
            background:black;
            color:white;
            padding:12px 20px;
            text-decoration:none;
            border-radius:8px;
            display:inline-block;
          "
        >
          Login Now
        </a>

        <p>This link expires in 15 minutes.</p>
      </div>
    `,
  });
};

module.exports = sendMagicEmail;