const express = require('express');
const bodyParser = require('body-parser');
const controller = require('../controllers/pages');
const  router = express.Router();

var urlencodedParser = (bodyParser.urlencoded({ extended: true}))

router.get('/signup', (req, res) => {
    res.render('sign-up', {message : ''});
});

router.get('/login', (req, res) => {
    res.render('login', {message : ''});
});

router.get('/home', controller.isloggedIn, (req, res) => {
    if( req.user ){
        res.render('home', {key: req.user.user});
    }
    else{
        res.redirect('/login');
    }
});

router.get('/logout', (req, res) => {
    const cookieOptions = {
        expires: new Date(Date.now()  + 2 * 1000 ),
        httpOnly: true
    }
    res.cookie('jwt', 'acdef', cookieOptions );
    res.status(200).redirect('/login');
});

router.get('/doctor', controller.isloggedIn, (req, res) => {
    
    if( req.user ){
        res.render('doctor', {message : 'doctormain', type : '', key: req.user.user});
    }
    else{
        res.redirect('/login');
    }
});

router.get('/add', controller.isloggedIn, (req, res) => {
    if( req.user ){
        res.render('doctor', {message : '', type : 'add'});
    }
    else{
        res.redirect('/login');
    }
});

router.get('/delete', controller.isloggedIn, (req, res) => {
    if( req.user ){
        res.render('doctor', {message : '', type : 'delete'});
    }
    else{
        res.redirect('/login');
    }
});

router.get('/list', controller.isloggedIn, (req, res) => {
    if( req.user ){
        
        controller.listDoctor(req, res);
    }
    else{
        res.redirect('/login');
    }
});

router.get('/room', controller.isloggedIn, (req, res) => {
    if( req.user ){
        res.render('room', {message : 'roommain', type : '', key: req.user.user});
    }
    else{
        res.redirect('/login');
    }
});

router.get('/addroom', controller.isloggedIn, (req, res) => {
    if( req.user ){
        res.render('room', {message : '', type : 'add'});
    }
    else{
        res.redirect('/login');
    }
});

router.get('/deleteroom', controller.isloggedIn, (req, res) => {
    if( req.user ){
        res.render('room', {message : '', type : 'delete'});
    }
    else{
        res.redirect('/login');
    }
});

router.get('/listroom', controller.isloggedIn, (req, res) => {
    if( req.user ){
        controller.listRoom(req, res);
    }
    else{
        res.redirect('/login');
    }
});

router.get('/inpatient', controller.isloggedIn, (req, res) => {
    if( req.user ){
        res.render('inpatient', {message : 'inpatientmain', type : '', key: req.user.user});
    }
    else{
        res.redirect('/login');
    }
});


router.get('/addinpatient', controller.isloggedIn, (req, res) => {
    if( req.user ){
        res.render('inpatient', {message : '', type : 'add'});
    }
    else{
        res.redirect('/login');
    }
});

router.get('/deleteinpatient', controller.isloggedIn, (req, res) => {
    if( req.user ){
        res.render('inpatient', {message : '', type : 'delete'});
    }
    else{
        res.redirect('/login');
    }
});

router.get('/listinpatient', controller.isloggedIn, (req, res) => {
    if( req.user ){
        controller.listInpatient(req, res);
    }
    else{
        res.redirect('/login');
    }
});

router.get('/timetable', controller.isloggedIn, (req, res) => {
    if( req.user ){
        res.render('timetable', {message : '', type : 'timetablemain', key: req.user.user});
    }
    else{
        res.redirect('/login');
    }
});

router.get('/addtimetable', controller.isloggedIn, (req, res) => {
    if( req.user ){
        res.render('timetable', {message : '', type : 'add'});
    }
    else{
        res.redirect('/login');
    }
});

router.get('/updatetimetable', controller.isloggedIn, (req, res) => {
    if( req.user ){
        res.render('timetable', {message : '', type : 'update'});
    }
    else{
        res.redirect('/login');
    }
});

router.get('/deletetimetable', controller.isloggedIn, (req, res) => {
    if( req.user ){
        res.render('timetable', {message : '', type : 'delete'});
    }
    else{
        res.redirect('/login');
    }
});

router.get('/listtimetable', controller.isloggedIn, (req, res) => {
    if( req.user ){
        controller.listTimetable(req, res);
    }
    else{
        res.redirect('/login');
    }
});

router.get('/appointment', controller.isloggedIn, (req, res) => {
    if( req.user ){
        res.render('appointment', {message : '', type : 'appointmentmain', key: req.user.user});
    }
    else{
        res.redirect('/login');
    }
});

router.get('/takeappointment', controller.isloggedIn, (req, res) => {
    if( req.user ){
        res.render('appointment', {message : '', type : 'take'});
    }
    else{
        res.redirect('/login');
    }
});

router.get('/cancelappointment', controller.isloggedIn, (req, res) => {
    if( req.user ){
        res.render('appointment', {message : '', type : 'cancel'});
    }
    else{
        res.redirect('/login');
    }
});

router.get('/outpatient', controller.isloggedIn, (req, res) => {
    if( req.user ){
        controller.listOutpatient(req, res);
    }
    else{
        res.redirect('/login');
    }
});

router.get('/pharmacy', controller.isloggedIn, (req, res) => {
    if( req.user ){
        res.render('pharmacy', {message : '', type : 'pharmacymain', key: req.user.user});
    }
    else{
        res.redirect('/login');
    }
});

router.get('/addstock', controller.isloggedIn, (req, res) => {
    if( req.user ){
        res.render('pharmacy', {message : '', type : 'add'});
    }
    else{
        res.redirect('/login');
    }
});

router.get('/sellmedicine', controller.isloggedIn, (req, res) => {
    if( req.user ){
        res.render('pharmacy', {message : '', type : 'sell'});
    }
    else{
        res.redirect('/login');
    }
});

router.get('/billing', controller.isloggedIn, (req, res) => {
    if( req.user ){
        res.render('billing', {message : '', type : 'billingmain', key: req.user.user});
    }
    else{
        res.redirect('/login');
    }
});

router.get('/generateinbill', controller.isloggedIn, (req, res) => {
    if( req.user ){
        res.render('billing', {message : '', type : 'ingenerate'});
    }
    else{
        res.redirect('/login');
    }
});

router.get('/generateoutbill', controller.isloggedIn, (req, res) => {
    if( req.user ){
        res.render('billing', {message : '', type : 'outgenerate'});
    }
    else{
        res.redirect('/login');
    }
});

router.post('/signup', urlencodedParser, controller.signup);
router.post('/login', urlencodedParser, controller.login);
router.post('/add', urlencodedParser, controller.addDoctor);
router.post('/delete', urlencodedParser, controller.deleteDoctor);
router.post('/addroom', urlencodedParser, controller.addRoom);
router.post('/deleteroom', urlencodedParser, controller.deleteRoom);
router.post('/addinpatient', urlencodedParser, controller.addInpatient);
router.post('/deleteinpatient', urlencodedParser, controller.deleteInpatient);
router.post('/addtimetable', urlencodedParser, controller.addTimetable);
router.post('/updatetimetable', urlencodedParser, controller.updateTimetable);
router.post('/deletetimetable', urlencodedParser, controller.deleteTimetable);
router.post('/takeappointment', urlencodedParser, controller.takeAppointment);
router.post('/cancelappointment', urlencodedParser, controller.cancelAppointment);
router.post('/addstock', urlencodedParser, controller.addStock);
router.post('/sellmedicine', urlencodedParser, controller.sellMedicine);
router.post('/ingeneratebill', urlencodedParser, controller.ingenerateBill);
router.post('/outgeneratebill', urlencodedParser, controller.outgenerateBill);

module.exports = router;