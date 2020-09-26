const Post = require('../model/post');
const mongoose = require('mongoose')
const User = require('../model/user')

exports.postConfession = (req, res, next) => {
    const userId = req.userId;
    const { content, isPrivate, tags } = req.body;
    const postSchema = new Post({
        user : userId,
        content : content,
        isPrivate : isPrivate,
        tags : tags
    });
    postSchema.save()
       .then(doc => {
           res.status(200).json(doc);
       })
       .catch(err => {
        res.status(500).json({
            message : err.message
        })
    })
}

exports.getConfession = (req, res, next) => {
    const { page } = req.params;
    const userId = req.userId;
    Post.aggregate([
            {
                $project : {
                    likesCount : { $size : "$likes" },
                    shares : 1,
                    createdAt : 1,
                    content : 1, 
                    commentsCount : { $size : "$comments" },
                    isPrivate : 1,
                    user : 1,
                    timeStamp : 1,
                    tags : 1,
                    liked : {
                       $in : [Number(userId), "$likes"]
                    }
                }
            },
            { $sort : { createdAt : -1 } },
            { $skip : page * 5 },
            { $limit : 5 }
        ])
        .then(doc => {
           return Post.populate(doc, { path : 'user', select : { name : 1, profilePicURL : 1 } })
                  .then(confess => {
                    const post = confess.map(confess => {
                        if(confess.isPrivate){
                           confess.user = {
                                _id : confess.user._id,
                                name : 'Anonymous'
                           };
                           return confess;    
                        }
                        return confess;
                    })  
                    res.status(200).json(post);
                  })
        })
        .catch(err => {
            res.status(500).json({
                message : err.message
            })
        })
}

exports.postComments = (req, res, next) => {
   const { postId, comment } = req.body;
   const userId = req.userId
   Post.findById({ _id : postId })
       .then(doc => {
           if(doc){
                doc.comments.push({ user : userId, comment : comment, isPrivate : doc.isPrivate && (Number(userId) === doc.user) ? true : false});
                return doc.save()
                    .then(comment => {
                       if(Number(userId) === doc.user){
                            res.status(200).json({ 
                                comment : comment.comments[comment.comments.length - 1]
                            });
                       } 
                       else {
                            setNotification(doc.user, comment)
                       }
                    })
                }
           let error = new Error('This post has been removed for some issues.');
           error.status = 500;
           next(error);     
       })  
       .catch(err => {
           res.status(500).json({
               message : err.message
           })
       })
    const setNotification = (createdBy,comments) => {
       return User.findByIdAndUpdate({ _id : createdBy }, { $inc : { "notifications.count" : 1 } })
           .then(doc => {
                if(doc){
                    doc.notifications.desc.push({ comment : true, user : userId, postId : postId });
                    return doc.save()
                        .then(_ => {
                            res.status(200).json({ 
                                comment : comments.comments[comments.comments.length - 1]
                            });
                        })
                }
                let error = new Error('This comment has been removed for some issues.');
                error.status = 500;
                next(error);  
           })
           .catch(err => {
            res.status(500).json({
                message : err.message
            })
        })
    }
}

exports.getComments = (req, res, next) => {
    const { postId, skipValue } = req.params;
    Post.aggregate([
           { $match : { _id : mongoose.Types.ObjectId(postId) } },  
           { $unwind : '$comments' },
           {
             $project : {
                'comments.comment' : 1,
                'comments.createdAt' : 1,
                'comments.user' : 1,
                'comments._id' : 1,
                'comments.isPrivate' : 1,
                repliesCount : { $size : '$comments.replies' },
                _id : 0
             }
            },
           { $sort : { 'comments.createdAt' : -1 } },
           { $skip : Number(skipValue) },
           { $limit : 2 }
        ])
        .then(comments => {
            return Post.populate(comments, { path : 'comments.user',  select : { name : 1, profilePicURL : 1 }  })
                   .then(doc => {
                         let newDoc = doc.map(list => {
                             if(list.comments.isPrivate) {
                                 return {
                                     ...list,
                                     comments : {
                                         ...list.comments,
                                         user : {
                                             _id : list.comments.user._id,
                                             name : "Anonymous",
                                             profilePicURL : false
                                         }
                                     }
                                 }   
                             }
                             return { ...list }
                         })   
                         res.status(200).json(newDoc)
                    }) 
        })
        .catch(err => {
            res.status(500).json({
                message : err.message
            })
        })
}

exports.postReply = (req, res, next) => {
    const { postId, commentId, mentioned, reply, isMentionedPrivate, isrepliedByPrivate} = req.body;
    const repliedBy = req.userId;
    Post.findOneAndUpdate({ _id : postId, 'comments._id' : commentId }, 
        {
          $push : { 'comments.$.replies' : 
                { 
                    mentioned : mentioned, 
                    reply : reply, 
                    repliedBy : repliedBy, 
                    isMentionedPrivate : isMentionedPrivate, 
                    isrepliedByPrivate : isrepliedByPrivate }
            },
        }
        )
        .then(doc => {
            if(doc){
               return Post.aggregate([
                    { $unwind : '$comments' },
                    { $match : { 'comments._id' : mongoose.Types.ObjectId(commentId)}},
                    { $unwind : '$comments.replies' },
                    { $project : { 'comments.replies' : 1, _id : 0 } } 
                ])
                .then(reply => {
                    if(Number(mentioned) === Number(repliedBy)){
                      return res.status(200).json(reply[reply.length - 1].comments.replies); 
                    }
                    return setNotification(reply[reply.length - 1].comments.replies);
                })
            }
            let error = new Error('Cannot reply to this comment');
            error.status = 500;
            next(error);     
        })  
        .catch(err => {
            res.status(500).json({
                message : err.message
            })
        })
     const setNotification = (reply) => {
        return User.findByIdAndUpdate({ _id : mentioned }, { $inc : { "notifications.count" : 1 } })
            .then(doc => {
                 if(doc){
                     doc.notifications.desc.push({ mentioned : true, user : reply.isMentionedPrivate ? 0 : repliedBy, postId : postId });
                     return doc.save()
                         .then(_ => {
                              res.status(200).json(reply);
                         })
                 }
                 let error = new Error('This comment has been removed for some issues.');
                 error.status = 500;
                 next(error);  
            })
            .catch(err => {
             res.status(500).json({
                 message : err.message
             })
         })
     }
}

exports.getReply = (req, res, next) => {
    const { postId, commentId } = req.params;
    Post.aggregate([
        { $match : { _id : mongoose.Types.ObjectId(postId) }},
        { $unwind : '$comments' },
        { $match : {'comments._id' : mongoose.Types.ObjectId(commentId)}},
        { $unwind : '$comments.replies' },
        { $project : {
            'comments.replies' : 1,
            _id : 0
        }},
        { $sort : { 'comments.replies.createdAt' : -1 } }
    ])
    .then(replies => {
        return Post.populate(replies, { path : 'comments.replies.mentioned comments.replies.repliedBy',  select : { name : 1, profilePicURL : 1 }  })
          .then(doc => {
              let newDoc = doc.map(reply => {
                      return {
                           ...reply,
                           comments : {
                               ...reply.comments,
                               replies : {
                                   ...reply.comments.replies,
                                   mentioned : reply.comments.replies.isMentionedPrivate ? 
                                                { _id : reply.comments.replies.mentioned._id, name : 'Anonymous' } : { ...reply.comments.replies.mentioned._doc },
                                   repliedBy : reply.comments.replies.isrepliedByPrivate ? 
                                                { _id : reply.comments.replies.repliedBy._id, name : 'Anonymous' } : { ...reply.comments.replies.repliedBy._doc }
                               }
                           }
                       }
              })
              res.status(200).json(newDoc)
          })
    })
    .catch(err => {
        res.status(500).json({
            message : err.message
        })
    })
}

exports.editConfess = (req, res, next) => {
    const userId = req.userId;
    const { postId, content, isPrivate, tags } = req.body;
    Post.findById({ _id : postId })
         .then(doc => {
             if(doc && doc.user === Number(userId)){
                 doc.isPrivate = isPrivate;
                 doc.content = content;
                 doc.tags = tags;
                 return doc.save()
                            .then(updatedDoc => {
                                res.status(200).json({ isPrivate : updatedDoc.isPrivate, 
                                        content : updatedDoc.content,
                                        tags : updatedDoc.tags,
                                       _id : updatedDoc._id });
                            })
             }
             let error = new Error('You don\'t have permission to edit this post');
             error.status = 402;
             next(error);
         })   
         .catch(err => {
             res.status(500).json({ message : err.message })
         })
}

exports.editComment = (req, res, next) => {
    const { commentId, postId, comment } =  req.body;
    const userId = req.userId;
    Post.findOne({ _id : postId, 'comments._id' : commentId },
                 { 'comments.$' : 1 })
                .then(doc => {
                    if(doc && doc.comments[0].user === Number(userId))
                    {
                       return Post.findOneAndUpdate({ _id : postId, 'comments._id' : commentId },
                                    { $set : { 'comments.$.comment' : comment } })
                                .then(_ => {
                                    res.status(200).json({
                                        success : true
                                    });
                                })
                    }
                    let error = new Error('You don\'t have permission to edit this post');
                    error.status = 402;
                    next(error);
                }) 
                .catch(err => {
                    res.status(500).json({
                        message : err.message
                    })
                })
}

exports.editReply = (req, res, next) => {
    const { replyId, reply } =  req.body;
    const userId = req.userId;
    Post.aggregate([
                   { $unwind : '$comments' },
                   { $unwind : '$comments.replies' },
                   { $match : { 'comments.replies._id' : mongoose.Types.ObjectId(replyId) } }
                ])
                .then(doc => {
                    if(doc[0] && doc[0].comments.replies.repliedBy === Number(userId))
                    {
                       return Post.findOneAndUpdate({ 'comments.replies._id' : replyId },
                                    { $set : { 'comments.$.replies.0.reply' : reply } })
                                .then(_ => {
                                    res.status(200).json({
                                        success : true
                                    });
                                })
                    }
                    let error = new Error('You don\'t have permission to edit this post');
                    error.status = 402;
                    next(error);
                }) 
                .catch(err => {
                    res.status(500).json({
                        message : err.message
                    })
                })
}

exports.deleteReply = (req, res, next) => {
    const { replyId } =  req.params;
    const userId = req.userId;
    Post.aggregate([
                   { $unwind : '$comments' },
                   { $unwind : '$comments.replies' },
                   { $match : { 'comments.replies._id' : mongoose.Types.ObjectId(replyId) } }
                ])
                .then(doc => {
                    if(doc[0] && doc[0].comments.replies.repliedBy === Number(userId))
                    {
                       return Post.findOneAndUpdate({ 'comments.replies._id' : replyId },
                                { $pull : { 'comments.$.replies' : { _id :  mongoose.Types.ObjectId(replyId) }}})
                                .then(_ => {
                                    res.status(200).json({
                                        success : true
                                    });
                                })
                    }
                    let error = new Error('You don\'t have permission to delete this reply');
                    error.status = 402;
                    next(error);
                }) 
                .catch(err => {
                    res.status(500).json({
                        message : err.message
                    })
                })
}

exports.deleteComment = (req, res, next) => {
    const { commentId } =  req.params;
    const userId = req.userId;
    Post.findOne({ 'comments._id' : commentId },
                 { 'comments.$' : 1 })
                .then(doc => {
                    if(doc && doc.comments[0].user === Number(userId))
                    {
                       return Post.findOneAndUpdate({  },
                                    { $pull : { 'comments' : { _id :  mongoose.Types.ObjectId(commentId)}} })
                                .then(_ => {
                                    res.status(200).json({
                                        success : true
                                    });
                                })
                    }
                    let error = new Error('You don\'t have permission to delete this comment');
                    error.status = 402;
                    next(error);
                }) 
                .catch(err => {
                    res.status(500).json({
                        message : err.message
                    })
                })
}

exports.deletePost = (req, res, next) => {
    const { postId } = req.params;
    const userId = req.userId;
    Post.findById({ _id : postId })
    .then(doc => {
        if(doc && doc.user === Number(userId)){
          return Post.findByIdAndDelete({ _id : postId })
               .then(_ => {
                   res.status(200).json({ 
                       success : true
                    })
               })   
        }
        let error = new Error('You don\'t have permission to delete this post');
        error.status = 402;
        next(error);
    })   
    .catch(err => {
        res.status(500).json({ message : err.message })
    })
}

exports.likeConfess = (req, res, next) => {
    const { postId } = req.params;
    const { userId } = req;
    Post.updateOne({ _id : postId },
            { $addToSet : { likes : userId } })
        .then(doc => {
            res.status(200).json(doc)
        })    
        .catch(err => {
            res.status(500).json({
                message : err.message
            })
        })
}

exports.unlikeConfess = (req, res, next) => {
    const { postId } = req.params;
    const { userId } = req;
    Post.updateOne({ _id : postId },
        { $pull : { likes : userId } })
    .then(doc => {
        res.status(200).json(doc)
    })    
    .catch(err => {
        res.status(500).json({
            message : err.message
        })
    })
}