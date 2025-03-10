const express = require('express');
const RecibeInfoExpressCheckout = require('../controllers/ExpressCheckoutController');

const router = express.Router();

router.post('/payment', RecibeInfoExpressCheckout);





module.exports = router;