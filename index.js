const express = require ('express')
const cors = require('cors')
const cookiesParser = require('cookie-parser');
const upload = require('express-fileupload');


// Import routers
const usersRouter = require('./routes/usersRoutes.js');
const productRouter = require('./routes/productsRouters');


//DB connection
const connectDB = require('./config/db');
connectDB();

const app = express();
app.use(express.json());
app.use(cookiesParser());
app.use(upload());          // for multipart data type
app.use(express.static('public'));

// Path
app.use('/api/user',usersRouter);
app.use('/api/product',productRouter);

app.use('/',(req,res)=>{res.status(404).json({'errormessage':'Page not found!'})})

const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>console.log(`Server is running on ${PORT}`));