const fs = require("fs");
const path = require("path");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const Post = require("../models/post");
const User = require("../models/user");

exports.getPosts = (request, response, next) => {
    const currentPage = request.query.page || 1;
    const perPage = 2;
    let totalItems;

    Post.find()
    .countDocuments()
    .then(count => {
        totalItems = count;
        return Post.find().populate("creator").skip((currentPage - 1) * perPage).limit(perPage);
    })
    .then(posts => {
        response.status(200).json({message: "Posts fetched succesfully", posts: posts, totalItems: totalItems});
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
    
    const post = new Post({title: title, imageUrl: imageUrl, content: content, creator: request.userId});
    let creator;

    post.save()
    .then(() => {
        return User.findById(request.userId);
    })
    .then(user => {
        creator = user;
        user.posts.push(post);
        return user.save();
    })
    .then(() => {
        response.status(201).json({
            message: "Post created sucessfully",
            post: post,
            creator: {_id: creator._id, name: creator.name}
        });
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};
exports.updatePost = (request, response, next) => {
    const postId = mongoose.Types.ObjectId.createFromHexString(request.params.postId);
    const errors = validationResult(request);

    if(!errors.isEmpty()) {
        const error = new Error("Validation failed, entered data is incorrect.");
        error.statusCode = 422;
        throw error;
    }

    const title = request.body.title;
    const content = request.body.content;
    let imageUrl = request.body.image;

    if(request.file) {
        imageUrl = request.file.path;
    }
    if(!imageUrl) {
        const error = new Error("No file picked");
        error.statusCode = 422;
        throw error;
    }
    Post.findById(postId)
    .then(post => {
        if (!post) {
            const error = new Error('Could not find post.');
            error.statusCode = 404;
            throw error;
        }
        if(post.creator.toString() !== request.userId) {
            const error = new Error("Not authorized");
            error.statusCode = 403;
            throw error;
        }
        if(imageUrl !== post.imageUrl) {
            clearImage(post.imageUrl);
        }
        post.title = title;
        post.imageUrl = imageUrl;
        post.content = content;
        return post.save();
    })
    .then(result => {
        response.status(200).json({message: "Post updated", post: result});
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};
exports.deletePost = (request, response, next) => {
    const postId = request.params.postId;

    Post.findById(postId).
    then(post => {
        if (!post) {
            const error = new Error('Could not find post.');
            error.statusCode = 404;
            throw error;
        }
        if(post.creator.toString() !== request.userId) {
            const error = new Error("Not authorized");
            error.statusCode = 403;
            throw error;
        }
        clearImage(post.imageUrl);
        return Post.findByIdAndDelete(postId);
    })
    .then(() => {
        return User.findById(request.userId);
    })
    .then(user => {
        user.posts.pull(postId);
        return user.save();
    })
    .then(() => {
        response.status(200).json({message: "Post deleted"});
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};

const clearImage = filePath => {
    filePath = path.join(__dirname, "..", filePath);
    fs.unlink(filePath, err => {
        console.log(err);
    });
};