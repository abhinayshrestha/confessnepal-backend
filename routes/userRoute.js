const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const authCheck = require('../utils/authCheck')

router.get('/', authCheck, userController.getUSerInfo);
router.get('/categories', authCheck, userController.getCategories);

module.exports = router;