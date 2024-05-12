const express = require('express');
const { loginEmail, registerEmail, deleteUser, recoverAccount, recoverPassword, oAuth, updateProfile, getUser, completed, studied, getStudied } = require('../controllers/user');
const supabase = require('../util/con_db');
const multer = require('../middleware/upload_file');

const router = express.Router();

router.get('/', (req, res, next) => {
    authent = supabase.auth.getSession;
    res.status(404).json({
        message: 'Resource not found!',
        auth: authent
    });
})

router.post('/login', loginEmail);

router.post('/oauth/:provider/:device', oAuth);

router.post('/register/', registerEmail);

router.post('/recovery', recoverAccount);

router.post('/recovery/password', recoverPassword);

router.post('/profile', getUser);

router.post('/completed', completed);

router.post('/studied', studied);

router.post('/getStudied', getStudied);

router.delete('/delete', deleteUser);

router.patch('/editProfile', multer.single('avatar'), updateProfile);

module.exports = router;