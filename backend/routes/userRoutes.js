const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');

const deleteAccount  = require('../controllers/userController').deleteAccount;

router.delete('/delete', authMiddleware,deleteAccount);

module.exports = router;
