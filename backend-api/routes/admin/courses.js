const { response } = require('express');
var express = require('express');
var router = express.Router();
var con = require("../../db");
const fs = require("fs")
const { getUserActiveSession } = require("../../user-functions")

// Create Course and batch
router.post('/', (req, res) => {
    let data = req.body;

    con.query(`insert into erp_courses (course,sessionId) values(?)`, [[data.course, data.sessionId]], (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        let courseId = result.insertId;
        let addBatches = 0;

        data.batches.forEach(batch => {
            if (batch) addBatches++;
        })

        let sql = "insert into erp_batches(courseId,batch) values "

        if (data.batches.length > 0) {

            data.batches.forEach(batch => {
                if (batch)
                    sql += ` (${courseId},'${batch}'),`
            })

            sql = sql.replace(/,(?=[^,]*$)/, '')

            con.query(sql, (err, result) => {

                if (err) {
                    return res.status(500).end(err.sqlMessage)
                }

                res.send({ message: `Course Added Successfully` })
            })
        }

        if (addBatches == 0) {
            res.send({ message: `Course Added Successfully` })
        }

    })
})
// Get All Courses with Bathes
router.get('/', async (req, res) => {
    const sessionId = await getUserActiveSession(res.locals.userId)
    getCoursesAndBatchesBySessionId(sessionId, res)
});

// Get All Courses with batches by SessionId
router.get("/by-session-id/:sessionId", async (req, res) => {
    const sessionId = req.params.sessionId
    getCoursesAndBatchesBySessionId(sessionId, res)
})

function getCoursesAndBatchesBySessionId(sessionId, res) {

    let batches;
    con.query(`select batchId,courseId,batch from erp_batches`, (err, res) => {
        batches = res;
    })

    con.query(`SELECT courseId,course FROM erp_courses where sessionId=${sessionId}`, (err, result) => {

        if (err) {
            res.status(500).send(err.sqlMessage)
            return
        }

        result.forEach(r => {
            r.batches = batches.filter(b => b.courseId == r.courseId);
            r.batches.forEach(b => delete b.courseId)
        })

        res.send(result);
    })
}

// Get Course_Batch
router.get("/batches", async (req, res) => {
    const sessionId = await getUserActiveSession(res.locals.userId)

    con.query(`select ec.course,eb.batch,eb.batchId from erp_batches eb inner join erp_courses ec on ec.courseId=eb.courseId where ec.sessionId=${sessionId}`, (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        res.send(result)
    })
})


//Assign Batches to Users
router.post("/batches/assign-to-users", (req, res) => {
    let userId = req.body.userId
    let batchIds = req.body.batchIds
    let sql = `insert into erp_users_batches (userId,batchId) values `
    batchIds.forEach(batchId => {
        sql += `(${userId},${batchId}),`
    })
    sql = sql.replace(/,(?=[^,]*$)/, '')
    con.query(sql, (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        res.send({ message: 'Batches Assigned Successfully' })
    })
})

//get Assigned Batches to users
router.get("/batches/assigned-to-users", async (req, res) => {

    let coursesBatches = await new Promise(resolve => {
        con.query(`select eub.userId,eub.batchId,ec.course,eb.batch from erp_users_batches eub inner join erp_users eu on eu.userId=eub.userId inner join erp_batches eb on eb.batchId = eub.batchId inner join erp_courses ec  on ec.courseId = eb.courseId`, (err, result) => {
            resolve(result)
        })
    })

    con.query(`select eub.userId,eu.name from erp_users_batches eub inner join erp_users eu on eu.userId=eub.userId group by eub.userId`, (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)

        result.forEach(r => {
            let courseBatch = coursesBatches.filter(cb => cb.userId == r.userId)
            r["assignedBatches"] = courseBatch
        })

        res.send(result)
    })
})

//Remove Batches from users
router.delete("/batches/remove-from-users/:userId/:batchId", (req, res) => {
    let userId = req.params.userId
    let batchId = req.params.batchId
    con.query(`delete from erp_users_batches where userId=? and batchId=?`, [userId, batchId], (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        res.send({ success: result.affectedRows > 0 })
    })
})

//Get assigned subjects to batches
router.get("/batches/assigned-subjects", async (req, res) => {

    let subjects = await new Promise(resolve => {
        con.query(`select bs.batchId,bs.subjectId,es.subject from batches_subjects bs inner join erp_courses_subjects es on es.subjectId=bs.subjectId`, (err, result) => {
            resolve(result)
        })
    })

    con.query(`SELECT eb.batch,bs.batchId FROM batches_subjects bs left join erp_batches eb on eb.batchId=bs.batchId group by bs.batchId`, (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        result.forEach(rs => {
            let batchSubjects = subjects.filter(s => s.batchId == rs.batchId)
            rs["subjects"] = batchSubjects
        })
        res.send(result)
    })
})

//get assign subjects by batchId
router.get("/batch/:batchId/assigned-subjects", (req, res) => {
    let batchId = req.params.batchId
    con.query(`select es.subject,es.subjectId from erp_courses_subjects es inner join batches_subjects bs on es.subjectId = bs.subjectId where bs.batchId=? `, [batchId], (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        res.send(result)
    })
})

//get Batches with subjects in it
router.get("/batches/subjects", async (req, res) => {

    let subjects = await new Promise(resolve => {
        con.query(`select s.subject,bs.batchId,bs.subjectId from batches_subjects bs inner join erp_courses_subjects s on s.subjectId = bs.subjectId `, (err, result) => {
            resolve(result)
        })
    })

    con.query(`select batchId from erp_batches `, (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)

        result.forEach(rs => {
            let subs = subjects.filter(s => s.batchId == rs.batchId)
            rs["subjects"] = subs
            rs.subjects.forEach((s) => { delete s.batchId; })
        })
        res.send(result)
    })
})

/*Get Students by filter */
router.post("/students", (req, res) => {
    let data = req.body;

    let sql = "select es.studentId,es.name,es.rollno,es.phone,ec.course,eb.batch from erp_students es inner join erp_students_cbs escbs on escbs.studentId=es.studentId inner join erp_courses ec on ec.courseId=escbs.courseId inner join erp_batches eb on eb.batchId = escbs.batchId ";
    let whereAdded = false;

    if (data.courseId != 0) {
        sql += `where es.courseId = ${data.courseId} `
        whereAdded = true;
    }

    if (data.batchId != 0) {
        if (whereAdded) {
            sql += ` and es.batchId = ${data.batchId} `
        }
        else {
            sql += ` where es.batchId = ${data.batchId} `
            whereAdded = true
        }
    }

    if (data.name.trim()) {
        if (whereAdded) {
            sql += ` and es.name like '%${data.name}%' `
        }
        else {
            sql += ` where es.name like '%${data.name}%'`
            whereAdded = true
        }
    }

    if (data.rollno) {
        if (whereAdded) {
            sql += ` and es.rollno = ${data.rollno} `
        }
        else {
            sql += ` where es.rollno = ${data.rollno}`
        }
    }

    con.query(sql, (err, result) => {
        if (err)
            res.status(500).end(err.sqlMessage + " " + sql)
        res.send(result)
    })
})

//Update Course and Batch
router.put('/', async (req, res) => {
    let data = req.body;
    con.query(`update erp_courses set course=? where courseId=?`, [data.course, data.courseId], async (err, result) => {
        if (err) {
            res.status(500).send(err.sqlMessage); return;
        }
        res.send({ message: "Course Updated Successfully" });
    });
});

//Update Batch
router.put('/batch', async (req, res) => {
    let data = req.body;
    con.query(`update erp_batches set batch=? where batchId=? `, [data.batch, data.batchId], async (err, result) => {
        if (err) {
            res.status(500).send(err.sqlMessage); return;
        }
        res.send({ message: "Batch Updated Successfully" });
    });
});

// Insert Batches in course
router.post("/batches", (req, res) => {
    let batches = req.body.batches
    let courseId = req.body.courseId
    let sql = "insert into erp_batches(courseId,batch) values "

    batches.forEach((batch) => {
        sql += ` (${courseId},'${batch.batch}'),`
    })

    sql = sql.replace(/,(?=[^,]*$)/, '')

    con.query(sql, (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        res.send({ message: 'Batches Added Succesfully' })
    })

})

// Delete Course
router.delete('/:courseId', (req, res) => {
    con.query(`delete from erp_courses where courseId=?`, [req.params.courseId], (err, result) => {
        if (err) {
            res.status(500).send(err.sqlMessage)
        }
        res.send({ message: 'Course Deleted Successfully' });
    })
})

// Delete Multiple Courses
router.delete('/multiple/:ids', (req, res) => {
    let courseIds = req.params.ids.split(",")
    con.query(`delete from erp_courses where courseId in(?)`, [courseIds], (err, result) => {
        if (err) {
            res.status(500).send(err.sqlMessage)
        }
        res.send({ message: 'Course Deleted Successfully' });
    })
})

// Delete Batch
router.delete('/batch/:batchId', (req, res) => {
    con.query(`delete from erp_batches where batchId=?`, [req.params.batchId], (err, result) => {
        if (err) {
            res.status(500).send(err.sqlMessage)
            return
        }
        res.send({ success: result.affectedRows > 0 })
    })
})

//export this router to use in our index.js
module.exports = router;