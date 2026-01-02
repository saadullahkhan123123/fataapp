const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, message) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,  // Your Gmail
        pass: process.env.EMAIL_PASS,  // Gmail App Password (16 chars)
      },
    });

    const mailOptions = {
      from: `"FantaBeach Support" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>${subject}</h2>
          <p>${message}</p>
          <br/>
          <p style="font-size: 12px; color: #888;">
            This email was sent automatically from FantaBeach. Please do not reply.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully: ${info.response}`);
    return true;
  } catch (err) {
    console.error('❌ Email sending failed:', err.message);
    return false;
  }
};

module.exports = sendEmail;
