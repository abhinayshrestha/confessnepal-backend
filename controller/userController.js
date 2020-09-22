const User = require('../model/user');
const jwt = require('jsonwebtoken');
const Categories = require('../model/categories')

exports.sendToken = (req, res, next, id) => {
    const { name, profilePicURL } = req.body;
    const _id = id;
    User.findById({ _id : _id })
    .then(user => {
        const token = jwt.sign({ _id : _id }, 'secret_key', { expiresIn : '10h' });
        if(user){
           return res.status(200).json({
                message : 'User already exists',
                token : token
            })
        }
        const userModel = new User({
            _id : _id,
            name : name,
            profilePicURL : profilePicURL
        });
        return userModel.save()
            .then(_ => {
                res.status(200).json({
                    message : 'User created',
                    token : token
                })
        })
    })
    .catch(error => {
        res.status(500).json({
            error : error,
            message : 'Could\'t authenticate right now.'
        })
    })
}

exports.getCategories = (req, res, next) => {
     Categories.find()
      .then(doc => {
          res.status(200).json(doc)
      })
      .catch(err => {
          res.status(500).json({
              message : err.message
          })
      })
}

exports.getUSerInfo = (req, res, next) => {
    User.findById({ _id : req.userId })
       .then(user => {
           res.status(200).json(user);
       })
       .catch(err => {
           res.status(500).json({
               message : err.message
           })
       })
}