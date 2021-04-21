const router = require('express').Router();

const {
    createProduct, 
    listProduct,
    listProductById,
    updateProduct,
    deleteProduct,
} = require('../controllers/productController');
//middleware
const {authAdmin,authUser} = require('../middleware/auth')

// Admin access
router.post('/create',authAdmin,createProduct);
router.delete('/:id',authAdmin,deleteProduct);
router.post('/:id',authAdmin,updateProduct);
router.post('/:id',authAdmin,updateProduct);

// User access
router.get('/get',listProduct);
router.get('/get/:id',listProductById);

module.exports = router