const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const Post = require("../models/post");

exports.getPosts = (request, response, next) => {
    Post.find().
    then(posts => {
        response.status(200).json({message: "Posts fetched succesfully", posts: posts});
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};
exports.getPost = (request, response, next) => {
    const postId = mongoose.Types.ObjectId.createFromHexString(request.params.postId);

    Post.findById(postId)
    .then(post => {
        if(!post) {
            const error = new Error("Could not find post");
            error.statusCode = 404;
            throw error;
        }
        console.log(post);
        response.status(200).json({message: "Post fetched", post: post});
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};
exports.createPost = (request, response, next) => {
    const errors = validationResult(request);

    if(!errors.isEmpty()) {
        const error = new Error("Validation failed, entered data is incorrect.");
        error.statusCode = 422;
        throw error;
    }
    if(!request.file) {
        const error = new Error("No image provided");
        error.statusCode = 422;
        throw error;
    }

    const title = request.body.title;
    const imageUrl = request.file.path;
    const content = request.body.content;
    
    const post = new Post({title: title, imageUrl: imageUrl, content: content, creator: {name: "Andrew"}});

    post.save()
    .then(result => {
        response.status(201).json({
            message: "Post created sucessfully",
            post: result
        });
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(error);
    });
};