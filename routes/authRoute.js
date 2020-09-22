const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');

router.post('/facebook', authController.facebookAuth);

module.exports = router;

