const express = require("express");
const { body } = require("express-validator");

const User = require("../models/user");
const authController = require("../controllers/auth");
const isAuth = require("../middleware/is-auth");


const router = express.Router();

router.put("/signup", [
    body("email").isEmail().withMessage("Please enter a valid email.")
    .custom((value, {req}) => {
        return User.findOne({email: value})
        .then(userData => {
            if(userData) {
                return Promise.reject("E-Mail address alredy exists");
            }
        });
    }).normalizeEmail(),
    body("password").trim().isLength({min: 5}),
    body("name").trim().not().isEmpty()
], authController.signup);
router.post("/login", authController.login);
router.get("/status", isAuth, authController.getUserStatus);
router.patch("/status", [body("status").not().isEmpty()] , isAuth, authController.updateUserStatus);

module.exports = router;