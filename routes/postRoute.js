const express = require('express');
const postController = require('../controller/postController');
const authCheck = require('../utils/authCheck')
const router = express.Router();

router.get('/get-post/:page', authCheck ,postController.getConfession);
router.get('/comment/:postId&:skipValue', authCheck ,postController.getComments);
router.get('/replies/:commentId&:postId', authCheck ,postController.getReply);
router.post('/create-post', authCheck ,postController.postConfession);
router.post('/comment', authCheck ,postController.postComments);
router.post('/reply' , authCheck ,postController.postReply);
router.patch('/edit/confess', authCheck ,postController.editConfess);
router.patch('/edit/comment', authCheck ,postController.editComment);
router.patch('/edit/reply', authCheck ,postController.editReply);
router.delete('/delete/reply/:replyId', authCheck ,postController.deleteReply);
router.delete('/delete/comment/:commentId', authCheck ,postController.deleteComment);
router.delete('/delete/post/:postId', authCheck ,postController.deletePost);
router.patch('/like/post/:postId', authCheck ,postController.likeConfess);
router.patch('/unlike/post/:postId', authCheck ,postController.unlikeConfess);

module.exports = router;