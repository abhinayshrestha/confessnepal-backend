const express = require('express');
const cors = require('cors');
const morgan = require('morgan')
const bodyParser = require('body-parser');
const authRoute = require('./routes/authRoute');
const postRoute = require('./routes/postRoute');
const userRoute = require('./routes/userRoute');
const mongoose = require('mongoose');

const app = express();

app.use(morgan('dev'))
app.use(cors());
app.use(bodyParser.json());

app.use('/auth', authRoute);
app.use('/post', postRoute);
app.use('/user', userRoute);

app.use((req, res, next) => {
    const error = new Error('Route not found.');
    error.status = 404;
    next(error);
})

app.use((error, req, res, next) => {
    res.status(error.status || 500)
        .json({
            message : error.message,
        })
})

mongoose.connect("mongodb://localhost:27017/confess-nepal", {useNewUrlParser: true, useUnifiedTopology: true},
    () => {
        mongoose.set('useFindAndModify', false);
        app.listen(8000,() => console.log(`Server is listening at 8000`));
    });
