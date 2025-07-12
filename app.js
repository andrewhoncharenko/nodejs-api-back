const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const userRoutes = require("./routes/user");
const feedRoutes = require("./routes/feed");

const app = express();

app.use(bodyParser.json());

app.use((request, response, next) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET, POST, PUT, PATCH, DELETE");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

app.use("/user", userRoutes)
app.use("/feed", feedRoutes);

mongoose.connect("mongodb://localhost:27017/messages")
.then(() => {
    app.listen(8080);
})
.catch(error => {
    console.log(error);
});
