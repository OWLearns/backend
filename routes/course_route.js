const express = require('express');
const multer = require('../middleware/upload_file');
const { getCourse, getTopics, addTopics, getMaterials, addMaterial,  getQuiz, addQuiz, addCourse } = require('../controllers/courses');

const router = express.Router();

router.get('/courses', getCourse);

router.post('/addCourse', multer.single('thumbnail'), addCourse);

router.get('/topics/:courseID', getTopics);

router.post('/addTopics', addTopics);

router.get('/materials/:topicID', getMaterials);

router.get('/getQuiz/:topicID', getQuiz);

router.post('/addQuiz', addQuiz);

router.post('/addMaterial', multer.single('thumbnail'), addMaterial);

module.exports = router;