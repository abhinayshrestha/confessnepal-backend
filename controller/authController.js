const { sendToken } = require('./userController')
const axios = require('axios');

exports.facebookAuth = (req, res, next) => {
    const accessToken = req.header('authorization').split(" ")[1];
    const config = {
        method: 'get',
        url: `https://graph.facebook.com/me?access_token=${accessToken}`,
        headers: { }
      };
      
      axios(config)
      .then(function (response) {
         if(response.data.id) {
            sendToken(req, res, next, response.data.id);
         }  
         else {
            res.status(400).json({message : 'Token expired please login to continue.'});
         }
      })
      .catch(function (error) {
        res.status(400).json({
            message : error.message
        });
      });
}