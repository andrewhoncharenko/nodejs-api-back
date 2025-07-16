const jwt = require("jsonwebtoken");

module.exports = (request, response, next) => {
    const authHeader = request.get("Authorization");
    
    if(!authHeader) {
        request.isAuth = false;
        return next();
    }

    const token = authHeader.split(' ');
    let decodedToken;

    try {
        decodedToken = jwt.verify(token[1], "supersecret");
    }
    catch(err) {
        request.isAuth = false;
        return next();
    }
    if(!decodedToken) {
        reqiest.isAuth = false;
        return next();
    }
    request.userId = decodedToken.userId;
    request.isAuth = true;
    next();
};