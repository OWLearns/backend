const express = require('express');
const multer = require('../middleware/upload_file');
const { getCourse, getTopics, addTopics, getMaterials, addMaterial,  getQuiz, addQuiz, addCourse } = require('../controllers/courses');

const router = express.Router();

router.post('/addCourse', multer.single('thumbnail'), addCourse);

router.post('/addMaterial', multer.single('thumbnail'), addMaterial);

router.post('/addTopics', addTopics);

router.post('/addQuiz', addQuiz);

router.get('/courses', getCourse);

router.get('/topics/:courseID', getTopics);

router.get('/materials/:topicID', getMaterials);

router.get('/getQuiz/:topicID', getQuiz);

module.exports = router;