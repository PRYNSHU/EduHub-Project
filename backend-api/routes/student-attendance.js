const express = require('express')
const router = express.Router()
const con = require("../db")
const getUserActiveSession = require("../user-functions")

// Set Students Attendance
router.post("/", (req, res) => {
    const userId = res.locals.userId
    const data = req.body
    const batchId = data.batchId
    const date = new Date(data.date + " UTC").toISOString().slice(0, 10)
    const attendanceData = JSON.stringify(data.data)

    const insertData = [batchId, date, attendanceData, userId]

    con.query(`insert into erp_students_attendance(batchId,attendanceDate,data,uploadBy) values(?) `, [insertData], (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        res.send({ message: "Attendance set successfully", success: true })

    })
})

// Update students attendance
router.put("/", async (req, res) => {
    let data = req.body

    const studentId = data.studentId
    const remarks = data.remarks
    const status = data.status[0]
    const batchId = data.batchId
    const date = data.date

    let attendanceData = await new Promise(resolve => {

        con.query(`select data from erp_students_attendance where attendanceDate=? and batchId=?`, [date,batchId], (err, result) => {
            resolve(JSON.parse(result[0].data))
        })
    })

    let thisStudent = attendanceData.find(a => a.studentId == studentId)
    thisStudent.remarks = remarks
    thisStudent.status = status

    con.query(`update erp_students_attendance set data = ? where attendanceDate=? and batchId=? `, [JSON.stringify(attendanceData), date,batchId], (err, result) => {

        if (err) {
            return res.status(500).end(err.message)
        }

        res.send({ success: result.changedRows > 0, message: "Attendance updated successfully" })
    })
})

// get attendance by batchId and date
router.get("/batch/:batchId/date/:date", async (req, res) => {
    const batchId = req.params.batchId
    const date = req.params.date

    const students = await new Promise((resolve, reject) => {
        con.query(`select es.name,es.studentId,es.rollNo,es.phone from erp_students es inner join erp_students_cbs escbs on es.studentId=escbs.studentId where escbs.batchId=? `, [batchId], (err, result) => {

            if (err) {
                reject(err)
            }

            resolve(result)
        })
    })

    const status = {
        A: "Absent",
        P: "Present",
        L: "On Leave"
    }

    con.query(`select data from erp_students_attendance where batchId=? and date(attendanceDate)=?`, [batchId,date], (err, result) => {

        if (result.length == 0) {
            return res.send([])
        }

        result = JSON.parse(result[0].data)

        result.forEach(r => {
            let student = students.find(s => s.studentId == r.studentId)

            r.status = status[r.status]

            if (student) {
                r.name = student.name
                r.rollNo = student.rollNo
                r.phone = student.phone
            }

        })

        res.send(result)

    })
})

// get students by student data
router.get("/batch/:batchId/:studentData", async (req, res) => {
    const sessionId = await getUserActiveSession(res.locals.userId)
    const batchId = req.params.batchId
    const studentData = req.params.studentData

    let append = ""
    let whereAdded = false

    if (+batchId) {
        append += ` where escbs.batchId=${batchId}`
        whereAdded = true
    }

    if (studentData != "undefined") {
        let rollNo = isNaN(+studentData) ? -1 : +studentData
        let sql = ` (es.name like '%${studentData}%' or es.rollNo = ${rollNo} ) `

        if (whereAdded) {
            append += ` and ${sql}`
        } else {
            append += ` where ${sql}`
            whereAdded = true
        }

    }

    if (whereAdded) {
        append += ` and escbs.sessionId=${sessionId} `
    } else {
        append += ` where escbs.sessionId=${sessionId}`
        whereAdded = true
    }

    console.log(append)

    con.query(`select es.name,es.studentId,escbs.batchId,es.rollNo,es.phone from erp_students es inner join erp_students_cbs escbs on es.studentId=escbs.studentId ${append}`, (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        res.send(result)
    })

})

//Get attendance by studentId and batchId
router.get("/student/:studentId/batch/:batchId", (req, res) => {
    const studentId = req.params.studentId
    const batchId = req.params.batchId

    const status = {
        A: "Absent",
        P: "Present",
        L: "On Leave"
    }

    con.query(`select data,attendanceDate from erp_students_attendance where batchId=${batchId} `, (err, result) => {

        let studentAttendance = []

        result.forEach(r => {
            let data = JSON.parse(r.data)
            r.data = data
        })

        result.forEach(r => {
            let student = r.data.find(d => d.studentId == +studentId)
            student.attendanceDate = r.attendanceDate
            student.status = status[student.status]
            studentAttendance.push(student)
        })

        res.send(studentAttendance)
    })

})

module.exports = router