const express = require('express')
const router = express.Router()
const con = require("../db")
const fs = require("fs")
const getUserActiveSession = require("../user-functions")

router.get("/test-reports/:testId", (req, res) => {
    const userId = res.locals.userId
    const testId = req.params.testId

    let sql = `select dt.*,t.id as test_id,date_format(t.publish_end_datetime,'%d-%M-%Y %h:%i:%s %p') as publish_end_datetime ,date_format(dt.done_time,'%d-%M-%Y %h:%i:%s %p') as done_time,now() as nowtime,t.name from done_tests dt inner join test t on t.id=dt.test_id where dt.user_id=${userId} and dt.status=1 and dt.test_id=${testId} order by dt.id desc`
    con.query(sql, (err, tests) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        res.send(tests)
    })
})

// Get batches subjects ids for single lecture
async function getLectureBatchesSubjectsIds(onlineLectureId) {
    return new Promise(resolve => {
        con.query(`select fromTime,toTime,courseId,batchId,subjectId,orderNo,onlineLectureId from online_lectures_subjects ols where ols.onlineLectureId = ? `, [onlineLectureId], (err, result) => {
            resolve(result)
        })
    })
}

//get SIngle lecture details
router.get("/:lectureId", (req, res) => {
    console.log("rwqerwe")
    let onlineLectureId = req.params.lectureId
    con.query(`select onlineLectureId,title,lectureSRC,typeId,downloadable,dateTime from online_lectures where onlineLectureId = ? `, [
        onlineLectureId
    ], async (err, result) => {

        for (let i = 0; i < result.length; i++) {
            let batchesSubjects = await getLectureBatchesSubjectsIds(result[i].onlineLectureId)
            result[i]["batches_subjects"] = batchesSubjects
        }
        
        res.send(result[0])
    })
})

async function getLectureBatchesSubjects() {
    return new Promise(resolve => {
        con.query(`select ols.onlineLectureId,s.subject,eb.batch,date_format(ols.fromTime,'%d-%b-%y %h:%i:%s %p') fromTime,date_format(ols.toTime,'%d-%b-%y %h:%i:%s %p') toTime from online_lectures_subjects ols inner join erp_batches eb on eb.batchId= ols.batchId inner join erp_subjects s on s.subjectId = ols.subjectId`, (err, result) => {
            resolve(result)
        })
    })
}

//Sort online lectures

router.put("/sort-lectures", (req, res) => {
    let lectures = req.body.lectures
    let i = 0;
    lectures.forEach(lecture => {
        con.query(`update online_lectures_subjects set orderNo =${i} where id=${lecture.onlineLectureSubjectsId}`)
        i++
    })
    res.send({ message: 'Sorting Lectures' })
})

// get Online Lectures by Course batch and subjects For sort
router.get("/:courseId/:batchId/:subjectId/sort", async (req, res) => {
    let courseId = +req.params.courseId
    let batchId = +req.params.batchId
    let subjectId = +req.params.subjectId
    const sessionId = await getUserActiveSession(res.locals.userId)
    let append = ""
    let whereAdded = false

    if (courseId) {
        append += ` where ols.courseId=${courseId}`
        whereAdded = true
    }

    if (batchId) {
        if (whereAdded)
            append += ` and ols.batchId=${batchId} `
        else {
            append += ` where ols.batchId=${batchId}`
            whereAdded = true
        }
    }

    if (subjectId) {
        if (whereAdded)
            append += ` and ols.subjectId=${subjectId} `
        else
            append += ` where ols.subjectId = ${subjectId} `
        whereAdded = true
    }

    if (whereAdded)
        append += ` and ol.sessionId=${sessionId}`
    else
        append += ` where ol.sessionId=${sessionId}`

    con.query(`select ols.id onlineLectureSubjectsId,ol.title,lt.type lectureType from online_lectures ol left join online_lectures_subjects ols on ols.onlineLectureId = ol.onlineLectureId left join lecture_types lt on lt.lectureTypeId = ol.typeId ${append} order by ols.orderNo asc`, async (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        res.send(result)
    })

})

// get Online Lectures by Course batch and subjects
router.get("/:courseId/:batchId/:subjectId", async (req, res) => {

    const courseId = +req.params.courseId
    const batchId = +req.params.batchId
    const subjectId = +req.params.subjectId
    const sessionId = await getUserActiveSession(res.locals.userId)
    let append = ""
    let whereAdded = false

    if (courseId) {
        append += ` where ols.courseId=${courseId}`
        whereAdded = true
    }

    if (batchId) {
        if (whereAdded)
            append += ` and ols.batchId=${batchId} `
        else {
            append += ` where ols.batchId=${batchId}`
            whereAdded = true
        }
    }

    if (subjectId) {
        if (whereAdded)
            append += ` and ols.subjectId=${subjectId} `
        else {
            append += ` where ols.subjectId = ${subjectId} `
            whereAdded = true
        }
    }

    if (whereAdded)
        append += ` and ol.sessionId=${sessionId}`
    else
        append += ` where ol.sessionId=${sessionId}`

    let sql = `select ol.onlineLectureId,ol.title,ol.lectureSRC,ol.downloadable,ol.datetime,ol.typeId,lt.type lectureType from online_lectures ol left join online_lectures_subjects ols on ols.onlineLectureId = ol.onlineLectureId left join lecture_types lt on lt.lectureTypeId = ol.typeId ${append} group by ol.onlineLectureId order by ol.onlineLectureId desc`

    con.query(sql, async (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)

        let lectureBatchesSubjects = await getLectureBatchesSubjects()

        for (let i = 0; i < result.length; i++) {
            let batchesSubjects = lectureBatchesSubjects.filter(lbs => lbs.onlineLectureId == result[i].onlineLectureId)
            result[i]["batches_subjects"] = batchesSubjects
        }

        res.send(result)
    })
})


//get Order of lecture
async function getLectureOrder(batchId, subjectId) {
    return new Promise(resolve => {
        con.query(`select max(orderNo) orderNo from online_lectures_subjects where batchId=? and subjectId=?`, [batchId, subjectId], (err, result) => {
            resolve(result.length == 0 ? 1 : result[0].orderNo + 1)
        })
    })
}

//Create Video Lecture
router.post("/video", async (req, res) => {
    const data = req.body
    const title = data.title
    const lectureSRC = data.videoSRC
    const batchesSubjects = data.batchesSubjects
    const sessionId = await getUserActiveSession(res.locals.userId)
    const lectureData = [
        title,
        lectureSRC,
        1,
        sessionId
    ]

    con.query(`insert into online_lectures(title,lectureSRC,typeId,sessionId) values(?)`, [lectureData], async (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        const onlineLectureId = result.insertId
        let sql = `insert into online_lectures_subjects(onlineLectureId,courseId,batchId,subjectId,orderNo,fromTime,toTime) values `
        batchesSubjects.forEach(async (bs, index) => {
            let orderNo = await getLectureOrder(bs.batchId, bs.subjectId)
            sql += ` (${onlineLectureId},${bs.courseId},${bs.batchId},${bs.subjectId},${orderNo},'${bs.fromTime}','${bs.toTime}'),`
            if (index == batchesSubjects.length - 1) {
                sql = sql.replace(/,(?=[^,]*$)/, '')
                con.query(sql, (error, rs) => {
                    if (error)
                        return res.status(500).end(error.sqlMessage)
                    res.send({ message: 'Lecture Created Successfully' })
                })
            }
        })
    })
})

//Update Video Lecture
router.put("/video", async (req, res) => {
    let data = req.body
    let lectureId = data.onlineLectureId
    let title = data.title
    let lectureSRC = data.videoSRC
    let batchesSubjects = data.batchesSubjects

    con.query(`update online_lectures set title=?,lectureSRC=? where onlineLectureId=? `, [title, lectureSRC, lectureId], (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        con.query(`delete from online_lectures_subjects where onlineLectureId = ? `, [lectureId])
        let sql = `insert into online_lectures_subjects(onlineLectureId,courseId,batchId,subjectId,orderNo,fromTime,toTime) values `
        batchesSubjects.forEach(async (bs, index) => {
            let orderNo = await getLectureOrder(bs.batchId, bs.subjectId)
            sql += ` (${lectureId},${bs.courseId},${bs.batchId},${bs.subjectId},${orderNo},'${bs.fromTime}','${bs.toTime}'),`
            if (index == batchesSubjects.length - 1) {
                sql = sql.replace(/,(?=[^,]*$)/, '')
                con.query(sql, (error, rs) => {
                    if (error)
                        return res.status(500).end(error.sqlMessage)
                    res.send({ message: 'Lecture updated successfully' })
                })
            }
        })
    })
})


//Create Notes Lecture
router.post("/notes", async (req, res) => {
    const data = req.body
    const title = data.title
    const downloadable = +data.downloadable
    const batchesSubjects = JSON.parse(data.batchesSubjects)
    const sessionId = await getUserActiveSession(res.locals.userId)
    let notesSource = ""
    let notesFile = null
    if (req.files != null) {
        notesFile = req.files.file
        let random = new Date().getTime()
        notesSource = "/uploads/notes/" + random + "-" + notesFile.name
        notesSource = notesSource.replace(/&/ig, '').replace(/\s+/ig, " ").split(" ").join("-")
    }

    const lectureData = [
        title,
        notesSource,
        downloadable,
        2,
        sessionId
    ]

    con.query(`insert into online_lectures(title,lectureSRC,downloadable,typeId,sessionId) values(?)`, [lectureData], async (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        const onlineLectureId = result.insertId
        let sql = `insert into online_lectures_subjects(onlineLectureId,courseId,batchId,subjectId,orderNo,fromTime,toTime) values `
        batchesSubjects.forEach(async (bs, index) => {
            let orderNo = await getLectureOrder(bs.batchId, bs.subjectId)
            sql += ` (${onlineLectureId},${bs.courseId},${bs.batchId},${bs.subjectId},${orderNo},'${bs.fromTime}','${bs.toTime}'),`
            if (index == batchesSubjects.length - 1) {
                sql = sql.replace(/,(?=[^,]*$)/, '')
                con.query(sql, (error, rs) => {
                    if (error)
                        return res.status(500).end(error.sqlMessage)

                    if (notesFile) {
                        notesFile.mv("../public_html/" + notesSource, function (err) {
                            if (err)
                                return res.status(500).send(err);
                        })
                    }

                    res.send({ message: 'Lecture Created Successfully' })
                })
            }
        })
    })
})

//Update Notes Lecture
router.post("/notes/update", async (req, res) => {
    let data = req.body
    let onlineLectureId = data.onlineLectureId
    let title = data.title
    let downloadable = +data.downloadable
    let batchesSubjects = JSON.parse(data.batchesSubjects)

    let notesData = await new Promise(resolve => {
        con.query(`select lectureSRC from online_lectures where onlineLectureId=?`, [onlineLectureId], (err, result) => {
            resolve(result[0])
        })
    })

    let notesSource = notesData.lectureSRC
    let notesFile = null
    if (req.files != null) {
        notesFile = req.files.file
        let random = new Date().getTime()
        notesSource = "/uploads/notes/" + random + "-" + notesFile.name
        notesSource = notesSource.replace(/&/ig, '').replace(/\s+/ig, " ").split(" ").join("-")
    }

    lectureData = [
        title,
        downloadable,
        notesSource,
        onlineLectureId
    ]

    con.query(`update online_lectures set title=?,downloadable=?,lectureSRC=? where onlineLectureId=?`, lectureData, async (err, result) => {
        if (err)
            return res.status(500).end(err.sql)
        con.query(`delete from online_lectures_subjects where onlineLectureId = ? `, [onlineLectureId])

        let sql = `insert into online_lectures_subjects(onlineLectureId,courseId,batchId,subjectId,orderNo,fromTime,toTime) values `

        batchesSubjects.forEach(async (bs, index) => {

            let orderNo = await getLectureOrder(bs.batchId, bs.subjectId)
            sql += ` (${onlineLectureId},${bs.courseId},${bs.batchId},${bs.subjectId},${orderNo},'${bs.fromTime}','${bs.toTime}'),`

            if (index == batchesSubjects.length - 1) {
                sql = sql.replace(/,(?=[^,]*$)/, '')
                con.query(sql, (error, rs) => {

                    if (error)
                        return res.status(500).end(error.sqlMessage)

                    if (notesFile) {
                        notesFile.mv("../public_html/" + notesSource, function (err) {
                            if (err)
                                return res.status(500).send(err)
                            if (fs.existsSync("../public_html/" + notesData.lectureSRC))
                                fs.unlinkSync("../public_html/" + notesData.lectureSRC)
                        })
                    }

                    res.send({ message: 'Lecture Updated Successfully' })
                })
            }
        })
    })
})

//Create Test Lecture
router.post("/test", async (req, res) => {
    const data = req.body
    const title = data.title
    const testAccessCode = data.testAccessCode
    const batchesSubjects = data.batchesSubjects
    const sessionId = await getUserActiveSession(res.locals.userId)
    const lectureData = [
        title,
        testAccessCode,
        3,
        sessionId
    ]

    con.query(`insert into online_lectures(title,lectureSRC,typeId,sessionId) values(?)`, [lectureData], async (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        const onlineLectureId = result.insertId
        let sql = `insert into online_lectures_subjects(onlineLectureId,courseId,batchId,subjectId,orderNo,fromTime,toTime) values `
        batchesSubjects.forEach(async (bs, index) => {
            let orderNo = await getLectureOrder(bs.batchId, bs.subjectId)
            sql += ` (${onlineLectureId},${bs.courseId},${bs.batchId},${bs.subjectId},${orderNo},'${bs.fromTime}','${bs.toTime}'),`
            if (index == batchesSubjects.length - 1) {
                sql = sql.replace(/,(?=[^,]*$)/, '')
                con.query(sql, (error, rs) => {
                    if (error)
                        return res.status(500).end(error.sqlMessage)
                    res.send({ message: 'Test Created Successfully' })
                })
            }
        })
    })
})


//Update Test Lecture
router.put("/test", async (req, res) => {
    let data = req.body
    let lectureId = data.onlineLectureId
    let title = data.title
    let testAccessCode = data.testAccessCode
    let batchesSubjects = data.batchesSubjects

    con.query(`update online_lectures set title=?,lectureSRC=? where onlineLectureId=? `, [title, testAccessCode, lectureId], (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        con.query(`delete from online_lectures_subjects where onlineLectureId = ? `, [lectureId])
        let sql = `insert into online_lectures_subjects(onlineLectureId,courseId,batchId,subjectId,orderNo,fromTime,toTime) values `
        batchesSubjects.forEach(async (bs, index) => {
            let orderNo = await getLectureOrder(bs.batchId, bs.subjectId)
            sql += ` (${lectureId},${bs.courseId},${bs.batchId},${bs.subjectId},${orderNo},'${bs.fromTime}','${bs.toTime}'),`
            if (index == batchesSubjects.length - 1) {
                sql = sql.replace(/,(?=[^,]*$)/, '')
                con.query(sql, (error, rs) => {
                    if (error)
                        return res.status(500).end(error.sqlMessage)
                    res.send({ message: 'Test updated successfully' })
                })
            }
        })
    })
})


// Delete Single Lecture
router.delete("/:onlineLectureId", (req, res) => {
    let onlineLectureId = req.params.onlineLectureId
    con.query("select lectureSRC from online_lectures where onlineLectureId=?", [onlineLectureId], (err, result) => {
        if (err)
            return req.status(500).end(err.sqlMessage)
        if (fs.existsSync("../public_html/" + result[0].lectureSRC)) {
            fs.unlinkSync("../public_html/" + result[0].lectureSRC)
        }
        con.query(`delete from online_lectures where onlineLectureId=? `, [onlineLectureId], (err2, result2) => {
            if (err2)
                return req.status(500).end(err2.sqlMessage)
            res.send({ success: result2.affectedRows > 0 })
        })
    })
})

// Delete Multiple Lectures
router.delete("/multiple/:lectureIds", (req, res) => {
    let onlineLectureIds = req.params.lectureIds
    con.query(`delete from online_lectures where onlineLectureId in(?)`, [onlineLectureIds.split(",")], (err, result) => {
        if (err)
            return res.status(500).end(err.sql)
        res.send({ success: result.affectedRows > 0 });
    })
})

//Finished by students lectures
router.get("/finished-by-students/:batchId", async (req, res) => {
    let batchId = req.params.batchId

    let subjectLecturesCount = await new Promise(resolve => {
        con.query(`select es.subject,es.subjectId,count(ols.subjectId) as cnt,group_concat(ols.onlineLectureId) as onlineLectureIds from erp_subjects es left join online_lectures_subjects ols on ols.subjectId=es.subjectId where ols.batchId=? group by es.subjectId `, [batchId], (err, result) => {
            resolve(result)
        })
    })

    con.query(`select es.studentId,es.name,es.rollNo,lc.data from erp_students es left join lectures_completed lc on lc.studentid=es.studentId inner join erp_students_cbs es_cbs on es.studentId=es_cbs.studentId where es_cbs.batchId = ?`, [batchId], (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        res.send({ subjectsData: subjectLecturesCount, candidatesData: result })
    })
})

module.exports = router