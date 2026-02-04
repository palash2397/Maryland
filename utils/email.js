import nodemailer from "nodemailer";
import hbs from "nodemailer-express-handlebars";

import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

var transporter = nodemailer.createTransport({
  // service: 'gmail',
  host: "smtp.gmail.com",
  port: 587,
  // secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const handlebarOptions = {
  viewEngine: {
    extName: ".handlebars",
    partialsDir: join(__dirname, "../view/"),
    layoutsDir: join(__dirname, "../view/"),
    defaultLayout: false,
  },
  viewPath: join(__dirname, "../view/"),
  extName: ".handlebars",
};

transporter.use("compile", hbs(handlebarOptions));

export const sendVerificationMail = async function (name, to, actToken, route) {
  console.log("email", process.env.SMTP_USER);
  console.log("email", process.env.SMTP_PASS);
  let mailOptions = {
    from: process.env.SMTP_USER, // sender address
    to: to,
    subject: "Account Verification",
    template: "verification",
    context: {
      name,
      href_url: `${process.env.BASE_URL}/${route}/verify-account/${actToken}`,
      msg: `Please click below link to activate your account.`,
      year: new Date().getFullYear(),
      companyName: "MathAdventure.com",
    },
  };

  // Send email using transporter
  transporter.sendMail(mailOptions, function (err, info) {
    if (err) {
      // If error occurs while sending email
      console.log("Error -" + err); // Log the error
    } else {
      // If email sent successfully
      console.log("Email sent successfully", info.response); // Log the success message with email response info
    }
  });
};

export const sendForgotPasswordMail = async function (
  name,
  to,
  actToken,
  route,
) {
  let mailOptions = {
    from: process.env.SMTP_USER, // sender address
    to: to,
    subject: "Forgot Password",
    template: "forgotPassword",
    context: {
      name,
      href_url: `${process.env.BASE_URL}/${route}/verify-password/${actToken}`,
      msg: `Please click below link to activate your account.`,
      year: new Date().getFullYear(),
      companyName: "MathAdventure.com",
    },
  };

  // Send email using transporter
  transporter.sendMail(mailOptions, function (err, info) {
    if (err) {
      // If error occurs while sending email
      console.log("Error -" + err); // Log the error
    } else {
      // If email sent successfully
      console.log("Email sent successfully", info.response); // Log the success message with email response info
    }
  });
};

export const sendContactUsMail = async function (name, to, message) {
  let mailOptions = {
    from: to, // sender address
    to: `ustad840@yopmail.com`,
    subject: "Contact Us",
    template: "contactUs",
    context: {
      name,
      message,
      userEmail: to,
      year: new Date().getFullYear(),
      companyName: "MathAdventure.com",
    },
  };

  // Send email using transporter
  transporter.sendMail(mailOptions, function (err, info) {
    if (err) {
      // If error occurs while sending email
      console.log("Error -" + err); // Log the error
    } else {
      // If email sent successfully
      console.log("Email sent successfully", info.response); // Log the success message with email response info
    }
  });
};

// export const sendOtpforgotPasswordMail = async function ( otp, to) {
//     let mailOptions = {
//         from: process.env.SMTP_USER, // sender address
//         to: to,
//         subject: "Password Reset OTP",
//         template: "password",
//         context: {
//             otp
//         },
//     };

//     // Send email using transporter
//     transporter.sendMail(mailOptions, function (err, info) {
//         if (err) { // If error occurs while sending email
//             console.log("Error -" + err); // Log the error
//         } else { // If email sent successfully
//             console.log("Email sent successfully", info.response); // Log the success message with email response info
//         }
//     });
// };

// export const sendContactUsMail = async function (name, msg, email) {
//     let mailOptions = {
//         from: email,
//         to: `adminn@yopmail.com`,
//         subject: "Contact us",
//         template: "contact",
//         context: {
//             name,
//             msg,
//             email
//         },
//     };

//     // Send email using transporter
//     transporter.sendMail(mailOptions, function (err, info) {
//         if (err) { // If error occurs while sending email
//             console.log("Error -" + err); // Log the error
//         } else { // If email sent successfully
//             console.log("Email sent successfully", info.response); // Log the success message with email response info
//         }
//     });
// };
