const express = require('express')
const router = express.Router()
const con = require("../db")
const fs = require("fs")
const getUserActiveSession = require("../user-functions")

async function getCourseBatchSubjects(appendSql) {
    return await new Promise(resolve => {
        con.query(`select ec.course,ec.courseId,eb.batch,eb.batchId,es.subject,es.subjectId,cbs.assignmentId from erp_assignments_cbs cbs left join erp_courses ec on ec.courseId=cbs.courseId left join erp_batches eb on eb.batchId=cbs.batchId left join erp_subjects es on es.subjectId=cbs.subjectId ${appendSql} `, (err, result) => {
            resolve(result)
        })
    })
}

//Get Assignments By Course Batch Subject
router.get("/course/:courseId/batch/:batchId/subject/:subjectId", async (req, res) => {
    const courseId = +req.params.courseId
    const batchId = +req.params.batchId
    const subjectId = +req.params.subjectId
    const userId = res.locals.userId
    const sessionId = await getUserActiveSession(userId)

    let whereAdded = false
    let appendSql = ""
    if (courseId) {
        appendSql += ` where cbs.courseId=${courseId} `
        whereAdded = true
    }

    if (batchId) {
        if (whereAdded) {
            appendSql += ` and cbs.batchId=${batchId} `
        }
        else {
            appendSql += ` where cbs.batchId=${batchId} `
            whereAdded = true
        }
    }

    if (subjectId) {
        if (whereAdded) {
            appendSql += ` and cbs.subjectId=${subjectId} `
        }
        else {
            appendSql += ` where cbs.subjectId=${subjectId} `
            whereAdded = true
        }
    }

    let sessionSql = ""
    if (whereAdded)
        sessionSql = ` and a.sessionId=${sessionId} `
    else
        sessionSql = ` where a.sessionId=${sessionId} `

    let sql = `select a.assignmentId,a.title,a.path,a.uploadBy,date_format(a.dateTime,'%d-%b-%Y %h:%i:%s%p') dateTime,eu.name uploaderName from erp_assignments a inner join erp_assignments_cbs cbs on cbs.assignmentId=a.assignmentId left join erp_users eu on eu.userId=a.uploadBy ${appendSql + sessionSql} group by a.assignmentId order by a.assignmentId desc `
    con.query(sql, async (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)

        let courseBatchesSubjects = await getCourseBatchSubjects(appendSql)
        result.forEach(r => {
            let cbs = courseBatchesSubjects.filter(c => c.assignmentId == r.assignmentId)
            r["courseBatchesSubjects"] = cbs
        })

        res.send(result)
    })

})

//Upload new Assignment
router.post("/", async (req, res) => {

    const title = req.body.title
    const batchesSubjects = JSON.parse(req.body.batchesSubjects)
    const uploadBy = res.locals.userId
    const sessionId = await getUserActiveSession(uploadBy)
    let assignmentSource = null
    let assignmentFile = null
    if (req.files) {
        assignmentFile = req.files.assignment
        let random = new Date().getTime()
        assignmentSource = "uploads/assignments/" + random + "-" + assignmentFile.name
    }
    else {
        return res.send({ message: 'Please choose assignment file' })
    }

    const assignmentData = [title, assignmentSource, uploadBy,sessionId]

    con.query(`insert into erp_assignments(title,path,uploadBy,sessionId) values(?)`, [assignmentData], (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)

        let assignmentId = result.insertId

        let sql = `insert into erp_assignments_cbs(assignmentId,courseId,batchId,subjectId) values `

        batchesSubjects.forEach(bs => {
            sql += `(${assignmentId},${bs.courseId},${bs.batchId},${bs.subjectId}),`
        })

        sql = sql.replace(/,(?=[^,]*$)/, '')

        con.query(sql, (error, result2) => {
            if (error)
                return res.status(500).end(error.sqlMessage)
            if (assignmentFile) {
                assignmentFile.mv("../public_html/" + assignmentSource, function (err) {
                    if (err)
                        return res.status(500).send(err);
                })
            }
            res.send({ message: 'Assignment uploaded successfully' })
        })
    })
})

// Update Assignment
router.post("/update", async (req, res) => {

    let title = req.body.title
    let batchesSubjects = JSON.parse(req.body.batchesSubjects)
    let uploadBy = res.locals.userId
    let assignmentId = req.body.assignmentId

    let assignmentOldData = await new Promise((resolve) => {
        con.query(`select path from erp_assignments where assignmentId = ?`, [assignmentId], (err, result) => {
            resolve(result[0])
        })
    })

    let assignmentSource = assignmentOldData.path
    let assignmentFile = null
    if (req.files) {
        assignmentFile = req.files.assignment
        let random = new Date().getTime()
        assignmentSource = "uploads/assignments/" + random + "-" + assignmentFile.name
    }


    let assignmentData = [title, assignmentSource, uploadBy, assignmentId]

    con.query(`update erp_assignments set title=?,path=?,uploadBy=? where assignmentId=?`, assignmentData, (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)

        con.query(`delete from erp_assignments_cbs where assignmentId=?`, [assignmentId])

        let sql = `insert into erp_assignments_cbs(assignmentId,courseId,batchId,subjectId) values `

        batchesSubjects.forEach(bs => {
            sql += `(${assignmentId},${bs.courseId},${bs.batchId},${bs.subjectId}),`
        })

        sql = sql.replace(/,(?=[^,]*$)/, '')

        con.query(sql, (error, result2) => {
            if (error)
                return res.status(500).end(error.sqlMessage)
            if (assignmentFile) {
                assignmentFile.mv("../public_html/" + assignmentSource, function (err) {
                    if (err)
                        return res.status(500).send(err)
                    if (fs.existsSync("../public_html/" + assignmentOldData.path))
                        fs.unlinkSync("../public_html/" + assignmentOldData.path)
                })
            }
            res.send({ message: 'Assignment updated successfully' })
        })
    })
})

//Delete Assignment
router.delete("/:assignmentId", (req, res) => {
    let assignmentId = req.params.assignmentId

    con.query(`select path from erp_assignments where assignmentId=?`, [assignmentId], (err, result) => {
        if (err)
            return res.status(500).send(err)

        if (fs.existsSync("../public_html/" + result[0].path))
            fs.unlinkSync("../public_html/" + result[0].path)

        con.query(`delete from erp_assignments where assignmentId=? `, [assignmentId], (err, result) => {
            res.send({ success: result.affectedRows > 0 })
        })
    })
})


module.exports = router