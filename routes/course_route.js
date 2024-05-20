const express = require('express');
const multer = require('../middleware/upload_file');
const { getCourse, getTopics, addTopics, getMaterials, addMaterial,  getQuiz, addQuiz, addCourse, quizScore } = require('../controllers/courses');

const router = express.Router();

router.post('/addCourse', multer.single('thumbnail'), addCourse);

router.post('/addMaterial', multer.single('thumbnail'), addMaterial);

router.post('/addTopics', addTopics);

router.post('/addQuiz', addQuiz);

router.post('/topics/:courseID', getTopics);

router.post('/materials', getMaterials);

router.post('/quizScore', quizScore);

router.get('/getQuiz/:topicID', getQuiz);

router.get('/courses', getCourse);

module.exports = router;