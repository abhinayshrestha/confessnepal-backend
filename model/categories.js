const mongoose = require('mongoose')

const categoriesSchema = mongoose.Schema({
    label : String,
    link : String
})

module.exports = mongoose.model('categories', categoriesSchema);