const mongoose = require('mongoose');

const repliesSchema = mongoose.Schema({
    reply : { type : String, required : [true, 'Enter atleast a'] },
    mentioned : {
        type : Number,
        ref : 'User',
        required : [true, 'Mention a user first']
    },
    repliedBy : {
        type : Number,
        ref : 'User',
        required : [true, 'User is invalid']
    },
    createdAt : {
        type : Date,
        default : Date.now()
    },
    isMentionedPrivate : {
        type : Boolean,
        required : [true, 'Privacy not set']
    },
    isrepliedByPrivate : {
        type : Boolean,
        required : [true, 'Privacy not set']
    }
})

const commentSchema = mongoose.Schema({
    comment : { type : String, required : [true, 'Enter atleast a character'] },
    user : {
        type : Number,
        ref : 'User',
        required : [true, 'User id invalid']
    },
    isPrivate : {
        type : Boolean,
    },
    replies : [repliesSchema]
})

const postSchema = mongoose.Schema({
     content : {
         type : String,
         required : [true, 'Your post is empty.']
     },
     likes : [Number],
     shares : {
         type : Number,
         default : 0
     },
     comments : [commentSchema],
     user : {
         type : Number,
         ref : 'User',
         required : [true, 'User id invalid']
     },
     isPrivate : {
         type : Boolean,
         required : [true, 'Set privacy for this post.']
     },
     tags : {
         type : String,
         required : [true, 'Select a tag and then continue.']
     }
})

repliesSchema.set('timestamps', true); 
commentSchema.set('timestamps', true); 
postSchema.set('timestamps', true); 

postSchema.post('findOneAndUpdate', function(doc) {
    console.log(doc);
  });

module.exports = mongoose.model('Post', postSchema);