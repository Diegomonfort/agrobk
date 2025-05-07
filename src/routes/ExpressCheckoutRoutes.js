const express = require('express');
const {RecibeInfoExpressCheckout, updateTransaction, sendEmail, ConsultaEstadoTransaccion, Webhook} = require('../controllers/ExpressCheckoutController');

const router = express.Router();

router.post('/payment', RecibeInfoExpressCheckout);
router.post('/update-tran', updateTransaction);
router.get('/send-email', sendEmail);
router.post('/verify-payment', ConsultaEstadoTransaccion);
router.post('/webhook', Webhook);







module.exports = router;