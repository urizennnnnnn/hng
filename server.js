require('dotenv').config();
const { StatusCodes } = require('http-status-codes');
require('express-async-errors');
const path = require('path')
const express = require('express');
const app = express();
const routes = require('./routes/routes');
const fileupload = require('express-fileupload');
const morgan = require('morgan')
const cors = require('cors')
const { Deepgram } = require("@deepgram/sdk");
const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);


app.use(express.json());
app.use(morgan('dev'))
app.use(express.static('./server'))
app.use(cors())

// middleware
app.use(fileupload());
//  routes
app.use('/api/hng', routes);

// Error handling middleware
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');
// app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);



const port = process.env.PORT || 3000;

(async () => {
    try {

        app.listen(port, () =>
            console.log(`Server is listening on port ${port}...`)
        );
    } catch (error) {
        console.log(error);
    }
})();