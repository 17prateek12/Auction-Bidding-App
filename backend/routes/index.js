const express = require('express');
const router = express.Router();

const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');
const eventRoutes=require('./eventRoutes')

router.use('/users', userRoutes); 
router.use('/auth', authRoutes); 
router.use('/event', eventRoutes); 

module.exports = router;
