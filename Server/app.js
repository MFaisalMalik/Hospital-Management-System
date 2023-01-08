const express = require('express');
const mysql = require('mysql');
const cookieParser = require('cookie-parser');
const routers = require('./routes/routes');

const port = 3001;
const app = express()

// View Engine
app.set('view engine', 'ejs');

// Accessing CSS and images
app.use(express.static('../Client'));

app.use(cookieParser());

app.use('/',routers);
app.use('/doctor',routers);
app.use('/room',routers);
app.use('/inpatient',routers);
app.use('/timetable',routers);
app.use('/appointment',routers);
app.use('/pharmacy',routers);
app.use('/billing',routers);

// Listen on port
app.listen(port, () => console.log('Listen on port ', port));