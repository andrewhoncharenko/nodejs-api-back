const fs = require("fs");
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer");
const { graphqlHTTP } = require("express-graphql");

const auth = require("./middleware/auth");
const schema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolvers");
const { clearImage } = require("./util/file");

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
    if(request.method === "OPTIONS") {
        return response.status(200).json({message: "Success"});
    }
    next();
});
app.use(auth);
app.put("/post-image", (request, response, next) => {
    if(!request.file) {
        return response.status(200).json({ message: "No file provided"});
    }
    if(request.body.oldPath) {
        clearImage(request.body.oldPath);
    }
    response.status(201).json({message: "File storad.", filePath: request.file.path});
});
app.use("/graphql", graphqlHTTP({
    schema: schema,
    rootValue: graphqlResolver,
    graphiql: true,
    customFormatErrorFn(err) {
        if(!err.originalError) {
            return err;
        }
        const data = err.originalError.data;
        const message = err.message || "An error occurred."
        const code = err.originalError.code || 500;
        return { message: message, status: code, data: data };
    }
}));
app.use((error, request, response, next) => {
    const status = error.statusCode || 500;
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
