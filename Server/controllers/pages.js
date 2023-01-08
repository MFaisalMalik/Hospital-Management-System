const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const {promisify} = require ('util');
const { checkPrime } = require('crypto');

dotenv.config({path:'./.env'});
const db = mysql.createPool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    databse: process.env.DATABASE
});

exports.signup = (req, res) => {

    const {email, password, retypepassword, user} = req.body;
 
    if( !email || !password ){
        return res.status(400).render('sign-up', {
            message: 'Please provide an email and password'});
    }

    db.query("SELECT email FROM hms.logininfo WHERE email = ?", [email], async (error, results) => {
            
        if(error) 
            throw error;
        if(results.length > 0){
        
            return res.render('sign-up', {
                message: 'Already have user with this email'});
        }
        else if( password != retypepassword){
            return res.render('sign-up', {
                message: 'Passwords do not match'});
        }
        
        let hashedPassword = await  bcrypt.hash(password, 8);
        db.query("INSERT INTO hms.logininfo SET ?", {email: email, password: hashedPassword, user}, (error) => {
            if(error)
                throw error;
            res.render('sign-up', {
                message: 'Signed up successfully'});
        });
    });
};

exports.login =  (req, res) => {

    try{
        const {email, password} = req.body;

        if( !email || !password ){
                return res.status(400).render('login', {
                    message: 'Please provide an email and password'});
        }

        db.query("SELECT * FROM hms.logininfo WHERE email = ?", [email], async (error, results) => {
            if(error) 
                throw error;

            if( results.length <= 0 || !(await bcrypt.compare(password, results[0].password)) ){

                return res.render('login', {
                    message: 'The email or password is incorrect'});    
            }

            const id = results[0].id;
            const token = jwt.sign({ id }, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRES_IN
            }); 

            const cookieOptions = {
                expires: new Date(
                    Date.now()  + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000 
                ),
                httpOnly: true
            }
            res.cookie('jwt', token, cookieOptions );
            res.status(200).redirect('/home');
        });

    } catch (error) {
        throw error;
    }
};

exports.isloggedIn = async (req, res, next) => {
    
    if( req.cookies.jwt){
        try{
            // 1) verify the token
            const decoded = await promisify(jwt.verify)(req.cookies.jwt,
                process.env.JWT_SECRET
            );

            // 2) check if the user still exists 
            db.query("SELECT * FROM hms.logininfo WHERE id = ?", [decoded.id], (error, results) => {
                
                if( results.length <= 0){
                    return next();
                }
                
                req.user = results[0];
                return next();
            });

        }
        catch (error){
            throw error;
            return next();
        }
    }
    else{
        next();
    }
}

exports.addDoctor = (req, res) => {

    const {id, name, department, address, phone, email} = req.body;

    db.query("SELECT id FROM hms.Doctor WHERE id = ? or email = ?", [id, email], async (error, results) => {
            
        if(error) 
            throw error;
        if(results.length > 0){
            return res.render('doctor', {
                message: 'Already have doctor with this id or email', type : 'add'});
        }

        db.query("INSERT INTO hms.Doctor SET ?", {id, name, department, address, phone, email}, (error) => {
            if(error)
                throw error;
            
            // addDocToTimetable(id);
            res.render('doctor', {
                message: 'Doctor Added successfully', type : 'add'});
        });
    });

};

exports.deleteDoctor = (req, res) => {

    const {id} = req.body;

    db.query("SELECT id FROM hms.Doctor WHERE id = ?", [id], async (error, results) => {
            
        if(error) 
            throw error;
        if(results.length <= 0){
            return res.render('doctor', {
                message: 'No record of the doctor with this id', type : 'delete'});
        }

        db.query("DELETE FROM hms.Doctor WHERE id = ?", [id], (error) => {
            if(error)
                throw error;
            res.render('doctor', {
                message: 'Doctor Deleted successfully', type : 'delete'});
        });
    });

};

exports.listDoctor = (req, res) => {
    
    db.query("SELECT * FROM hms.doctor", async (error, results) => {
        
        if(error) 
            throw error;
        res.render('doctor', {
            message: results, type : 'list'});
        
    });
};

exports.addRoom = (req, res) => {

    const {roomno, roomtype} = req.body;
    var status = "empty";
    db.query("SELECT roomno FROM hms.rooms WHERE roomno = ?", [roomno], async (error, results) => {
            
        if(error) 
            throw error;
        if(results.length > 0){
            return res.render('room', {
                message: 'Already have this room in the database', type : 'add'});
        }

        db.query("INSERT INTO hms.rooms SET ?", {roomno, roomtype, status}, (error) => {
            if(error)
                throw error;
            res.render('room', {
                message: 'Room Added successfully', type : 'add'});
        });
    });

};

exports.deleteRoom = (req, res) => {

    const {roomno} = req.body;

    db.query("SELECT roomno FROM hms.rooms WHERE roomno = ?", [roomno], async (error, results) => {
            
        if(error) 
            throw error;
        if(results.length <= 0){
            return res.render('room', {
                message: 'No record of this room', type : 'delete'});
        }

        db.query("DELETE FROM hms.rooms WHERE roomno = ?", [roomno], (error) => {
            if(error)
                throw error;
            res.render('room', {
                message: 'Room Deleted successfully', type : 'delete'});
        });
    });

};

exports.listRoom = (req, res) => {
    
    db.query("SELECT * FROM hms.rooms", async (error, results) => {
        
        if(error) 
            throw error;
        res.render('room', {
            message: results, type : 'list'});

    });
};

exports.addInpatient = (req, res) => {

    const {pid, name, age, disease, roomno, dateOfAdm, dateOfDis, doctorid} = req.body;
    if(dateOfAdm > dateOfDis){
        return res.render('inpatient', {
            message: 'Incorrect dates', type : 'add'});
    }
    db.query("SELECT pid FROM hms.inpatient WHERE pid = ?", [pid], async (error, results) => {
            
        if(error) 
            throw error;
        if(results.length > 0){
            return res.render('inpatient', {
                message: 'Already have patient with this id', type : 'add'});
        }
        db.query("SELECT * FROM hms.rooms WHERE roomno = ?", [roomno], async (error, results1) => {
            
            if(error) 
                throw error;
            if(results1.length <= 0){
                return res.render('inpatient', {
                    message: 'No room with this id', type : 'add'});
            }
            if(results1[0].status == "ocuupied"){
                return res.render('inpatient', {
                    message: 'Room is occupied', type : 'add'});
            }
            db.query("SELECT id FROM hms.doctor WHERE id = ?", [doctorid], async (error, results2) => {
                if(error) 
                    throw error;
                if(results2.length <= 0){
                    return res.render('inpatient', {
                        message: 'No doctor with this id', type : 'add'});
                }                 
                db.query("UPDATE hms.rooms SET status = ? WHERE roomno = ?", ["ocuupied", roomno],(error) => {
                    if(error) 
                        throw error;
                
                    db.query("INSERT INTO hms.inpatient SET ?", {pid, name, age, disease, roomno, dateOfAdm, dateOfDis, doctorid}, (error) => {
                        if(error) 
                            throw error;
                        res.render('inpatient', {
                            message: 'Patient Added successfully', type : 'add'});
                    });
                });
            });
        });
    });
};

exports.deleteInpatient = (req, res) => {

    const {pid} = req.body;

    db.query("SELECT * FROM hms.inpatient WHERE pid = ?", [pid], async (error, results) => {
            
        if(error) 
            throw error;
        if(results.length <= 0){
            return res.render('inpatient', {
                message: 'No record of this patient', type : 'delete'});
        }

        db.query("UPDATE hms.rooms SET status = ? WHERE roomno = ?", ["empty", results[0].roomno],(error) => {
            if(error) 
                throw error;
            db.query("DELETE FROM hms.inpatient WHERE pid = ?", [pid], (error) => {
            if(error)
                throw error;
            res.render('inpatient', {
                message: 'Patient Record Deleted successfully', type : 'delete'});
            }); 
        });
    });
};

exports.listInpatient = (req, res) => {
    
    db.query("SELECT * FROM hms.inpatient", async (error, results) => {
        
        if(error) 
            throw error;
        res.render('inpatient', {
            message: results, type : 'list'});

    });
};

exports.addTimetable = (req, res) => {

    const {doctorid,
        m910,m1011,m1112,m121,m12,m23,m34,m45,
        t910,t1011,t1112,t121,t12,t23,t34,t45,
        w910,w1011,w1112,w121,w12,w23,w34,w45,
        th910,th1011,th1112,th121,th12,th23,th34,th45,
        f910,f1011,f1112,f121,f12,f23,f34,f45,
        s910,s1011,s1112,s121,s12,s23,s34,s45
    } = req.body;

    const day = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const a910 = [m910, t910, w910, th910, f910, s910];
    const a1011 = [m1011, t1011, w1011, th1011, f1011, s1011];
    const a1112 = [m1112, t1112, w1112, th1112, f1112, s1112];
    const a121 = [m121, t121, w121, th121, f121, s121];
    const a12 = [m12, t12, w12, th12, f12, s12];
    const a23 = [m23, t23, w23, th23, f23, s23];
    const a34 = [m34, t34, w34, th34, f34, s34];
    const a45 = [m45, t45, w45, th45, f45, s45];


    db.query("SELECT doctorid FROM hms.timetable WHERE doctorid = ?", [doctorid], async (error, results) => {
            
        if(error) 
            throw error;
        if(results.length > 0){
            return res.render('timetable', {
                message: 'Already have timetable of this doctor, click on update to make changes', type : 'add'});
        }
        
        db.query("SELECT id FROM hms.doctor WHERE id = ?", [doctorid], async (error, results) => {
        
            if(results.length <= 0){
                return res.render('timetable', {
                    message: 'No doctor with this id available', type : 'add'});
            }

            for (let j = 0; j < 6; j++) {
                db.query("INSERT INTO hms.timetable SET ?", {
                    doctorid, day: day[j], from9to10 : a910[j], from10to11 : a1011[j],
                    from11to12 : a1112[j], from12to1 : a121[j], from1to2 : a12[j],
                    from2to3 : a23[j], from3to4 : a34[j], from4to5 : a45[j]}, async (error) => {
                    
                    if(error) 
                        throw error;        
                });
            }            
            
            res.render('timetable', {
                message: 'Timetable Added successfully', type : 'add'});

        });
    });
};

exports.deleteTimetable = (req, res) => {

    const {doctorid} = req.body;

    db.query("SELECT doctorid FROM hms.timetable WHERE doctorid = ?", [doctorid], async (error, results) => {
            
        if(error) 
            throw error;
        if(results.length <= 0){
            return res.render('timetable', {
                message: 'No timetable of the doctor with this id present', type : 'delete'});
        }

        db.query("DELETE FROM hms.timetable WHERE doctorid = ?", [doctorid], (error) => {
            if(error)
                throw error;
            res.render('timetable', {
                message: 'Timetable of this doctor Deleted successfully', type : 'delete'});
        });
    });
};

exports.listTimetable = (req, res) => {    
    
    const day = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    db.query("SELECT * FROM hms.timetable", async (error, results) => {    
        if(error) 
            throw error;
        res.render('timetable', {
            results, day, type : 'list'});                             
    });   
};

const renderupdate = (error, res) =>  {
    if(error) 
        throw error;
        
    res.render('timetable', {
        message: 'Timetable Updated successfully', type : 'update'});
}

exports.updateTimetable = (req, res) => {

    const {doctorid, day, time, slot} = req.body;

    db.query("SELECT doctorid FROM hms.timetable WHERE doctorid = ?", [doctorid], async (error, results) => {
            
        if(error) 
            throw error;
        if(results.length <= 0){
            return res.render('timetable', {
                message: 'No timetable of the doctor with this id present', type : 'update'});
        }

        if(time == "9am-10am"){
            db.query("UPDATE hms.timetable SET from9to10 = ? WHERE doctorid = ? AND day = ?", [slot, doctorid, day],(error) => {
                renderupdate(error, res);
            });
        }else if(time == "10am-11am"){
            db.query("UPDATE hms.timetable SET from10to11 = ? WHERE doctorid = ? AND day = ?", [slot, doctorid, day],(error) => {
                renderupdate(error, res);
            });
        }else if(time == "11am-12pm"){
            db.query("UPDATE hms.timetable SET from11to12 = ? WHERE doctorid = ? AND day = ?", [slot, doctorid, day],(error) => {
                renderupdate(error, res);
            });
        }else if(time == "12pm-1pm"){
            db.query("UPDATE hms.timetable SET from12to1 = ? WHERE doctorid = ? AND day = ?", [slot, doctorid, day],(error) => {
                renderupdate(error, res);
            });
        }else if(time == "1pm-2pm"){
            db.query("UPDATE hms.timetable SET from1to2 = ? WHERE doctorid = ? AND day = ?", [slot, doctorid, day],(error) => {
                renderupdate(error, res);
            });
        }else if(time == "2pm-3pm"){
            db.query("UPDATE hms.timetable SET from2to3 = ? WHERE doctorid = ? AND day = ?", [slot, doctorid, day],(error) => {
                renderupdate(error, res);
            });
        }else if(time == "3pm-4pm"){
            db.query("UPDATE hms.timetable SET from3to4 = ? WHERE doctorid = ? AND day = ?", [slot, doctorid, day],(error) => {
                renderupdate(error, res);
            });
        }else if(time == "4pm-5pm"){
            db.query("UPDATE hms.timetable SET from4to5 = ? WHERE doctorid = ? AND day = ?", [slot, doctorid, day],(error) => {
                renderupdate(error, res);
            });
        }
    });
};

exports.takeAppointment = (req, res) => {

    const {name, age, doctorid, day, time} = req.body;

    db.query("SELECT * FROM hms.timetable WHERE doctorid = ? AND day = ?", [doctorid, day], async (error, results) => {
            
        if(error) 
            throw error;
        if(results.length <= 0){
            return res.render('appointment', {
                message: 'Time table of this doctor is not present', type : 'take'});
        }

        db.query("SELECT * FROM hms.outpatient WHERE doctorid = ? AND appointday = ? AND appointtime = ?", [doctorid, day, time], async (error, results) => {
            if(error) 
                throw error;
            if(results.length > 6){
                return res.render('appointment', {
                    message: 'Appointment for this doctor is full at this time', type : 'take'});
            }
        });

        if(time == "9am-10am"){
            if(!results[0].from9to10){
                return res.render('appointment', {
                message: 'Doctor is not available at this time', type : 'take'});
            }
        }else if(time == "10am-11am"){
            if(!results[0].from10to11){
                return res.render('appointment', {
                message: 'Doctor is not available at this time', type : 'take'});
            }
        }else if(time == "11am-12pm"){
            if(!results[0].from11to12){
                return res.render('appointment', {
                message: 'Doctor is not available at this time', type : 'take'});
            }
        }else if(time == "12pm-1pm"){
            if(!results[0].from12to1){
                return res.render('appointment', {
                message: 'Doctor is not available at this time', type : 'take'});
            }
        }else if(time == "1pm-2pm"){
            if(!results[0].from1to2){
                return res.render('appointment', {
                message: 'Doctor is not available at this time', type : 'take'});
            }
        }else if(time == "2pm-3pm"){
            if(!results[0].from2to3){
                return res.render('appointment', {
                message: 'Doctor is not available at this time', type : 'take'});
            }
        }else if(time == "3pm-4pm"){
            if(!results[0].from3to4){
                return res.render('appointment', {
                message: 'Doctor is not available at this time', type : 'take'});
            }
        }else if(time == "4pm-5pm"){
            if(!results[0].from4to5){
                return res.render('appointment', {
                message: 'Doctor is not available at this time', type : 'take'});
            }
        }
        db.query("INSERT INTO hms.outpatient SET ?", {name, age, doctorid, appointday: day, appointtime : time}, (error) => {
            if(error) 
                throw error;
            res.render('appointment', {
                message: 'Appointed successfully', type : 'take'});
        });
    });
};

exports.cancelAppointment = (req, res) => {

    const {pid} = req.body;

    db.query("SELECT pid FROM hms.outpatient WHERE pid = ?", [pid], async (error, results) => {
            
        if(error) 
            throw error;
        if(results.length <= 0){
            return res.render('appointment', {
                message: 'No record of this patient', type : 'cancel'});
        }

        db.query("DELETE FROM hms.outpatient WHERE pid = ?", [pid], (error) => {
            if(error)
                throw error;
            res.render('appointment', {
                message: 'Patient Record Deleted successfully', type : 'cancel'});
        });
    });

};

exports.listOutpatient = (req, res) => {
    
    db.query("SELECT * FROM hms.outpatient", async (error, results) => {
        
        if(error) 
            throw error;
        res.render('outpatient', {
            message: results, key: req.user.user});

    });
};

exports.addStock = (req, res) => {

    const {name,  price, quantity} = req.body;

    db.query("SELECT * FROM hms.medicine WHERE name = ?", [name], async (error, results) => {
            
        if(error) 
            throw error;
        
        if(results.length > 0){
            db.query("UPDATE hms.medicine SET quantity = ? WHERE name = ?", [parseInt(quantity)+parseInt(results[0].quantity), name],(error) => {
                if(error) 
                    throw error;
                return res.render('pharmacy', {
                    message: 'Medicine added successfully', type : 'add'});
            });
        }else{
            db.query("INSERT INTO hms.medicine SET ?", {name, price, quantity}, (error) => {
                if(error) 
                    throw error;
                res.render('pharmacy', {
                    message: 'Medicine added successfully', type : 'add'});
            });
        }
    });

};

exports.sellMedicine = (req, res) => {

    const {mid, pid, quantity} = req.body;
    db.query("SELECT * FROM hms.medicine WHERE mid = ?", [mid], async (error, rslt) => {
        if(error) 
            throw error;
        
        if(rslt.length <= 0 || rslt[0].quantity == 0 || parseInt(rslt[0].quantity)-parseInt(quantity) < 0){
            return res.render('pharmacy', {
                message: 'Medicine not available', type : 'sell'});
        }

        db.query("SELECT pid FROM hms.inpatient WHERE pid = ?", [pid], async (error, rslt1) => {
            if(error) 
                throw error;
            if(rslt1.length <= 0){
                return res.render('pharmacy', {
                    message: 'No Patient with this id', type : 'sell'});
            }
            
            db.query("SELECT * FROM hms.medbill WHERE mid = ? AND pid = ?", [mid, pid], async (error, results) => {
                    
                if(error) 
                    throw error;

                if(results.length > 0){
                    db.query("UPDATE hms.medbill SET quantity = ? WHERE mid = ? AND pid = ?", [quantity, mid, pid],(error) => {
                        if(error) 
                            throw error;
                        db.query("UPDATE hms.medicine SET quantity = ? WHERE mid = ?", [parseInt(rslt[0].quantity)-parseInt(quantity), mid],(error) => {
                            if(error) 
                                throw error;
                        });
                            
                        return res.render('pharmacy', {
                            message: 'Medicine added successfully', type : 'sell'});
                    });
                }else{
                    db.query("INSERT INTO hms.medbill SET ?", {mid, pid, quantity}, (error) => {
                        if(error) 
                            throw error;
                        db.query("UPDATE hms.medicine SET quantity = ? WHERE mid = ?", [parseInt(rslt[0].quantity)-parseInt(quantity), mid],(error) => {
                            if(error) 
                                throw error;
                        });
                        
                        res.render('pharmacy', {
                            message: 'Medicine added successfully', type : 'sell'});
                    });
                }
            });     
        });
    });
};

const printinBill = (pid, res) => {
    db.query("SELECT * FROM hms.bill JOIN hms.inpatient ON hms.inpatient.billno = hms.bill.billno WHERE hms.inpatient.pid = ?", [pid], async (error, results) => {
        if(error) 
            throw error;
        total = results[0].doctotal + results[0].medtotal;
        res.render('billing', {message: '', results, total,  type : 'printInBill'});
    });
};

const printoutBill = (pid, res) => {
    db.query("SELECT * FROM hms.bill JOIN hms.outpatient ON hms.outpatient.billno = hms.bill.billno WHERE hms.outpatient.pid = ?", [pid], async (error, results) => {
        if(error) 
            throw error;
        res.render('billing', {message: '', results ,  type : 'printOutBill'});
    });
};

exports.ingenerateBill = (req, res) => {
    const {pid, doctotal} = req.body;
    db.query("SELECT * FROM hms.inpatient WHERE pid = ?", [pid], async (error, results) => {
        if(error) 
            throw error;
        
        if(results.length <= 0){
            return res.render('billing', {
                message: 'No patient with this id', type : 'ingenerate'});
        }
        db.query("SELECT *, hms.medbill.quantity AS qty FROM hms.inpatient JOIN hms.medbill ON hms.inpatient.pid = hms.medbill.pid JOIN hms.medicine ON hms.medicine.mid = hms.medbill.mid WHERE hms.inpatient.pid = ?", [pid], async (error, results1) => {
            if(error) 
                throw error;
            var medtotal = 0;
            for(var i = 0; i < results1.length; i++){
                medtotal = medtotal + results1[i].qty * results1[i].price;
            }    
            
            db.query("INSERT INTO hms.bill SET ?", {medtotal, doctotal}, (error) => {
                if(error) 
                    throw error;
                db.query("SELECT MAX(billno) AS billno FROM hms.bill", async (error, results2) => {
                    if(error) 
                        throw error;
                    db.query("UPDATE hms.inpatient SET billno = ? WHERE pid = ?", [results2[0].billno, pid],(error) => {
                        if(error) 
                            throw error;
                        
                        printinBill(pid, res);
                    });
                });  
            });
        });
    });
};

exports.outgenerateBill = (req, res) => {
    const {pid, doctotal} = req.body;
    db.query("SELECT * FROM hms.outpatient WHERE pid = ?", [pid], async (error, results) => {
        if(error) 
            throw error;

        if(results.length <= 0){
            return res.render('billing', {
                message: 'No patient with this id', type : 'outgenerate'});
        }    
            
        db.query("INSERT INTO hms.bill SET ?", {medtotal:0, doctotal}, (error) => {
            if(error) 
                throw error;
            db.query("SELECT MAX(billno) AS billno FROM hms.bill", async (error, results2) => {
                if(error) 
                    throw error;
                db.query("UPDATE hms.outpatient SET billno = ? WHERE pid = ?", [results2[0].billno, pid],(error) => {
                    if(error) 
                        throw error;
                    
                    printoutBill(pid, res);
                });
            });  
        });
    });
};