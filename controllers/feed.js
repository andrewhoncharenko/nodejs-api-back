const { validationResult } = require("express-validator");

const Post = require("../models/post");

exports.getPosts = (request, response, next) => {
    response.status(200).json({
        posts: [{
            _id: 1,
            title: "First post",
            content: "This is the first post",
            imageUrl: "images/duck.jpeg",
            creator: {
                name: "Andrew"
            },
            createdAt: new Date()
        }],
        totalItems: 1
    });
};
exports.createPost = (request, response, next) => {
    const title = request.body.title;
    const content = request.body.content;
    const errors = validationResult(request);

    if(!errors.isEmpty()) {
        return response.status(422).json({
            message: "Validation failed, entered data is incorrect.",
            errors: errors.array()
        });
    }
    const post = new Post({title: title, imageUrl: "images/duck.jpeg", content: content, creator: {name: "Andrew"}});

    post.save()
    .then(result => {
        response.status(201).json({
            message: "Post created sucessfully",
            post: result
        });
    })
    .catch(error => { console.log(error); });
};