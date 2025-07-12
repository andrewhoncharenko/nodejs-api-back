const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer");

const userRoutes = require("./routes/user");
const feedRoutes = require("./routes/feed");

const app = express();

const fileStorage = multer.diskStorage({
    destination: (request, response, cb) => {
        cb(null, "images");
    },
    filename: (request, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});

const fileFilter = (request, file, cb) => {
    if(file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg"){
        cb(null, true);
    }
    else {
        cb(null, false);
    }
};

app.use(bodyParser.json());
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single("image"));
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((request, response, next) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET, POST, PUT, PATCH, DELETE");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

app.use("/user", userRoutes)
app.use("/feed", feedRoutes);

app.use((error, request, response, next) => {
    const status = error.statusCod || 500;
    const message = error.message;

    console.log(error);

    response.status(status).json({message: message});
});

mongoose.connect("mongodb://localhost:27017/messages")
.then(() => {
    app.listen(8080);
})
.catch(error => {
    console.log(error);
});
