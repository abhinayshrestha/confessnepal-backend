const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const token = req.header('authorization');
        if(!token) {
            throw new Error('Authentication failed. Please login to continue.')
        }
        const decode = jwt.verify(token.split(" ")[1], 'secret_key');
        req.userId = decode._id;
        next();
    }
    catch (error) {
        res.status(401).json({
            message : error.message
        })
    }
}