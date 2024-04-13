const express = require('express');
const cors = require('cors');
const userRoute = require('./routes/user_route');
const courseRoute = require('./routes/course_route');
const cookieParser = require('cookie-parser');

const app = express();

const allowedOrigins = ['http://localhost:3000', 'https://www.owlearns.site', 'http://localhost:3001'];

const corsOptions = {
    origin: function (origin, callback) {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true
};

app.use(cors(corsOptions));

app.use(cookieParser());

app.use(express.json());

app.use(express.urlencoded({ extended: false }));

app.use(userRoute);

app.use(courseRoute);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log('Server is running on port', port);
});