const express = require('express')
const router = express.Router()
const con = require("../../db")
const fs = require('fs')
const {getUserActiveSession} = require("../../user-functions")
const https = require("https")

//Get User Roles
router.get("/roles", (req, res) => {
    con.query(`SELECT * FROM user_roles`, (err, result) => {
        res.send(result)
    })
})

function getUserInformationById(userId) {
    return new Promise((resolve, reject) => {
        con.query(`select * from erp_users where userId=?`, userId, (err, result) => {
            err ? reject(err) : resolve(result[0])
        })
    })
}

function sendEmail(to, subject, message) {

    let data = [];
    data.push("to=" + encodeURIComponent(to))
    data.push("subject=" + encodeURIComponent(subject))
    data.push("message=" + encodeURIComponent(message))
    data = data.join("&")

    const options = {
        port: 443,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': data.length,
        }
    }

    const req = https.request(`https://www.pinnacloeducare.com/pinnacle-common-api/send-email.php`, options, (res) => {
        res.on('data', (d) => {
            let data = JSON.parse(Buffer.from(d).toString())
            console.log("Data ", data)
        })
    })

    req.write(data)
    req.end()
}

//Get All Schedules
router.get("/schedule", (req, res) => {
    const userId = res.locals.userId

    con.query(`select et.id,et.isCancelled,time_format(et.classStartTime,'%h:%i %p') classStartTime,date_format(et.date,'%d-%b-%Y') date,time_format(et.fromTime,'%h:%i %p') fromTime ,time_format(et.toTime,'%h:%i %p') toTime ,et.isVirtual,et.start_url,eu.name,group_concat(ec.course,' - ', eb.batch) as cb,ec.course,eb.batch,es.subject from erp_timetable et inner join erp_timetable_cb et_cb on et.id=et_cb.scheduleId inner join erp_users eu on eu.userId=et.userId inner join erp_courses ec on ec.courseId=et_cb.courseId inner join erp_batches eb on eb.batchId=et_cb.batchId inner join erp_subjects es on es.subjectId=et.subjectId where et.userId=? group by et.id order by time(et.fromTime) asc `, [userId], (err, result) => {
        res.send(result)
    })
})

// Get Todays followups
router.get("/follow-ups", (req, res) => {
    const userId = res.locals.userId
    con.query(`select rai.name,rai.phone,rai.admissionInquiryId from rec_admission_inquiries rai inner join rec_admission_inquiries_dates raid on rai.admissionInquiryId=raid.admissionInquiryId where raid.nextDate=date(now()) and rai.assignedTo=? `, [userId], (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        res.send(result)

    })
})

//Assign Work to Users
router.post("/assign-work", async (req, res) => {
    const userId = req.body.userId
    const work = req.body.work
    const workDate = req.body.workDate
    const assignedBy = res.locals.userId
    const data = [userId, work, workDate, assignedBy]

    try {

        let { email, name } = await getUserInformationById(userId);
        name = name.split(" ")[0];

        const message = `Hi ${name},<br> Following work has been assigned to you.<br> ${work}`;

        sendEmail(email, "Work Assigned", message);
    } catch (e) {
        return res.status(500).end(e.toString())
    }

    con.query(`insert into users_work(userId,work,workDate,assignedBy) values(?)`, [data], (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        res.send({ success: true, message: "Work assigned successfully" })
    })

})

//Update Assigned Work of Users
router.put("/assigned-work", async (req, res) => {
    const id = req.body.id
    const userId = req.body.userId
    const work = req.body.work
    const workDate = req.body.workDate

    const data = [userId, work, workDate, id]

    try {

        let { email, name } = await getUserInformationById(userId);
        name = name.split(" ")[0];

        const message = `Hi ${name},<br> Following work has been updated.<br> ${work}`;

        sendEmail(email, "Work Updated", message);
    } catch (e) {
        return res.status(500).end(e.toString())
    }

    con.query(`update users_work set userId=?,work=?,workDate=? where id=?`, data, (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        res.send({ success: true, message: "Work updated successfully" })
    })

})

// get assigned work of all users
router.get("/assigned-work", (req, res) => {
    con.query("select w.id,w.userId,u.name,u.roleId,date_format(w.workDate,'%d-%b-%Y') workDate,w.work,w.isCarriedOver,w.isCompleted from users_work w inner join erp_users u on u.userId=w.userId order by w.id desc", (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        res.send(result)

    })
})

// delete assigned work
router.delete("/assigned-work/:id", (req, res) => {
    const workId = req.params.id

    con.query(`delete from users_work where id=?`, [workId], (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        res.send({ success: result.affectedRows > 0 })

    })

})

// get my assigned work
router.get("/my-assigned-work", (req, res) => {
    const userId = res.locals.userId

    con.query("select u.name,w.id,w.work,w.workDate,w.isCarriedOver,w.isCompleted from users_work w inner join erp_users u on u.userId=w.assignedBy where w.userId=? order by w.isCarriedOver desc,w.id desc", [userId], (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        res.send(result)

    })
})

// carry over work to next date
router.put("/carry-over-work", (req, res) => {
    const id = req.body.id
    con.query(`update users_work set workDate = DATE_ADD(workDate,INTERVAL 1 DAY),isCarriedOver=1 where id=? `, [id], (err, result) => {

        if (err) {
            return res.status(500).end(err.message)
        }

        res.send({ success: result.changedRows > 0, message: 'Work Carry Over Successfully' })

    })
})

// mark work as done
router.put("/mark-work-done", (req, res) => {
    const id = req.body.id
    con.query(`update users_work set isCompleted = 1 where id=? `, [id], (err, result) => {

        if (err) {
            return res.status(500).end(err.message)
        }

        res.send({ success: result.changedRows > 0, message: 'Work marked as completed Successfully' })

    })
})

async function isTimingsSet(userId) {
    return new Promise(resolve => {
        con.query(`select userId from users_time where userId=${userId}`, (err, result) => {
            resolve(result.length > 0)
        })
    })
}

// Change Session of users
router.put("/session", (req, res) => {
    const userId = res.locals.userId
    const sessionId = req.body.sessionId
    con.query(`update session_active set sessionId=? where userId=? `, [sessionId, userId], (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        res.send({ message: "Session Changed Successfully" })

    })
})

//get user session Id
router.get("/session", async (req, res) => {
    const sessionId = await getUserActiveSession(res.locals.userId)
    res.send({ sessionId })
})

// Set Users Timings
router.put("/timings", async (req, res) => {
    const userId = req.body.userId
    const fromTime = req.body.fromTime
    const toTime = req.body.toTime

    const isTimingSet = await isTimingsSet(userId)

    if (isTimingSet) {
        con.query(`update users_time set fromTime=?,toTime=? where userId=?`, [fromTime, toTime, userId], (err, result) => {
            if (err)
                return res.status(500).end(err.sqlMessage)
            res.send({ success: result.changedRows > 0, message: "Timings set successfully" })
        })
    }
    else {
        const insertData = [userId, fromTime, toTime]
        con.query(`insert into users_time(userId,fromTime,toTime) values(?)`, [insertData], (err, result) => {
            if (err)
                return res.status(500).end(err.sqlMessage)
            res.send({ success: result.affectedRows > 0, message: "Timings set successfully" })
        })
    }

})

// Get User Timings
router.get("/timings", (req, res) => {
    con.query(`SELECT eu.userId,eu.name,ut.fromTime,ut.toTime FROM users_time ut right join erp_users eu on eu.userId = ut.userId`, (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        res.send(result)
    })
})

//Get Single User Details
router.get("/profile", (req, res) => {
    con.query('select * from erp_users where userId=?', [res.locals.userId], (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        res.send(result[0])
    })
})

// Get Attendance
router.get("/attendance", async (req, res) => {
    res.send(await getAttendanceByUserId(res.locals.userId))
})

// Get Attendance By UserId
router.get("/:userId/attendance", async (req, res) => {
    res.send(await getAttendanceByUserId(req.params.userId))
})

async function getAttendanceByUserId(userId) {

    const from_to_time = await new Promise(resolve => {
        con.query(`select * from users_time where userId=${userId}`, (err, result) => {
            resolve(result[0])
        })
    })

    return new Promise((resolve) => {
        con.query(`select userid as userId,datetime from erp_attendance where userid=${userId} order by id asc`, (err, result) => {
            resolve({ entries: result, from_to_time })
        })
    })
}

// Get monthly attendance by userId
router.get("/:userId/monthly-attendance", async (req, res) => {
    try {
        res.send(await getMonthlyAttendanceByUserId(req.params.userId))
    }
    catch (e) {
        res.status(500).end(e.toString())
    }
})

async function getMonthlyAttendanceByUserId(userId) {
    return new Promise((resolve, reject) => {
        con.query(`SELECT userId,date_format((date(datetime)),'%d-%b-%Y') as date,GROUP_CONCAT(date_format(datetime,'%H:%i %p') ORDER BY datetime) as datetime FROM erp_attendance where userId=? group by date(datetime)`, [userId], (err, result) => {
            err ? reject(err) : resolve(result)
        })
    })
}

router.get("/attendance/today", async (req, res) => {

    const entries = await new Promise(resolve => {
        con.query(`select userId,date_format(datetime,'%h:%i %p') as entry,datetime from erp_attendance where date(datetime)=date(now())`, (err, result) => {
            if (err) { }
            resolve(result)
        })
    })

    const from_to_time = await new Promise(resolve => {
        con.query(`select * from users_time`, (err, result) => {
            resolve(result)
        })
    })

    con.query(`SELECT name,userId FROM erp_users`, (err, users) => {
        if (err) return res.status(500).end(err.sqlMessage)
        users.forEach(u => {
            const myEntries = entries.filter(e => e.userId == u.userId)
            const myFromToTime = from_to_time.find(ft => ft.userId == u.userId)
            u.entries = myEntries
            u.from_to_time = myFromToTime
        })
        res.send(users)
    })
})

//Get User Permissions
router.get("/permissions", (req, res) => {
    con.query(`select permissions from erp_users where userId=?`, [res.locals.userId], (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        if (!result.length) {
            return res.status(500).end("No Permissions Found")
        }

        res.send(result[0].permissions)
    })
})

// Create User
router.post('/', async (req, res) => {
    const data = req.body
    const sessionId = await getUserActiveSession(res.locals.userId)
    let image = null
    let userImage = null

    let signature = null
    let signatureImage = null

    if (req.files != null) {
        userImage = req.files.image
        let random = new Date().getTime()
        image = "/uploads/users/" + random + userImage.name
        signatureImage = req.files.signature ? req.files.signature : null
        signature = signatureImage ? "/uploads/users/signatures/" + random + signatureImage.name : ""
    }

    const defaultPermissions = await new Promise(resolve => {
        con.query(`select permissions from default_role_permissions where roleId=?`, [data.roleId], (err, result) => {
            if (!result.length) {
                 return resolve("[]")
            }
            resolve(result[0].permissions)
        })
    })

    con.beginTransaction()

    let loginData = [
        data.username,
        data.password,
        'users',
        data.biometricId
    ]

    con.query(`insert into login(username,password,role,bioid) values(?)`, [loginData], (err, result) => {
        if (err) {
            res.status(500).end(err.sqlMessage)
            return con.rollback();
        }

        let userId = result.insertId
        let userData = [
            userId,
            data.employeeId,
            data.name,
            data.email,
            data.phone,
            data.qualification,
            data.city,
            data.state,
            data.address,
            data.dob,
            data.regDate,
            data.gender,
            image,
            signature,
            defaultPermissions,
            data.roleId
        ]

        con.query(`insert into erp_users(userId,employeeId,name,email,phone,qualification,city,state,address,dob,regDate,gender,image,signature,permissions,roleId) values(?)`, [userData], (errr, result2) => {
            if (errr) {
                res.status(500).end(errr.sqlMessage)
                return con.rollback();
            }
            con.query(`insert into session_active(userId,sessionId) values(?)`, [[userId, sessionId]], (e, r) => {

                if (e) {
                    res.status(500).end(e.sqlMessage)
                    return con.rollback()
                }

                con.commit()

                if (userImage) {
                    userImage.mv("../public_html/" + image, function (err) {
                        if (err)
                            return res.status(500).send(err);
                    })
                }
                if (signatureImage) {
                    signatureImage.mv("../public_html/" + signature, function (err) {
                        if (err)
                            return res.status(500).send(err);
                    })
                }
                res.send({ success: true, message: "User Added Successfully" })
            })
        })
    })
})

//Update User
router.post('/update', async (req, res) => {
    let data = req.body

    let userData = await new Promise(resolve => {
        con.query(`select image,signature from erp_users where userId=?`, [data.userId], (err, result) => {
            resolve(result[0])
        })
    })

    let image = userData.image
    let userImage = null

    let signature = userData.signature
    let signatureImage = null

    if (req.files != null) {
        userImage = req.files.image ? req.files.image : null
        let random = new Date().getTime()
        image = userImage ? "/uploads/users/" + random + userImage.name : ""

        signatureImage = req.files.signature ? req.files.signature : null
        signature = signatureImage ? "/uploads/users/signatures/" + random + signatureImage.name : ""

    }

    con.query(`update login set bioid = ? where id=?`, [data.biometricId, data.userId])

    let updateData = [
        data.name, data.employeeId, data.email, data.qualification, data.city, data.state, data.phone, data.address, data.dob, data.regDate, data.gender, image, signature, data.roleId, data.userId
    ]
    con.query(`update erp_users set name=?,employeeId=?,email=?,qualification=?,city=?,state=?,phone=?,address=?,dob=?,regDate=?,gender=?,image=?,signature=?,roleId=? where userId=?`, updateData, (err, result) => {
        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        if (userImage) {
            userImage.mv("../public_html/" + image, function (err) {
                if (err)
                    return res.status(500).end(err)
                if (fs.existsSync("../public_html/" + userData.image))
                    fs.unlinkSync("../public_html/" + userData.image)
            })
        }

        if (signatureImage) {
            signatureImage.mv("../public_html/" + signature, function (err) {
                if (err)
                    return res.status(500).end(err)
                if (fs.existsSync("../public_html/" + userData.signature))
                    fs.unlinkSync("../public_html/" + userData.signature)
            })
        }

        res.send({ success: true, message: "User Updated Successfully" })
    })

})


// Get All Users
router.get(`/`, (req, res) => {
    con.query(`select eu.*,date_format(eu.dob,'%d-%M-%Y') as dob,date_format(eu.regDate,'%d-%M-%Y') as regDate,r.roleName from erp_users eu left join user_roles r on r.roleId = eu.roleId left join login l on l.id=eu.userId `, (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        res.send(result)
    })
})

//Delete User
router.delete("/:id", (req, res) => {
    con.query(`delete from login where id = ?`, [req.params.id], (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        res.send({ success: result.affectedRows > 0 })
    })
})

//Update User Permissions 
router.put("/permissions", async (req, res) => {
    let userId = req.body.userId
    let permissions = JSON.stringify(req.body.permissions)

    con.query(`update erp_users set permissions = ? where userId=? `, [permissions, userId], (err, result) => {
        res.send({ success: result.changedRows > 0, message: "Permissions changed successfully" })
    })
})


module.exports = router