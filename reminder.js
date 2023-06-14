const express = require("express");
const nodemailer = require("nodemailer");
const fs = require("fs");
const app = express();
const router = express.Router();
require("dotenv").config();

let intervalId; // Store the interval ID for canceling

router.get("/service2", (req, res) => {
  res.sendFile(__dirname + "/service2.html");
});

router.post("/send-email", (req, res) => {
  const { email, start, starttime, end, endtime } = req.body;

  // Validate date and time inputs
  const startDate = new Date(start + "T" + starttime);
  const endDate = new Date(end + "T" + endtime);
  const currentTime = new Date();

  if (startDate > endDate || currentTime > endDate) {
    res.send("Invalid date and time inputs.");
    return;
  }

  // Configure the transporter with your Gmail account
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.Mail,
      pass: process.env.Pass,
    },
  });

  // Read the HTML file
  fs.readFile("email.html", "utf8", (error, html) => {
    if (error) {
      console.log("Error occurred while reading the HTML file:", error);
      res.send("Error occurred while sending the email.");
      return;
    }

    const mailOptions = {
      from: process.env.Mail,
      to: email,
      subject: "Hello from Node.js",
      html: html,
    };

    // Start sending the emails
    intervalId = sendEmailWithinRange(
      mailOptions,
      transporter,
      startDate,
      endDate
    );

    res.send(
      "Email sending started successfully.<a href='/cancel-email'>cancel</a>"
    );
  });
});

// router.get("/cancel-email", (req, res) => {
//   if (intervalId) {
//     clearInterval(intervalId);
//     // ----------------------
//     const username = "Gaurav";
//     User.findOneAndUpdate(
//       { username },
//       { $set: {pills: mnum - 1 } },
//       { new: true }
//     )
//       .then((result) => {
//         if (result) {
//           console.log("Stock data updated");
//           // res.sendFile(__dirname + "/index.html");
//         } else {
//           console.log("Invalid username");
//           res.send("Invalid Username.<br><a href='/'>🏠Home</a>");
//         }
//       })
//       .catch((err) => {
//         console.log("Failed to update stock data", err);
//         res.send("Failed to update stock data<br><a href='/'>🏠Home</a>");
//       }); 
//     // ----------------------
//     console.log("Email sending canceled.");
//     res.send("Email sending canceled.<br><a href='/'>🏠Home</a>");
//   } else {
//     console.log("No scheduled email to cancel.");
//     res.send("No scheduled email to cancel.<br><a href='/'>🏠Home</a>");
//   }
// });

// function sendEmailWithinRange(mailOptions, transporter, startDate, endDate) {
//   const currentTime = new Date();
//   const interval = 1000 * 60; // Interval in milliseconds (1 minute)

//   if (currentTime < startDate) {
//     // Wait until the start date and then send the email
//     setTimeout(() => {
//       sendEmail(transporter, mailOptions, endDate, interval);
//     }, startDate - currentTime);
//   } else {
//     // Start sending the email immediately
//     sendEmail(transporter, mailOptions, endDate, interval);
//   }

//   // Return the interval ID for canceling
//   return setInterval(() => {
//     sendEmail(transporter, mailOptions, endDate, interval);
//   }, interval);
// }

// function sendEmail(transporter, mailOptions, endDate, interval) {
//   const currentTime = new Date();
//   if (currentTime < endDate) {
//     transporter.sendMail(mailOptions, (error, info) => {
//       if (error) {
//         console.log("Error occurred:", error);
//       } else {
//         console.log("Email sent:", info.response);
//       }
//     });
//   } else {
//     clearInterval(intervalId);
//     console.log("Email sending completed.");
//   }
// }

// module.exports = router, intervalId;;
