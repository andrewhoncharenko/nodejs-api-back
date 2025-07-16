const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const Post = require("../models/post");
const { clearImage } = require("../util/file");

module.exports = {
    createUser: function({ userInput }, request) {
        const errors = [];

        if(!validator.isEmail(userInput.email)) {
            errors.push({message: "E-Mail is invalid."});
        }
        if(validator.isEmpty(userInput.password) || !validator.isLength(userInput.password, { min: 5 })) {
            errors.push("Password too short.");
        }
        if(errors.length) {
            const error = new Error("Invalid input.");
            error.data = errors;
            error.code = 422;
            throw error;
        }
        return User.findOne({email: userInput.email})
        .then(user => {
            if(user) {
                const error = new Error("User exists already");
                throw error;
            }
            return bcrypt.hash(userInput.password, 12);
        })
        .then(hash => {
            const user = new User({ email: userInput.email, name: userInput.name, password: hash });
            return user.save();
        })
        .then(createdUser => {
            return { ...createdUser._doc, _id: createdUser._id.toString() };
        });
    },
    login: function({email, password}, request) {
        const error = new Error("E-Mail or password is incoreect.");
        error.code = 401;
        let userData;

        return User.findOne({email: email})
        .then(user => {
            if(!user) {
                throw error;
            }
            userData = user;
            return bcrypt.compare(password, user.password);
        })
        .then(isEqual => {
            if(!isEqual) {
                throw error;
            }
            const token = jwt.sign({
                userId: userData._id.toString(),
                email: userData.email
            },
            "supersecret",
            {expiresIn: "1h"});
            return { token: token, userId: userData._id.toString() };
        });
    },
    createPost: function({postInput}, request) {
        const errors = [];
        let userData;
        let post;

        if(!request.isAuth) {
            const error = new Error("Not authenticated");
            error.code = 401;
            throw error;
        }
        if(validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, {min: 5})) {
            errors.push("Title is invalid");
        }
        if(validator.isEmpty(postInput.content) || !validator.isLength(postInput.content, {min: 5})) {
            errors.push("Content is invalid");
        }
        if(errors.length) {
            const error = new Error("Invalid input.");
            error.data = errors;
            error.code = 422;
            throw error;
        }
        return User.findById(request.userId)
        .then(user => {
            if(!user) {
                const error = new Error("Invalid user");
                error.code = 401;
                throw error;
            }
            userData = user;
            const post = new Post({title: postInput.title, content: postInput.content, imageUrl: postInput.imageUrl, creator: user});
            return post.save();
        })
        .then(createdPost => {
            post = createdPost;
            userData.posts.push(createdPost);
            return userData.save();
        })
        .then(() => {
            return {
                ...post._doc, _id: post._id.toString(),
                createdAt: post.createdAt.toISOString(),
                updatedAt: post.updatedAt.toISOString()
            };
        });
    },
    updatePost: function({id, postInput}, request) {
        if(!request.isAuth) {
            const error = new Error("Not authenticated");
            error.code = 401;
            throw error;
        }
        return Post.findById(id).populate("creator")
        .then(post => {
            const errors = [];

            if(!post) {
                const error = new Error("No post found");
                error.code = 404;
                throw error;
            }
            if(post.creator._id.toString() !== request.userId) {
                const error = new Error("Not authorized");
                error.code = 403;
                throw error;
            }
            if(validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, {min: 5})) {
                errors.push("Title is invalid");
            }
            if(validator.isEmpty(postInput.content) || !validator.isLength(postInput.content, {min: 5})) {
                errors.push("Content is invalid");
            }
            if(errors.length) {
                const error = new Error("Invalid input.");
                error.data = errors;
                error.code = 422;
                throw error;
            }
            post.title = postInput.title;
            post.content = postInput.content;
            if(postInput.imageUrl !== "undefined") {
                post.imageUrl = postInput.imageUrl;
            }
            return post.save();
        })
        .then(post => {
            return {
                ...post._doc,
                _id: post._id.toString(),
                createdAt: post.createdAt.toISOString(),
                updatedAt: post.updatedAt.toISOString()
            };
        });
    },
    deletePost: function({id}, request) {
        if(!request.isAuth) {
            const error = new Error("Not authenticated");
            error.code = 401;
            throw error;
        }

        return Post.findById(id)
        .then(post => {
            const errors = [];

            if(!post) {
                const error = new Error("No post found");
                error.code = 404;
                throw error;
            }
            if(post.creator.toString() !== request.userId) {
                const error = new Error("Not authorized");
                error.code = 403;
                throw error;
            }
            clearImage(post.imageUrl);

            return Post.findByIdAndDelete(id);
        })
        .then(() => {
            return User.findById(request.userId);
        })
        .then(user => {
            user.posts.pull(id);

            return user.save();
        })
        .then(() => {
            return true;
        });
    },
    updateStatus: function({status}, request) {
        if(!request.isAuth) {
            const error = new Error("Not authenticated");
            error.code = 401;
            throw error;
        }
        return User.findById(request.userId)
        .then(user => {
            if(!user) {
                const error = new Error("No user found");
                error.code = 404;
                throw error;
            }
            user.status = status;
            return user.save();
        })
        .then(user => {
            return { ...user._doc, _id: user._id.toString() };
        });
    },
    posts: function({page}, request) {
        const perPage = 2;
        if(!request.isAuth) {
            const error = new Error("Not authenticated");
            error.code = 401;
            throw error;
        }
        if(!page) {
            page = 1;
        }

        return Post.find().countDocuments()
        .then(totalPosts => {
            return Post.find().skip((page - 1) * perPage).limit(2).sort({createdAt: -1}).populate("creator")
            .then(posts => {
                return {
                    posts: posts.map(p => {
                        return { ...p._doc, _id: p._id.toString(), createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() };
                    }),
                    totalPosts: totalPosts
                };
            });
        });
    },
    post: function({id}, request) {
        if(!request.isAuth) {
            const error = new Error("Not authenticated");
            error.code = 401;
            throw error;
        }
        return Post.findById(id).populate("creator")
        .then(post => {
            if(!post) {
                const error = new Error("No post found");
                error.code = 404;
                throw error;
            }
            return {...post._doc, _id: post._id.toString(), createdAt: post.createdAt.toISOString(), updatedAt: post.updatedAt.toISOString()};
        })
    },
    user: function(args, request) {
        if(!request.isAuth) {
            const error = new Error("Not authenticated!");
            error.code = 401;
            throw error;
        }
        return User.findById(request.userId)
        .then(user => {
            if(!user) {
                const error = new Error("No user found!");
                error.code = 404;
                throw error;
            }
            return {...user._doc, _id: user._id.toString()};
        });
    }
}