const express = require('express')
const router = express.Router()
const con = require("../db")
const fs = require('fs')
const jwt = require('jsonwebtoken')
const { sendEmail } = require('../user-functions')
const RequestIp = require('@supercharge/request-ip')

const eighthSchool = 1
const eightSchoolOlympiads = 2
const ninthSchool = 3
const ninthSchoolOlympiadsNTSE = 4
const tenthSchool = 5
const tenthSchoolOlympiadsNTSE = 6
const eleventhBoard = 7
const eleventhNEET = 8
const eleventhJEE = 9
const twelvethBoard = 10
const twelvethNEET = 11
const twelvethJEE = 12

const courseMapping = {
    "8th_School": eighthSchool,
    "8th_School + Olympiads": eightSchoolOlympiads,
    "9th_School": ninthSchool,
    "9th_School + Olympiads/NTSE": ninthSchoolOlympiadsNTSE,
    "10th_School": tenthSchool,
    "10th_School + Olympiads/NTSE": tenthSchoolOlympiadsNTSE,
    "11th_Board": eleventhBoard,
    "11th_NEET": eleventhNEET,
    "11th_JEE": eleventhJEE,
    "12th_Board": twelvethBoard,
    "12th_NEET": twelvethNEET,
    "12th_JEE": twelvethJEE
}

function checkColumnExists(column, value) {
    return new Promise((resolve, reject) => {
        const table = column == "username" ? "login" : "erp_students"

        con.query(`select * from ${table} where ${column}=?`, [value], (err, result) => {
            err ? reject(err.message) : resolve(result.length > 0)
        })
    })
}

// Get Boards
router.get("/boards", (req, res) => {
    con.query(`select * from erp_boards`, (err, result) => {
        if (err) {
            return res.status(500).end(err.message)
        }
        res.send(result)
    })
})

// Get Indian States
router.get("/indian-states", (req, res) => {
    con.query(`select * from indianStates`, (err, result) => {
        if (err) {
            return res.status(500).end(err.message)
        }
        res.send(result)
    })
})


// Get Courses With Batches
router.get("/courses", async (req, res) => {

    let batches = await new Promise((resolve) => {
        con.query(`select batchId,courseId,batch from erp_batches`, (err, result) => {
            resolve(result)
        })
    })

    con.query(`SELECT courseId,course FROM erp_courses`, (err, result) => {

        if (err) {
            return res.status(500).send(err.sqlMessage)
        }

        result.forEach(r => {
            r.batches = batches.filter(b => b.courseId == r.courseId);
            r.batches.forEach(b => delete b.courseId)
        })

        res.send(result);
    })
})


function getOTP(length) {
    let digits = '0123456789';
    let OTP = '';

    for (let i = 0; i < length; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }

    return OTP;
}

router.post("/send-email-verification-otp", (req, res) => {
    const email = req.body.email
    let OTP = getOTP()

    const message = "Hi, OTP for your eduotic email verification is <b>" + OTP + "</b>"

    let expiryTime = new Date(+new Date() + 300 * 1000)

    const data = [
        email, OTP, expiryTime
    ]

    con.query(`insert into verify_email(email,otp,expiryDate) values(?)`, [data])

    sendEmail("n190121e@eduotics.com", email, "Email Verification", message)

    res.send({ success: true, message: "OTP sent to your email" })
})

function getStudentIdByEmail(email) {
    return new Promise((resolve, reject) => {
        con.query(`select studentId from erp_students where email=?`, [email], (err, result) => {
            resolve(result[0].studentId)
        })
    })
}

router.post("/verify-email", (req, res) => {
    const otp = req.body.otp

    con.query(`select * from verify_email where otp=? order by id desc limit 1`, [otp], (err, result) => {

        if (result.length == 0) {
            return res.send({ success: false, message: "OTP is wrong" })
        }

        let expiryTime = new Date(result[0].expiryDate)
        let now = new Date()

        if (now > expiryTime) {
            return res.send({ success: false, message: "OTP is expired" })
        }

        let email = result[0].email
        con.query(`update erp_students set active=1,isEmailVerified=1 where email = ?`, [email], async (err, result) => {

            if (err) {
                return res.status(500).end(err.message)
            }

            let userId = await getStudentIdByEmail(email)
            con.query(`delete from verify_email where email=?`, [email])

            let token = jwt.sign({
                userId,
                role: "candidate"
            }, "pinnacle_key", {
                expiresIn: '24h'
            })

            res.send({ success: true, userId, token })
        })

    })

})

function isMobileExists(mobile) {
    return new Promise((resolve, reject) => {
        con.query(`select studentId from erp_students where phone=?`, [mobile], (err, result) => {
            err ? reject(err.message) : resolve(result.length > 0)
        })
    })
}


//Check column Exists
router.get("/check-column-exist/:column/:value", async (req, res) => {
    const column = req.params.column
    const value = req.params.value

    try {
        const exists = await checkColumnExists(column, value)
        res.send({ exists })
    }
    catch (e) {
        return res.status(500).end(e)
    }
})

// Check If Last OPT was sent 30 Seconds Ago
function canResendOTP(mobile, ip) {
    console.log(ip)
    return new Promise((resolve, reject) => {
        con.query(`SELECT UNIX_TIMESTAMP(now())-UNIX_TIMESTAMP(date_sub(expiryTime, INTERVAL 5 Minute)) >=30 as canSendOTP FROM verify_otp where ip=? order by id desc limit 1`, [ip, mobile], (err, result) => {
            resolve(result.length == 0 || result[0].canSendOTP)
        })
    })
}

//verify-mobile-and-send-otp
router.get("/verify-mobile-and-send-otp/:mobile", async (req, res) => {
    const mobile = req.params.mobile
    const mobileRegex = /^[0-9]{10}$/;

    if (!mobileRegex.test(String(mobile).toLowerCase())) {
        return res.send({ success: false, message: "Mobile format is Invalid" })
    }

    try {

        if (await isMobileExists(mobile)) {
            return res.send({ success: false, message: `Mobile No. "${mobile}" is already Registered with us.` })
        }

        const OTP = getOTP(4)

        let expiryTime = new Date(+new Date() + 300000)
        expiryTime = new Date(expiryTime + " UTC").toISOString().slice(0, 19).replace("T", " ")

        const ip = RequestIp.getClientIp(req)

        if (!(await canResendOTP(mobile, ip))) {
            return res.send({ success: false, message: "You can Resend OTP after 30 Seconds" })
        }

        let data = [
            ip,
            mobile,
            OTP,
            expiryTime
        ]

        con.query(`insert into verify_otp(ip,mobile,otp,expiryTime) values(?)`, [data], (err, result) => {

            if (err) {
                return res.status(500).end(err.message)
            }

            res.send({ success: true, message: `OTP has been sent to Mobile No. "${mobile}" ` })
        })

    } catch (e) {
        res.status(500).end(e.toString())
    }
})


function isOTPValid(mobile, otp) {
    return new Promise((resolve, reject) => {
        con.query(`select * from verify_otp where mobile=? and otp=? order by id desc limit 1`, [mobile, otp], async (err, result) => {

            if (err) {
                return reject(err.message);
            }

            if (result.length == 0) {
                return reject("OTP is wrong")
            }

            let expiryTime = new Date(result[0].expiryTime)
            let now = new Date()

            if (now > expiryTime) {
                return reject("OTP is Expired")
            }

            resolve(true);
        })
    })
}


// Register new Student
router.post('/verify-otp-and-register', async (req, res) => {
    let data = req.body

    try {

        if (await checkColumnExists("phone", data.mobile)) {
            return res.send({ success: false, message: "Mobile No. already exists" })
        }

        await isOTPValid(data.mobile, data.otp)

    } catch (e) {
        return res.send({ success: false, message: e })
    }

    con.beginTransaction(error => {

        if (error) { throw error; }

        const studentData = [
            data.name,
            data.mobile,
            data.address,
            data.board,
            data.state,
            1
        ]

        con.query(`insert into erp_students(name,phone,address,board,state,active) values(?)`, [studentData], async (err, result) => {

            if (err) {
                res.status(500).end(err.sqlMessage)
                con.rollback();
                return
            }

            const studentId = result.insertId

            const courseId = courseMapping[data.course + "_" + data.batch]

            const cbsData = [
                studentId,
                courseId,
                courseId,
                3,
                1
            ]

            con.query(`insert into erp_students_cbs (studentId,courseId,batchId,sessionId,active) values(?)`, [cbsData], (err, result) => {

                if (err) {
                    res.status(500).end(err.message)
                    con.rollback()
                    return
                }

                con.query(`insert into student_course(studentId,courseId) values(?)`, [[studentId, courseId]])

                con.commit((err) => {

                    if (err) {
                        con.rollback()
                        return res.status(500).end(err.toString())
                    }

                    let token = jwt.sign({
                        userId: studentId,
                        role: "candidate"
                    }, "pinnacle_key", {
                        expiresIn: '24h'
                    })

                    con.query(`delete from verify_otp where mobile=? `, [data.mobile])

                    res.send({
                        success: true,
                        token,
                        userId: studentId,
                        message: "Authentication Successful"
                    })

                })
            })
        })
    })
})

function saveFile(file, path) {
    return new Promise((resolve, reject) => {

        if (!file) {
            return resolve({ success: true })
        }

        file.mv(path, err => {
            err ? reject("Error while saving File") : resolve({ success: true })
        })
    })

}

//export this router to use in our index.js
module.exports = router