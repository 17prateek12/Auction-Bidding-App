const express = require('express');
const authController = require('../controllers/authController');
const eventController=require("../controllers/eventController")

const router = express.Router();

router.post('/register', authController.registerUser);

router.post('/login', authController.loginUser);

router.post('/logout', authController.logoutUser);


// Password Reset to be done..

module.exports = router;
