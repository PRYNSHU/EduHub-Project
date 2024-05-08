const express = require('express')
const router = express.Router()
const con = require("../db")
const https = require("https")

//Create Schedule
router.post("/", (req, res) => {
    let daysFromToTime = req.body.daysFromToTime
    let coursesData = req.body.coursesData
    let coursesBatches = req.body.coursesBatches

    let subjectId = coursesData.subjectId
    let teacherId = coursesData.teacherId

    let fromDate = new Date(coursesData.fromDate + " UTC")
    let toDate = new Date(coursesData.toDate + " UTC")



    for (let i = fromDate.getTime(); i <= toDate.getTime(); i += 86400 * 1000) {
        let date = new Date(i)
        let fromTime = daysFromToTime[date.getDay()].fromTime
        let toTime = daysFromToTime[date.getDay()].toTime
        let isVirtual = daysFromToTime[date.getDay()].isVirtual
        let dateFormatted = new Date(date + " UTC").toISOString().split("T")[0]

        if (fromTime && toTime) {
            isVirtual = isVirtual || 0
            let sql = `insert into erp_timetable(subjectId,userId,isVirtual,date,fromTime,toTime)
             values(${subjectId},${teacherId},${isVirtual},'${dateFormatted}','${fromTime}','${toTime}')`

            con.query(sql, (err, result) => {

                if (err) {
                    return res.status(500).end(err.sqlMessage)
                }

                let scheduleId = result.insertId;
                let sql = `insert into erp_timetable_cb(scheduleId,courseId,batchId) values `

                coursesBatches.forEach(cb => {
                    sql += `(${scheduleId},${cb.courseId},${cb.batchId}),`
                })

                sql = sql.slice(0, sql.length - 1)
                con.query(sql)
            })

        }
    }

    res.send({ success: true, message: 'Schedule created successfully' })
})

//Create Single Schedule
router.post("/single", (req, res) => {
    let daysFromToTime = req.body.daysFromToTime
    let coursesData = req.body.coursesData
    let coursesBatches = req.body.coursesBatches

    let subjectId = coursesData.subjectId
    let teacherId = coursesData.teacherId

    let fromTime = daysFromToTime.fromTime
    let toTime = daysFromToTime.toTime
    let isVirtual = daysFromToTime.isVirtual
    let dateFormatted = coursesData.date.split(" ")[0]
    isVirtual = isVirtual || 0

    let sql = `insert into erp_timetable(subjectId,userId,isVirtual,date,fromTime,toTime) values (${subjectId},${teacherId},${isVirtual},'${dateFormatted}','${fromTime}','${toTime}')`

    con.query(sql, (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        let scheduleId = result.insertId
        let sql = `insert into erp_timetable_cb(scheduleId,courseId,batchId) values `

        coursesBatches.forEach(cb => {
            sql += `(${scheduleId},${cb.courseId},${cb.batchId}),`
        })

        sql = sql.slice(0, sql.length - 1)

        con.query(sql)

        res.send({ success: result.affectedRows > 0, message: 'Schedule created successfully' })
    })
})


//Update Schedule
router.put("/", (req, res) => {
    let data = req.body
    let date = data.date.split(" ")[0]
    let scheduleId = data.scheduleId
    let updateData = [data.subjectId, data.isVirtual || 0, data.fromTime, data.toTime, date, data.teacherId, data.scheduleId]
    con.query(`update erp_timetable set subjectId=?,isVirtual=?,fromTime=?,toTime=?,date=?,userId=? where id=? `, updateData, (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        con.query(`delete from erp_timetable_cb where scheduleId=?`, [scheduleId])
        let sql = `insert into erp_timetable_cb(scheduleId,courseId,batchId) values `

        data.coursesBatches.forEach(cb => {
            sql += `(${scheduleId},${cb.courseId},${cb.batchId}),`
        })

        sql = sql.slice(0, sql.length - 1)
        con.query(sql)

        res.send({ success: result.changedRows > 0, message: "Schedule Updated Successfully" })
    })
})

//Cancel Schedule
router.put("/cancel", (req, res) => {
    let scheduleId = req.body.scheduleId
    con.query(`update erp_timetable set isCancelled=1 where id=?`, [scheduleId], (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        res.send({ success: result.changedRows > 0 })
    })
})

//Delete Schedule
router.delete("/:scheduleId", (req, res) => {
    let scheduleId = req.params.scheduleId
    con.query(`delete from erp_timetable where id=?`, [scheduleId], (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        res.send({ success: result.affectedRows > 0 })
    })
})

//Get All Schedules
router.get("/", (req, res) => {
    con.query(`select et.id,et.isCancelled,isEnded,time_format(et.classStartTime,'%h:%i %p') classStartTime,date_format(et.date,'%d-%b-%Y') date,time_format(et.fromTime,'%h:%i %p') fromTime ,time_format(et.toTime,'%h:%i %p') toTime ,et.isVirtual,et.start_url,eu.name,group_concat(ec.course,' - ', eb.batch) as cb, ec.course,eb.batch,es.subject from erp_timetable et inner join erp_timetable_cb et_cb on et_cb.scheduleId=et.id inner join erp_users eu on eu.userId=et.userId left join erp_courses ec on ec.courseId=et_cb.courseId left join erp_batches eb on eb.batchId=et_cb.batchId inner join erp_subjects es on es.subjectId=et.subjectId group by et.id order by time(et.fromTime) asc `, (err, result) => {
        res.send(result)
    })
})

function getScheduleCoursesBatches(scheduleId) {
    return new Promise((resolve, reject) => {
        con.query(`select * from erp_timetable_cb where scheduleId=${scheduleId}`, (err, result) => {
            err ? reject(err) : resolve(result)
        })
    })
}

//Get SIngle shedule details
router.get("/:scheduleId", async (req, res) => {
    con.query(`select * from erp_timetable where id = ?`, [req.params.scheduleId], async (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        for (let i = 0; i < result.length; i++) {
            let coursesBatches = await getScheduleCoursesBatches(result[i].id)
            result[i].coursesBatches = coursesBatches
        }

        res.send(result[0])
    })
})

async function getMeetingStatus(meetingId) {

    return new Promise(resolve => {
        const options = {
            headers: {
                authorization: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOm51bGwsImlzcyI6IlBOV2loN3pmUy1XeG9iNW1RRDEzcUEiLCJleHAiOjE2NDA5MzIyMDAsImlhdCI6MTYxODkwMDUxMX0.qwzBgbiS7neGksYjUAsuncsIauVSVl96-j__rAOfmsw' // Do not publish or share your token with anyone.
            }
        }

        https.get('https://api.zoom.us/v2/meetings/' + meetingId, options, (res) => {

            res.on('data', (d) => {
                resolve(JSON.parse(Buffer.from(d).toString()).status)
            })

        }).on('error', (e) => {
            resolve(e)
        })
    })
}

async function getFreeMeeting() {
    return await getMeetingStatus(5855028321) == "waiting" ?
        5855028321 : await getMeetingStatus(3843438623) == "waiting" ?
            3843438623 : await getMeetingStatus(3115431592) == "waiting" ?
                3115431592 : await getMeetingStatus(2672939761) == "waiting" ? 2672939761 : null
}

async function getZAKByCreatingMeeting(userId) {
    return new Promise(resolve => {
        const meeting = {
            topic: 'Physics Class',
            duration: 90,
            password: '1234',
            type: 1,
        }

        const options = {
            port: 443,
            method: 'POST',
            headers: {
                authorization: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOm51bGwsImlzcyI6IlBOV2loN3pmUy1XeG9iNW1RRDEzcUEiLCJleHAiOjE2NDA5MzIyMDAsImlhdCI6MTYxODkwMDUxMX0.qwzBgbiS7neGksYjUAsuncsIauVSVl96-j__rAOfmsw',
                'Content-Type': 'application/json',
                'Content-Length': JSON.stringify(meeting).length,
            }
        }

        const req = https.request(`https://api.zoom.us/v2/users/${userId}/meetings`, options, (res) => {
            res.on('data', (d) => {
                let data = JSON.parse(Buffer.from(d).toString())
                console.log(data)
                let start_url = data.start_url
                let zak = start_url.split("zak=")[1]
                resolve(zak)
            })
        })

        req.on('error', (e) => {
            resolve(e)
        })

        req.write(JSON.stringify(meeting))
        req.end()
    })
}

let canProceed = true

router.post("/start-meeting", async (req, res) => {
    let intervalId = null
    if (canProceed) {
        await startMeeting(req, res)
    }
    else {
        res.status(500).end("Please try again after few seconds")
    }

})


async function startMeeting(req, res) {
    canProceed = false
    let scheduleId = req.body.id

    let schedule = await new Promise(resolve => {
        con.query(`select start_url,join_url from erp_timetable where id=?`, [scheduleId], (err, result) => {
            resolve(result[0])
        })
    })

    if (schedule.start_url) {
        canProceed = true
        return res.send({ success: true, start_url: schedule.start_url, join_url: schedule.join_url })
    }

    let freeMeetingId = await getFreeMeeting()

    let meetingId_userId = {
        "5855028321": "rishabh.pinnacle@gmail.com",
        "3843438623": "novel.pinnacle@gmail.com",
        "3115431592": "romy.pinnacle@gmail.com",
        "2672939761": "jindal.novel@gmail.com"
    }

    let meetingId_Password = {
        "5855028321": "eE1sN05FbE5pa0xtaHJ1V2I0YkJaQT09",
        "3843438623": "WVF0VHhkZldibkRVVURBTGZVU0hHUT09",
        "3115431592": "Q041dFVob2RSZldhVFdKdWZieFZZUT09",
        "2672939761": "amdEQ09kWVNnaTNpYU04NmVlS21qUT09"
    }

    if (freeMeetingId) {
        let userId = meetingId_userId[freeMeetingId + ""]
        let zak = await getZAKByCreatingMeeting(userId)
        let pwd = meetingId_Password[freeMeetingId + ""]
        let start_url = `https://us02web.zoom.us/s/${freeMeetingId}?zak=${zak}`
        let join_url = `https://us02web.zoom.us/j/${freeMeetingId}?pwd=${pwd}`

        con.query(`update erp_timetable set join_url=?,start_url=?,classStartTime=now() where id=?`, [join_url, start_url, scheduleId],async (err, result) => {
            res.send({ success: true, start_url, join_url })
           
            if (await zoomMeetingStatus(freeMeetingId) == "Not Available") {
                canProceed = true
            }
            else {
                setTimeout(() => { canProceed = true }, 15000);
            }
        })

    }
    else {
        res.send({ success: false, message: "No Free Account Available" })
        canProceed = true
    }
}


function zoomMeetingStatus(meetingId) {
    return new Promise((resolve, reject) => {
        con.query(`select status from zoom_accounts where zoomMeetingId=${meetingId}`, (err, result) => {
            err ? reject(err) : resolve(result[0].status)
        })
    })
}

module.exports = router