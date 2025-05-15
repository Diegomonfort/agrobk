const express = require('express');
const {loginAdmin} = require('../controllers/Auth');

const router = express.Router();

router.post('/auth/login', loginAdmin);






module.exports = router;