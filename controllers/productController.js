const User = require('../models/usersModel');
const Product = require('../models/productsModel');
const { uploadFile, deleteFile, updateFile } = require('../helper/fileUploadDelete');

/**
 * @desc        Create Product 
 * @Endpoint    Post @/api/product/create
 * @access      Admin
 */
const createProduct = async(req,res)=>{
    try {
        const {
            name,
            image,
            description,
            price,
        } = req.body;

        if(!name || !description || !price) throw "Provide required fields!";

        // uploading image if exists
        let filenameToStore ='';
        if (req.files) {
            filenameToStore=uploadFile(req,'product_image');
        }
        // store data in DB
        const newProduct = await new Product({
            name,
            image: filenameToStore !='' ? filenameToStore :'',
            description,
            price,
            uploaded_by: req.user
        });

        const savedProduct = await newProduct.save(newProduct);

        if (!savedProduct) {
            throw "Some error occured during creating product...";
        }

        return res.status(200).json({'message':'Product created successfully!'});


    } catch (error) {
        return res.status(500).json({'errormessage':`Error createProduct ${error}`});
    }
}

/**
 * @desc        list Product 
 * @Endpoint    GET @/api/product/get
 * @access      User
 */
 const listProduct = async(req,res)=>{
    try {
        const product = await Product.find();

        if (!product) {
            return res.status(200).json({'message':'No product available!'});
        }

        return res.status(200).json({'products':product});

    } catch (error) {
        return res.status(500).json({'errormessage':`Error listProduct ${error}`});
    }
}

/**
 * @desc        list Product by Id
 * @Endpoint    GET @/api/product/get/{:id}
 * @access      User
 */
 const listProductById = async(req,res)=>{
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(200).json({'message':'No product available!'});
        }

        return res.status(200).json({'products':product});

    } catch (error) {
        return res.status(500).json({'errormessage':`Error listProduct ${error}`});
    }
}

/**
 * @desc        Update Product 
 * @Endpoint    Post @/api/product/{:id}
 * @access      Admin
 */
const updateProduct = async(req,res)=>{
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            res.status(200).json({'errormessage':'Product not found with this Id!'});
        }
        const {
            name,
            description,
            price,
        } = req.body;

        if(!name && !description && !price && !req.files && !price) res.status(404).json({'message':"Provide one or more fields to update..!"});

        // uploading image if exists
        let filenameToStore ='';
        if (req.files) {
            filenameToStore=updateFile(req,'product_image',product.image);
        }
        // store data in DB
        
            product.name = name || product.name;
            product.image = filenameToStore !='' ? filenameToStore : product.image;
            product.description = description || product.description;
            product.price = price || product.price;
            product.uploaded_by= req.user || product.uploaded_by;

            const isSaved = product.save()

            if (!isSaved) {
                res.status(404).json({'errormessage':'Operation failed!'});
            }

        return res.status(200).json({'message':'Product Updated successfully!'});


    } catch (error) {
        return res.status(500).json({'errormessage':`Error updateProduct ${error}`});
    }
}

/**
 * @desc        delete Product 
 * @Endpoint    DELETE @/api/product/{:id}
 * @access      Admin
 */
const deleteProduct = async(req,res)=>{
    try {
        const productId = req.params.id;
        const product = await Product.findById({_id:productId})
        if(!product) throw 'Id not exist!'
        
        // delete data from DB
        const del = await Product.findByIdAndDelete({_id:productId});
        if (!del) throw 'Delete Operation failed!';

        // deleting image if exists
        if (product.image !=null ||'' || "") {
                deleteFile('product_image',product.image); // folder_name, image_name
        }

        return res.status(200).json({'message':'Product deleted successfully!'});

    } catch (error) {
        return res.status(500).json({'errormessage':`Error deleteProduct ${error}`});
    }
}


module.exports = {
    createProduct, 
    listProduct,
    listProductById,
    updateProduct,
    deleteProduct,
}