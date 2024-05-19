const express = require('express');
const multer = require('../middleware/upload_file');
const { getCourse, getTopics, addTopics, getMaterials, addMaterial,  getQuiz, addQuiz, addCourse, quizScore } = require('../controllers/courses');

const router = express.Router();

router.post('/addCourse', multer.single('thumbnail'), addCourse);

router.post('/addMaterial', multer.single('thumbnail'), addMaterial);

router.post('/addTopics', addTopics);

router.post('/addQuiz', addQuiz);

router.post('/topics/:courseID', getTopics);

router.get('/getQuiz', getQuiz);

router.get('/courses', getCourse);

router.get('/materials/:topicID', getMaterials);

router.post('/quizScore', quizScore);

module.exports = router;