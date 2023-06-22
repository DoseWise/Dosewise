require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const fs = require("fs");
const session = require("express-session");
app.use(bodyParser.urlencoded({extended:true}));
// const reminderRoutes = require("./reminder");

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

let intervalId; // Store the interval ID for canceling

app.use(express.static("public"));
app.use(express.json());

mongoose.connect(process.env.CONN_STR, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(()=>{
    console.log("Connected to MongoDB");
})
.catch(()=>{
    console.log("Failed to connect MongoDB", err);
})

const dataSchema = new mongoose.Schema({
    // id: Number,
    username: String,
    email: String,
    password: String,
    medicine_name: String,
    pills: Number,
});

const User = mongoose.model("User", dataSchema);

app.get("/", (req,res)=>{
    res.sendFile(__dirname+"/index.html");
});

// About
app.get("/about", (req,res)=>{
  res.sendFile(__dirname + "/about.html");
});
// Blog
app.get("/blog", (req, res) => {
  res.sendFile(__dirname + "/blog.html");
});
// contact
app.get("/contact", (req, res) => {
  res.sendFile(__dirname + "/contact.html");
});
// register
app.post("/register", (req,res)=>{
    const {username, email, password} = req.body;
    const medicine_name = "";
    const pills = -1;
    const newUser = new User({username, email, password,medicine_name,pills});

    User.findOne({username}).then(user=>{
        if(user!=null && username == user.username){
            if(password == user.password){
                console.log("Already registered");
                res.send("Already registered try Login");
            }
            else{
                console.log("Wrong Password");
                res.send("Wrong Password<br><a href='/updatepass'>Forget Password</a>");
            }
        }
        else{
            newUser
              .save()
              .then(() => {
                console.log("Registration Successful");
                res.sendFile(__dirname + "/service.html");
              })
              .catch((err) => {
                console.log("Failed to register user", err);
                res.send("Failed to register user");
              });
        }
    });
});

// Login
app.get("/login", (req,res)=>{
    res.sendFile(__dirname + "/login.html")
})
app.post("/login", (req,res)=>{
    const {username, password} = req.body;

    User.findOne({username, password}).then((user)=>{
        if(user){
            console.log("Login successful");
            res.sendFile(__dirname + "/service.html");
            
        }
        else{
            console.log("Failed to login");
            res.send("Failed to logins");
        }
    }).catch(err =>{
        console.log('Error during login', err);
        res.send("Error during login", err);
    })
})

// forget password
app.get("/updatepass", (req,res)=>{
    res.send(`<form action='/updatepass' method='post' style="background-color:#526D82; color: #fff; margin:0 auto;">
    <input type="text" name="username" placeholder="Enter username" required/>
    <input type='password' name='newPassword' placeholder='Enter New Password' required/>
    <button type='submit'>Update</button>
    </form>`);
});
app.post("/updatepass", (req,res)=>{
    const {username,newPassword} = req.body;
    User.findOneAndUpdate(
      { username },
      { $set: {password: newPassword } },
      { new: true }
    )
      .then(result => {
        if (result) {
          console.log("Password Updated");
          res.sendFile(__dirname + "/index.html");
        } else {
          console.log("Invalid username");
          res.send("Invalid username");
        }
      })
      .catch((err) => {
        console.log("Password update failed ", err);
        res.send("Password update failed ", err);
      }); 
});

// service
app.get("/service", (req, res) => {
  res.sendFile(__dirname + "/service.html");
});
// service1
app.get("/service1", (req,res)=>{
    res.sendFile(__dirname+ "/service1.html");
});
app.post("/service1", (req,res)=>{
    const url = "https://www.1mg.com/search/all?name="+req.body.drug; 
    res.redirect(url);
});

// service2
app.get("/service2", (req, res) => {
  res.sendFile(__dirname + "/service2.html");
});
app.post("/send-email", (req, res) => {
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

    res.send(`Email sending started successfully.<br> <a href="/cancel-email">Cancel Email</a>`
    );
  });
});
app.get("/cancel-email", (req,res)=>{
  res.sendFile(__dirname + "/cancelEmail.html");
})
app.post("/cancel-email", async (req, res) => {
  if (intervalId) {
    clearInterval(intervalId);
    // ----------------------
    // const username = "Gaurav";
    // var pillsCount = 0;
   try {
      const username = req.body.username; // Assuming the client sends the username in the request body

     // Find the user by username
     const user = await User.findOne({ username });
     if (!user) {
       return res.status(404).send("User not found.<br><a href='/'>🏠Home</a>");
     }

     // Decrement the pills value by 1
     user.pills -= 1;

     // Check if pills are over
     if (user.pills <= 0) {
       user.pills = 0;
       console.log("Pills over");
       return res.send(`<div style="background-color:#526D82; color: #fff; margin:0 auto;">
       Pills Over.<br><a href='/'>🏠Home</a>
       </div>`);
     }

     // Save the updated user
     await user.save();

     // Send the updated user back as the response
     console.log(user);
    //  res.send("Stock updated.<br><a href='/'>🏠Home</a>");
   } catch (error) {
     console.error("Error processing cancel request:", error);
     res.status(500).send("An error occurred.<br><a href='/'>🏠Home</a>");
   }

    // ----------------------
    console.log("Email sending canceled.");
    res.send("Email sending canceled.<br><a href='/'>🏠Home</a>");
  } else {
    console.log("No scheduled email to cancel.");
    res.send("No scheduled email to cancel.<br><a href='/'>🏠Home</a>");
  }
});

function sendEmailWithinRange(mailOptions, transporter, startDate, endDate) {
  const currentTime = new Date();
  const interval = 1000 * 60; // Interval in milliseconds (1 minute)

  if (currentTime < startDate) {
    // Wait until the start date and then send the email
    setTimeout(() => {
      sendEmail(transporter, mailOptions, endDate, interval);
    }, startDate - currentTime);
  } else {
    // Start sending the email immediately
    sendEmail(transporter, mailOptions, endDate, interval);
  }

  // Return the interval ID for canceling
  return setInterval(() => {
    sendEmail(transporter, mailOptions, endDate, interval);
  }, interval);
}

function sendEmail(transporter, mailOptions, endDate, interval) {
  const currentTime = new Date();
  if (currentTime < endDate) {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Error occurred:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });
  } else {
    clearInterval(intervalId);
    console.log("Email sending completed.");
  }
}

// service3
app.get("/service3", (req,res)=>{
    res.sendFile(__dirname + "/service3.html");
});
app.post("/stock",(req,res)=>{
    const {username, mname, mnum} = req.body;
    User.findOneAndUpdate(
      { username },
      { $set: { medicine_name: mname, pills: mnum } },
      { new: true }
    )
      .then((result) => {
        if (result) {
          console.log("Stock data saved");
          res.sendFile(__dirname + "/index.html");
        } else {
          console.log("Invalid id");
          res.send("Invalid id");
        }
      })
      .catch((err) => {
        console.log("Failed to save stock data", err);
        res.send("Failed to save stock data<br><a href='/'>🏠Home</a>");
      }); 
});

app.listen(process.env.PORT,() => {
    console.log("Connected to port 8000");
});