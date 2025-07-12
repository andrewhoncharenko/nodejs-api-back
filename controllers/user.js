exports.getStatus = (request, response, nenxt) => {
    response.status(200).json({
        status: "active"
    });
};