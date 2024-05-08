const express = require('express')
const router = express.Router()
const con = require("../db")
const fs = require('fs')
const readXlsxFile = require('read-excel-file/node');
const getUserActiveSession = require("../user-functions")

function getRenamedFileName(folderPath, fileName, count = 2) {
    const extension = fileName.split(".").pop()
    let name = fileName.split("." + extension)[0] + "-" + count + "." + extension
    let imagePath = folderPath + name

    if (fs.existsSync(imagePath)) {
        const temp = fileName.split("." + extension)[0] + "." + extension
        name = getRenamedFileName(folderPath, temp, count + 1)
    }

    return name
}

//Create New Offline Exam
router.post("/", async (req, res) => {
    const data = req.body

    let pdf = null
    let pdfPath = null
    const folderPath = "../public_html/uploads/exam-pdfs/"

    if (req.files != null) {
        pdf = req.files.pdf
        let fileExtension = pdf.name.split(".").pop()
        let fileName = data.examName.trim().toLowerCase().replace(/['"]+/g, '').split(" ").join("-")
        pdfPath = "" + fileName + "." + fileExtension

        if (fs.existsSync(folderPath + pdfPath)) {
            pdfPath = getRenamedFileName(folderPath, pdfPath)
        }
    }

    const sessionId = await getUserActiveSession(res.locals.userId)
    const examData = [data.examName, data.examCode, data.examDate, data.courseId, data.batchIds + "", data.category, res.locals.userId, pdfPath, sessionId]
    con.query(`insert into erp_exams(examName,examCode,examDate,courseId,batchId,category,createdBy,pdfPath,sessionId) values(?) `, [examData], (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        if (pdf) {
            pdf.mv(folderPath + pdfPath, err => {

                if (err) {
                    return res.send({ success: false, message: "Error while saving file" })
                }

            })
        }

        res.send({ message: 'Exam created successfully' })
    })
})

// Get Subjects for add subject which are common in Course
router.get("/:examId/subjects", (req, res) => {
    con.query(`select batchId from erp_exams where examId=?`, [req.params.examId], (err, result) => {
        let batchId = result[0].batchId
        let n = batchId ? batchId.split(",").length : 0
        batchId = batchId ? batchId : +batchId
        let sql = `select subject,subjectId from (select es.subject,es.subjectId,bs.batchId,COUNT(es.subjectId) cn from erp_subjects es inner join batches_subjects bs on es.subjectId = bs.subjectId where bs.batchId in (${batchId}) group by es.subjectId ) subs where cn >= ${n} `
        con.query(sql, (err2, result2) => {
            res.send(result2);
        })
    })
})

//get exam pdfs
router.get("/:examId/student-pdfs",(req,res)=>{
    let examId = req.params.examId
    con.query(`select esp.pdfPath,esp.signedPDFPath,esp.examId,esp.studentId,es.name,date_format(esp.timestamp,'%d-%b-%Y') as date from erp_exam_student_pdfs esp inner join erp_students es on es.studentId=esp.studentId where esp.examId=? order by es.name asc`,[examId],(err,result)=>{
        
        if(err){
            return res.status(500).end(err.message)
        }

        res.send(result)
    })
})

function getStudentNameById(studentId) {
	return new Promise(resolve => {
		con.query(`select name from erp_students where studentId=?`, [studentId], (err, result) => {
			resolve(result[0].name)
		})
	})
}


//Upload Studennt Pdf 
router.post("/student-pdf", async (req, res) => {

	let data = req.body
    let studentId = data.studentId
    let examId = data.examId
	let pdf = null
	let pdfPath = null
	const folderPath = "../public_html/uploads/student-signed-pdfs/"

	if (req.files != null) {

		let studentName = await getStudentNameById(studentId)

		pdf = req.files.pdf
		let fileExtension = pdf.name.split(".").pop()

		if (fileExtension != "pdf") {
			return res.status(500).end("Please choose PDF File Only")
		}

		let fileName = studentName.toLowerCase().replace(/['"]+/g, '').split(" ").join("-")
		pdfPath = "" + fileName + "." + fileExtension

		if (fs.existsSync(folderPath + pdfPath)) {
			pdfPath = getRenamedFileName(folderPath, pdfPath)
		}
	} else {
		return res.status(500).end("Please choose PDF")
	}

	let values = [
		pdfPath,
		examId,
		studentId
	]

	con.query(`update erp_exam_student_pdfs set signedPDFPath=? where examId=? and studentId=?`, values, (err, result) => {

		if (err) {
			return res.status(500).end(err.message)
		}

		pdf.mv(folderPath + pdfPath, err => {

			if (err) {
				return res.send({ success: false, message: "Error while saving file" })
			}

			res.send({ message: "PDF uploaded successfully", success: true })

		})

	})
})

// Get All Exams
router.get("/:examName/:examCategory/:courseId/:batchId", async (req, res) => {

    const userId = res.locals.userId
    const examName = req.params.examName
    const examCategory = req.params.examCategory

    const courseId = +req.params.courseId
    const batchId = +req.params.batchId

    let append = ""

    if (examName != "null") {
        append += ` and e.examName like '%${examName}%'`
    }

    if (examCategory != "null") {
        append += ` and e.category='${examCategory}'`
    }

    if (courseId) {
        append += ` and e.courseId=${courseId}`
    }

    if (batchId) {
        append += ` and e.batchId=${batchId} `
    }

    const sessionId = await getUserActiveSession(res.locals.userId)

    const subjectDetails = await new Promise(resolve => {
        con.query(`select exs.examId,exs.subjectId,es.subject,exs.passMarks,exs.totalMarks from erp_exam_subjects exs inner join erp_subjects es on es.subjectId=exs.subjectId `, (err, result) => {
            resolve(result)
        })
    })

    con.query(`select e.examId,e.examName,e.examCode,e.category,date_format(e.examDate,'%d-%b-%Y') examDate,ec.course,group_concat(distinct eb.batch) batch,e.courseId,e.batchId,eu.name as createdBy,exm.examId isMarksInserted from erp_exams e left join erp_courses ec on ec.courseId=e.courseId left join erp_batches eb on find_in_set(eb.batchId,e.batchId) left join erp_users eu on eu.userId=e.createdBy left join erp_exam_marks exm on exm.examId=e.examId where e.sessionId=${sessionId} ${append} group by e.examId order by e.examId desc `, (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        result.forEach(r => {
            r.isMarksInserted = r.isMarksInserted ? true : false
            let subjectDetail = subjectDetails.filter(sd => sd.examId == r.examId)
            r["subjectDetails"] = subjectDetail
        })

        res.send(result)
    })
})

//Add Subjects In Exams
router.post("/:examId/subjects", (req, res) => {
    let examId = req.params.examId
    let subjects = req.body
    let sql = "insert into erp_exam_subjects(examId,subjectId,passMarks,totalMarks) values "

    subjects.forEach(s => {
        if (!s.passMarks) {
            s.passMarks = Math.ceil(s.totalMarks * 33 / 100)
        }
        sql += `(${examId},${s.subjectId},${s.passMarks},${s.totalMarks}),`
    })

    sql = sql.replace(/,(?=[^,]*$)/, '')
    con.query(sql, (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        res.send({ message: 'Subjects Added Successfully' })
    })
})

//Update Exam
router.put("/", (req, res) => {
    let data = req.body
    let examData = [data.examName, data.examCode, data.courseId, data.batchIds.toString(), data.category, data.examDate, data.examId]
    let sql = `update erp_exams set examName=?,examCode=?,courseId=?,batchId=?,category=?,examDate=? where examId=?`
    con.query(sql, examData, (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        res.send({ success: result.changedRows > 0, message: 'Exam updated successfully' })
    })
})

//Update Exam Subjects
router.put("/:examId/subject", async (req, res) => {
    let examId = req.params.examId
    let subject = req.body
    con.query(`update erp_exam_subjects set passMarks=?,totalMarks=? where examId=? and subjectId=?`, [subject.passMarks, subject.totalMarks, examId, subject.subjectId], (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        res.send({ success: result.changedRows > 0, message: 'Subject updated successfully' })
    })
})

//Delete exam
router.delete("/:examId/", (req, res) => {
    let examId = req.params.examId

    con.query(`delete from erp_exams where examId=? `, [examId], (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        res.send({ success: result.affectedRows > 0 })
    })
})

//Delete subject from exam
router.delete("/:examId/subject/:subjectId", (req, res) => {
    let examId = req.params.examId
    let subjectId = req.params.subjectId

    con.query(`delete from erp_exam_subjects where examId=? and subjectId=? `, [examId, subjectId], (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        con.query('delete from erp_exam_marks where examId=? and subjectId=? ', [examId, subjectId])
        res.send({ success: result.affectedRows > 0 })
    })
})

//get Insert marks data
router.get("/:examId/insert-marks", async (req, res) => {
    let examId = req.params.examId

    let subjects = await new Promise(resolve => {
        con.query(`select exs.subjectId,null as marks,null as correct,null as wrong,null as absent,es.subject from erp_exam_subjects exs inner join erp_subjects es on es.subjectId=exs.subjectId where exs.examId=?`, [examId], (err, result) => {
            resolve(result)
        })
    })

    con.query("select est.studentId,est.name,est.rollno,eb.batch,null as absent from erp_students est inner join erp_students_cbs escbs on escbs.studentId=est.studentId inner join erp_exams e on find_in_set(escbs.batchId,e.batchId) left join erp_batches eb on eb.batchId=escbs.batchId where e.examId=? and e.sessionId=escbs.sessionId group by est.studentId order by eb.batch asc,est.rollNo asc ", [examId], (err, students) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        let batches = {}

        students.forEach(s => {
            if (!(s.batch in batches)) {
                let stud = students.filter(st => st.batch == s.batch)
                stud.forEach(stu => stu["subjects"] = subjects)
                batches[s.batch] = stud
            }
        })

        res.send({ subjects, batches })
    })
})

// Insert Exam Marks
router.post("/:examId/insert-marks", (req, res) => {
    let examId = req.params.examId
    let insertData = req.body
    insertData.forEach(d => {
        d.subjects.forEach(s => {
            let data = [examId, s.subjectId, d.studentId, s.absent ? null : s.marks, s.absent ? null : s.correct, s.absent ? null : s.wrong, s.absent ? true : false]
            con.query(`insert into erp_exam_marks (examId,subjectId,studentId,marks,correct,wrong,attendance) values(?)`, [data], (err, result) => {
                if (err)
                    res.status(500).end(err.sqlMessage)
            })
        })
    })

    res.send({ message: 'Marks inserted successfully' })
})

// get Exam marks by examid
router.get("/:examId/marks", async (req, res) => {
    let examId = req.params.examId
    let marksSql = `select exm.subjectId,exm.id marksId,es.subject,exm.studentId,exm.marks,exm.correct,exm.wrong,exm.attendance from erp_exam_marks exm inner join erp_subjects es on es.subjectId=exm.subjectId inner join erp_students est on est.studentId=exm.studentId inner join erp_students_cbs es_cbs on es_cbs.studentId=est.studentId and es_cbs.active=1 inner join erp_batches eb on eb.batchId=es_cbs.batchId where exm.examId=? order by eb.batch asc,est.rollno asc,exm.subjectId`

    let marks = await new Promise(resolve => {
        con.query(marksSql, [examId], (err, result) => {
            resolve(result)
        })
    })

    con.query(`select exm.studentId,est.name,eb.batch,est.rollno,exm.attendance from erp_exam_marks exm inner join erp_exams ex on ex.examId=exm.examId inner join erp_students est on est.studentId=exm.studentId inner join erp_batches eb on eb.batchId=ex.batchId where exm.examId=? group by exm.studentId order by eb.batch asc,est.rollno asc `, [examId], (err, students) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        students.forEach(st => {
            let myMarks = marks.filter(m => m.studentId == st.studentId)
            st["marks"] = myMarks
        })
        let batches = {}
        students.forEach(s => {
            if (!(s.batch in batches)) {
                batches[s.batch] = students.filter(st => st.batch == s.batch)
            }
        })
        res.send(batches)
    })
})

//Update Marks
router.put("/marks", (req, res) => {
    const marks = req.body
    let sql = ''
    marks.forEach(m => {
        sql += `update erp_exam_marks set marks=${m.marks},wrong=${m.wrong},correct=${m.correct},attendance=${m.attendance} where id=${m.marksId};`
    })

    con.query(sql, (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        res.send({ message: 'Marks updated Successfully' })
    })

})

function getExamSubjectsById(examId) {
    return new Promise(resolve => {
        con.query(`select exs.totalMarks,exs.subjectId,esub.subject from erp_exam_subjects exs inner join erp_subjects esub on esub.subjectId=exs.subjectId where exs.examId=${examId}`, (err, result) => {
            resolve(result)
        })
    })
}

//Get Exam Report
router.get("/:examId/report", async (req, res) => {
    const examId = req.params.examId
    const subjectDetails = await getExamSubjectsById(examId)
    con.query(`SELECT est.name,eb.batch,exm.attendance absent, GROUP_CONCAT(esub.subject,'$',IFNULL(exm.marks,0),'$',IFNULL(exm.correct,0),'$',IFNULL(exm.wrong,0),'$',exm.attendance order by exm.subjectId) as marksData FROM erp_exam_marks exm inner join erp_exams ex on ex.examId=exm.examId inner join erp_students est on est.studentId=exm.studentId inner join erp_subjects esub on esub.subjectId=exm.subjectId inner join erp_batches eb on eb.batchId=ex.batchId where exm.examId=? group by exm.studentId order by eb.batch ASC, sum(exm.marks) desc `, [examId], (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        result.forEach(r => {
            if (r.marksData) {
                let marksData = r.marksData.split(",")
                let temp = []
                let totalMarks = 0
                let totalCorrect = 0
                let totalWrong = 0
                marksData.forEach(md => {
                    let data = md.split("$")
                    let subject = data[0]
                    let marks = +(+data[1]).toFixed(2)
                    let correct = +data[2]
                    let wrong = +data[3]
                    let absent = +data[4]

                    totalMarks += +marks
                    totalWrong += +wrong
                    totalCorrect += +correct
                    temp.push({ subject, marks, correct, wrong, absent })
                })
                r["subjects"] = temp
                r["totalMarks"] = totalMarks
                r["totalCorrect"] = totalCorrect
                r['totalWrong'] = totalWrong
            }
            delete r.marksData
        })

        let batches = {}

        result.forEach(r => {
            if (!(r.batch in batches)) {
                batches[r.batch] = result.filter(rr => rr.batch == r.batch)
            }
        })
        res.send({ batches, subjectDetails })
    })
})



// Upload marks by excel file
router.post("/:examId/upload-excel", async (req, res) => {

    let examId = req.params.examId
    let subject_subjectId = {}
    let studentRoll_studentId = {}
    let markAbsent = req.body.markAbsent == "false" ? false : true
    let subjectsInExam = []
    let examCategory = await new Promise((resolve) => {
        con.query(`select category from erp_exams where examId=?`, [examId], (err, result) => {
            resolve(result[0].category)
        })
    })

    await new Promise(resolve => {
        con.query("select subjectId,subject from erp_subjects where subjectId in (select subjectId from erp_exam_subjects where examId=?)", [examId], (err, result) => {
            result.forEach(r => {
                subject_subjectId[r.subject] = r.subjectId
                subjectsInExam.push(r.subject)
            })
            resolve(result)
        })
    })

    await new Promise(resolve => {
        con.query("select rollno,studentId from erp_students where batchId = (select batchId from erp_exams where examId=?)", [examId], (err, result) => {
            result.forEach(r => studentRoll_studentId[r.rollno] = r.studentId)
            resolve(result)
        })
    })

    if (req.files != null) {
        let file = req.files.marksFile
        file.mv(file.name, (err) => {
            if (err)
                return console.log(err)
            readXlsxFile(file.name).then((rows) => {
                fs.existsSync(file.name) ? fs.unlinkSync(file.name) : null

                if (examCategory == "O")
                    for (let i = 0; i < rows[1].length; i++) {
                        //For marks
                        if (i % 3 == 1) {
                            if (rows[1][i] != "Marks") {
                                return res.send({ success: false, message: "Column 'Marks' not provided at number " + (i + 1) })
                            }
                        }
                        // For Correct
                        if (i % 3 == 2) {
                            if (rows[1][i] != "Correct") {
                                return res.send({ success: false, message: "Column 'Correct' not provided at number " + (i + 1) })
                            }
                        }
                        // For Wrong
                        if (i % 3 == 0 && i >= 3) {
                            if (rows[1][i] != "Wrong") {
                                console.log(rows[1][i])
                                return res.send({ success: false, message: "Column 'Wrong' not provided at number " + (i + 1) })
                            }
                        }
                    }
                else if (examCategory == "S")
                    for (let i = 0; i < rows[1].length; i++) {
                        if (i > 0) {
                            if (rows[1][i] != "Marks") {
                                return res.send({ success: false, message: "Column 'Marks' not provided at number " + (i + 1) })
                            }
                        }
                    }

                let subjects = rows[0].filter(r => r)

                let subjectsNotUploaded = []
                subjectsInExam.forEach(s => {
                    if (!subjects.includes(s)) {
                        subjectsNotUploaded.push(s)
                    }
                })

                if (subjectsNotUploaded.length) {
                    return res.send({ success: false, subjectsNotUploaded })
                }

                let wrongSubjectsUploaded = []
                subjects.forEach(s => {
                    if (!subjectsInExam.includes(s)) {
                        wrongSubjectsUploaded.push(s)
                    }
                })

                if (wrongSubjectsUploaded.length) {
                    return res.send({ success: false, wrongSubjectsUploaded })
                }

                let rollsUploaded = []
                for (let i = 2; i < rows.length; i++) {
                    rollsUploaded.push(+rows[i][0])
                }

                let wrongRollsUploaded = []
                for (let roll of rollsUploaded) {
                    if (!(roll in studentRoll_studentId)) {
                        wrongRollsUploaded.push(roll)
                    }
                }

                if (wrongRollsUploaded.length) {
                    return res.send({ success: false, wrongRollsUploaded })
                }

                let rollsNotUploaded = []
                for (let rollNo in studentRoll_studentId) {
                    if (!rollsUploaded.includes(+rollNo)) {
                        rollsNotUploaded.push(+rollNo)
                    }
                }

                if (rollsNotUploaded.length && !markAbsent) {
                    return res.send({ success: false, rollsNotUploaded })
                }

                let sql = ""
                if (examCategory == "O") {
                    sql = `insert into erp_exam_marks(examId,subjectId,studentId,marks,correct,wrong,attendance) values `

                    for (let i = 2; i < rows.length; i++) {
                        for (let j = 0; j < subjects.length; j++) {
                            let subject = subjects[j]
                            let subjectId = subject_subjectId[subject]
                            let rollNo = rows[i][0]
                            let studentId = studentRoll_studentId[rollNo]
                            let marks = rows[i][j * 3 + 1]
                            let correct = rows[i][j * 3 + 2]
                            let wrong = rows[i][j * 3 + 3]
                            sql += `(${examId},${subjectId},${studentId},${marks},${correct},${wrong},0),`
                        }
                    }
                }
                else if (examCategory == "S") {
                    sql = `insert into erp_exam_marks(examId,subjectId,studentId,marks,attendance) values `

                    for (let i = 2; i < rows.length; i++) {
                        for (let j = 0; j < subjects.length; j++) {
                            let subject = subjects[j]
                            let subjectId = subject_subjectId[subject]
                            let rollNo = rows[i][0]
                            let studentId = studentRoll_studentId[rollNo]
                            let marks = rows[i][j + 1]
                            sql += `(${examId},${subjectId},${studentId},${marks},0),`
                        }
                    }
                }
                sql = sql.substr(0, sql.length - 1)
                con.query(sql, (err, result) => {
                    if (err)
                        return res.status(500).end(err.sqlMessage)
                    if (markAbsent) {
                        markNotInExcelAsAbsent(rollsNotUploaded, examId, subject_subjectId, studentRoll_studentId)
                    }
                    res.send({ success: true, message: "Marks uploaded successfully" })
                })
            })
        })
    } else {
        res.status(500).end("Please choosed excel file")
    }
})

function markNotInExcelAsAbsent(notInExcel, examId, subject_subjectId, studentRoll_studentId) {
    let sql = `insert into erp_exam_marks(examId,subjectId,studentId,attendance) values `
    notInExcel.forEach(r => {
        for (let subject in subject_subjectId) {
            let studentId = studentRoll_studentId[r]
            let subjectId = subject_subjectId[subject]
            sql += `(${examId},${subjectId},${studentId},1),`
        }
    })

    sql = sql.substr(0, sql.length - 1)

    con.query(sql, (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage + err.sql)
    })
}

module.exports = router