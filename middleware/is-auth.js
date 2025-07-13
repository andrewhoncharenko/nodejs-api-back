const jwt = require("jsonwebtoken");

module.exports = (request, response, next) => {
    const authHeader = request.get("Authorization");
    
    if(!authHeader) {
        const error = new Error("Not authenticated.");
        error.statusCode = 401;
        throw error;
    }

    const token = authHeader.split(' ');
    let decodedToken;

    try {
        decodedToken = jwt.verify(token[1], "supersecret");
    }
    catch(err) {
        err.statusCode = 500;
        throw err;
    }
    if(!decodedToken) {
        const error = new Error("Not authenticated.");
        error.statusCode = 401;
        throw error;
    }
    request.userId = decodedToken.userId;
    next();
};