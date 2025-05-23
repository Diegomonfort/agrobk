const express = require('express');
const {getProducts, getProductsDestacados, getProductById, createProduct, updateProduct, deleteProduct, updateDiscount} = require('../controllers/productos');
const multer = require('multer');
const upload = multer();

const router = express.Router();

router.get('/products', getProducts);
router.get('/destacados', getProductsDestacados);
router.get('/products/:id', getProductById);
router.post('/products', createProduct);
router.patch('/products/:id', upload.single('Imagen'), updateProduct);
router.patch('/products-offer/:id', updateDiscount);
router.delete('/products/:id', deleteProduct);





module.exports = router;