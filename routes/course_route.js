const express = require('express');
const multer = require('../middleware/upload_file');
const { getCourse, getTopics, addTopics, getMaterials, addMaterial,  getQuiz, addQuiz } = require('../controllers/courses');

const router = express.Router();

router.get('/courses', getCourse);

router.get('/topics/:courseID', getTopics);

router.post('/addTopics', multer.single('image'), addTopics);

router.get('/materials/:topicID', getMaterials);

router.get('/getQuiz/:topicID', getQuiz);

router.post('/addQuiz', addQuiz);

router.post('/addMaterial', addMaterial);

module.exports = router;