const express = require('express')
const router = express.Router()
const con = require("../db")
const QuestionTypes = require("./question_types")
const fs = require('fs')
const { getUserActiveSession } = require("../user-functions")
const { TestType, MarkingScheme } = require("./constants/test")


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

function getCourseIdByStudentId(studentId) {
	return new Promise(resolve => {
		con.query(`select courseId from student_course where studentId=?`, [studentId], (err, result) => {
			resolve(result[0].courseId)
		})
	})
}

//Get Candidate courseId,BatchId,sessionId as {courseId,batchId,sessionId}
async function getCandidateCBS(userId) {
	return new Promise((resolve, reject) => {
		con.query(`select courseId,batchId,sessionId from erp_students_cbs where studentId = ? and active=1`, [userId], (err, result) => {

			if (err) {
				return reject(err.message)
			}

			if (result.length == 0) {
				return reject("No course and batch is active")
			}

			resolve({ courseId: result[0].courseId, batchId: result[0].batchId, sessionId: result[0].sessionId })
		})
	})
}


/*Get Test Settings */
function getSettings(testId) {
	return new Promise((resolve) => {
		con.query(`select * from test_settings where test_id=?`, [testId], (err, result) => {
			resolve(result[0])
		})
	})
}

//Get Course Subjects 
router.get("/course-subjects", async (req, res) => {
	const userId = res.locals.userId
	const courseId = await getCourseIdByStudentId(userId)
	con.query(`SELECT ecs.subjectId,ecs.subject,concat(substring(ecs.folderPath,16),ecs.image) image FROM erp_courses_subjects ecs where ecs.courseId=?`, [courseId], (err, result) => {
		if (err) {
			return res.status(500).end(err.message)
		}
		res.send(result)
	})
})

//Get attendance
router.get("/attendance", async (req, res) => {
	const studentId = res.locals.userId

	let batchId = null;

	try {
		batchId = await new Promise((resolve, reject) => {
			con.query(`select batchId from erp_students_cbs where studentId=? and active=1`, [studentId], (err, result) => {

				if (result.length == 0) {
					return reject("No course and batch is active");
				}

				resolve(result[0].batchId)
			})
		})
	} catch (e) {
		return res.status(500).end(e.toString())
	}


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

			if (!student) {
				return;
			}

			student.attendanceDate = r.attendanceDate
			student.status = status[student.status]
			studentAttendance.push(student)
		})

		res.send(studentAttendance)
	})

})

//get candidates by batchId for attendance
router.get("/batchid/:batchId", (req, res) => {
	const batchId = req.params.batchId
	con.query(`select es.studentId,null as remarks,'P' as status, es.name from erp_students es inner join erp_students_cbs escbs on es.studentId=escbs.studentId where escbs.batchId=? `, [batchId], (err, result) => {

		if (err) {
			return res.status(500).end(err.sqlMessage)
		}

		res.send(result)

	})
})

// get Candidates by rollNo or name
router.get("/rollno/:rollNo/name/:name", async (req, res) => {
	const sessionId = await getUserActiveSession(res.locals.userId)

	const rollNo = req.params.rollNo
	const name = req.params.name

	let append = ""
	let whereAdded = false

	if (name != "-") {

		if (whereAdded) {
			append += ` and name like '%${name}%'`
		} else {
			append += ` where name like '%${name}%'`
			whereAdded = true
		}

	}

	if (whereAdded) {
		append += ` and escbs.sessionId=${sessionId}`
	} else {
		append += ` where escbs.sessionId=${sessionId}`
	}

	con.query(`select es.name,es.studentId,es.image from erp_students es inner join erp_students_cbs escbs on escbs.studentId=es.studentId ${append}`, (err, result) => {

		if (err) {
			return res.status(500).end(err.message)
		}

		res.send(result)

	})

})

//Get Candidate sessions
router.get('/sessions', (req, res) => {
	const userId = res.locals.userId
	con.query(`select s.session,escbs.sessionId,ec.course,eb.batch from erp_students_cbs escbs inner join session_table s on s.id=escbs.sessionId inner join erp_batches eb on eb.batchId=escbs.batchId inner join erp_courses ec on ec.courseId=escbs.courseId where escbs.studentId=?`, [userId], (err, result) => {

		if (err) {
			res.status(500).end(err.sqlMessage)
		}

		res.send(result)

	})
})

//Change Session 
router.put('/session', (req, res) => {
	const sessionId = req.body.sessionId
	const userId = res.locals.userId
	con.query(`update erp_students_cbs set active=1 where sessionId=? and studentId=?`, [sessionId, userId], (err, result) => {

		if (err) {
			return res.status(500).end(err.sqlMessage)
		}

		con.query(`update erp_students_cbs set active=0 where studentId=? and sessionId!=? `, [userId, sessionId])

		res.send({ message: "Session Changed Successfully" })

	})
})

// Promote Candidate to new Batch
router.post('/promote', async (req, res) => {

	const data = req.body
	const courseId = data.courseId
	const batchId = data.batchId
	const sessionId = data.sessionId
	const studentId = data.studentId
	const active = 1

	const promoteData = [studentId, courseId, batchId, sessionId, active]

	const isAlreadyPromoted = await new Promise((resolve, reject) => {
		con.query(`select * from erp_students_cbs where studentId=? and courseId=? and batchId=?`, [studentId, courseId, batchId], (err, result) => {

			if (err) {
				reject(new Error(err))
			}

			resolve(result.length > 0)
		})
	})

	if (isAlreadyPromoted) {
		return res.send({ success: false, message: 'Student already in a Course and Batch in which you are trying to promote' })
	}

	await new Promise(resolve => {
		con.query(`update erp_students_cbs set active=0 where studentId=?`, [studentId], (err, result) => {
			resolve(result)
		})
	})

	con.query(`insert into erp_students_cbs(studentId,courseId,batchId,sessionId,active) values(?)`, [promoteData], (err, result) => {

		if (err) {
			return res.status(500).end(err.sqlMessage)
		}

		res.send({ success: true, message: "Student promoted successfully" })
	})
})

// Promote Candidates to new Batch
router.post('/promote-multiple', async (req, res) => {

	const data = req.body
	const courseId = data.courseId
	const batchId = data.batchId
	const sessionId = data.sessionId
	let studentIds = data.studentIds
	const active = 1
	const alreadyExistStudentIds = []
	const isAlreadyPromoted = await new Promise((resolve, reject) => {
		con.query(`select * from erp_students_cbs where studentId in (?) and courseId=? and batchId=?`, [studentIds, courseId, batchId], (err, result) => {

			if (err) {
				reject(new Error(err))
			}

			result.forEach(r => {
				alreadyExistStudentIds.push(r.studentId)
			})

			resolve(result.length > 0)
		})
	})

	studentIds = studentIds.filter(studentId => !alreadyExistStudentIds.includes(studentId))

	if (studentIds.length == 0) {
		return res.send({ success: false, message: 'No student available for promote' });
	}

	await new Promise(resolve => {

		con.query(`update erp_students_cbs set active=0 where studentId in (?)`, [studentIds], (err, result) => {
			resolve(result)
		})
	})

	let sql = "insert into erp_students_cbs(studentId,courseId,batchId,sessionId,active) values ";

	studentIds.forEach(studentId => {
		sql += ` (${studentId},${courseId},${batchId},${sessionId},1),`;
	})

	sql = sql.slice(0, sql.length - 1)

	con.query(sql, (err, result) => {

		if (err) {
			return res.status(500).end(err.sqlMessage)
		}

		res.send({ success: true, message: "Students promoted successfully" })
	})
})


// Create New Candidate
router.post('/', (req, res) => {
	const data = req.body
	let image = null
	let studentImage = null

	if (req.files != null) {
		studentImage = req.files.image
		const random = new Date().getTime()
		image = "/uploads/students/" + random + studentImage.name
	}

	con.beginTransaction(error => {

		if (error) { throw error; }

		const loginData = [
			data.username,
			data.password,
			'student'
		]

		con.query(`insert into login(username,password,role) values(?)`, [loginData], (err, result) => {

			if (err) {
				res.status(500).end(err.sqlMessage)
				con.rollback();
				return
			}

			const userId = result.insertId
			const studentData = [
				userId,
				data.name,
				data.email,
				data.city,
				data.state,
				data.mobile,
				data.address,
				data.dob,
				data.regDate,
				data.gender,
				image,
				1
			]

			con.query(`insert into erp_students(studentId,name,email,city,state,phone,address,dob,regDate,gender,image,active) values(?)`, [studentData], (errr, result2) => {

				if (errr) {
					res.status(500).end(errr.sqlMessage)
					con.rollback();
					return
				}

				const courseBatchSession = [userId, data.courseId, data.batchId, data.session, 1]
				con.query(`insert into erp_students_cbs(studentId,courseId,batchId,sessionId,active) values (?)`, [courseBatchSession], (e, r) => {
					if (e) {
						res.status(500).end(e.sqlMessage)
						con.rollback();
						return
					}

					con.commit(function (err) {

						if (err) {
							return con.rollback(function () {
								throw err
							})
						} else {
							if (studentImage) {
								studentImage.mv("../public_html/" + image, function (err) {
									if (err) {
										return res.status(500).send(err)
									}
								})
							}
							res.send({ success: true, message: "Student Added Successfully" })
						}
					})

				})

			})

		})

	})

})

//Update Candidate
router.post('/update', async (req, res) => {
	const data = req.body
	const sessionId = await getUserActiveSession(res.locals.userId)
	const candidateData = await new Promise(resolve => {
		con.query(`select image from erp_students where studentId=?`, [data.studentId], (err, result) => {
			resolve(result[0])
		})
	})

	let image = candidateData.image
	let studentImage = null

	if (req.files != null) {
		studentImage = req.files.image
		let random = new Date().getTime()
		image = "/uploads/students/" + random + studentImage.name
	}

	con.query(`update erp_students_cbs set courseId=?,batchId=?,active=1 where studentId=? and sessionId=?`,
		[data.courseId, data.batchId, data.studentId, sessionId])

	let updateData = [
		data.name, data.email, data.city, data.state, data.mobile, data.address, data.dob, data.regDate, data.gender, image, data.studentId
	]

	con.query(`update erp_students set name=?,email=?,city=?,state=?,phone=?,address=?,dob=?,regDate=?,gender=?,image=? where studentId=?`, updateData, (err, result) => {

		if (err) {
			res.status(500).end(err.sqlMessage)
		} else {
			if (studentImage) {
				studentImage.mv("../public_html/" + image, function (err) {
					if (err) {
						return res.status(500).send(err)
					}

					if (fs.existsSync("../public_html/" + candidateData.image)) {
						fs.unlinkSync("../public_html/" + candidateData.image)
					}
				})
			}

			res.send({ success: true, message: "Student Updated Successfully" })
		}
	})

})


/*Get candidate Data */
router.get("/", (req, res) => {
	let userId = res.locals.userId
	con.query(`select st.session as fy,escbs.sessionId,es.*,date_format(es.dob,'%d-%b-%Y') as dob,ec.course,eb.batch from erp_students es inner join erp_students_cbs escbs on escbs.studentId=es.studentId and escbs.active=1 left join erp_courses ec on ec.courseId=escbs.courseId left join erp_batches eb on eb.batchId=escbs.batchId left join session_table st on st.id=escbs.sessionId where es.studentId=?`, [userId], (err, result) => {

		if (err) {
			return res.status(500).end(err.sqlMessage)
		}
		res.send(result[0])
	})
})

// Delete Single Candidate
router.delete("/:studentId", (req, res) => {
	let studentId = req.params.studentId

	con.query(`delete from erp_students where studentId = ? `, [studentId], (err, result) => {

		if (err) {
			return res.status(500).end(err.sqlMessage)
		}

		res.send({ success: result.affectedRows > 0 })
	})
})

// Delete Multiple Candidates
router.delete("/multiple/:studentIds", (req, res) => {
	let studentIds = req.params.studentIds.split(",");

	con.query(`delete from erp_students where studentId in (?)`, [studentIds], (err, result) => {

		if (err) {
			return res.status(500).end(err.sqlMessage)
		}

		res.send({ success: result.affectedRows > 0 })
	})

})

// Get Filtered Candidates
router.get("/filtered/:batchId/:filterItem", async (req, res) => {
	const sessionId = await getUserActiveSession(res.locals.userId)
	const batchId = +req.params.batchId
	const filterItem = req.params.filterItem.replace("empty", '')
	let append = ""
	let whereAdded = false

	if (batchId) {
		append = ` where escbs.batchId = ${batchId} `
		whereAdded = true
	}

	if (filterItem) {
		const sql = ` (es.name like '%${filterItem}%' or es.phone = '${filterItem}' or es.city like '%${filterItem}%') `

		if (whereAdded) {
			append += ` and ${sql}`
		} else {
			append += ` where ${sql}`
			whereAdded = true
		}

	}

	if (whereAdded) {
		append += ` and escbs.sessionId=${sessionId}`
	} else {
		append += ` where escbs.sessionId=${sessionId}`
	}

	const sql = `select es.studentId,es.name,es.regDate,es.phone,date_format(es.dob,'%d-%M-%Y') dob,es.address,es.city,es.state,es.gender,es.image,es.active,ess.status,es.email,IFNULL(ec.course,'-') course,escbs.courseId,IFNULL(eb.batch,'-') batch,escbs.batchId,st.session,escbs.sessionId from erp_students es inner join erp_students_cbs escbs on es.studentId=escbs.studentId left join erp_courses ec on ec.courseId = escbs.courseId left join erp_batches eb on eb.batchId = escbs.batchId left join session_table st on st.id=escbs.sessionId left join login l on l.id=es.studentId left join erp_student_status ess on ess.statusId=es.active ${append} `
	con.query(sql, (err, result) => {

		if (err) {
			return res.status(500).end(err.sqlMessage)
		}

		res.send(result)
	})
})


//Change Status
router.put("/status", (req, res) => {
	con.query(`update erp_students set active = ? where studentId=?`, [req.body.statusId, req.body.studentId], (err, result) => {

		if (err) {
			return res.status(500).end(err.sqlMessage)
		}

		res.send({ success: result.changedRows > 0 })
	})
})

/*Get Noticeboard */
router.get("/noticeboards", async (req, res) => {
	try {
		let userId = res.locals.userId
		let { batchId, sessionId } = await getCandidateCBS(userId)

		con.query(`select en.noticeboardId,en.content,date_format(en.dateTime,'%d-%b-%Y %h:%i:%s%p') as dateTime,eu.name as uploadedBy from erp_noticeboard en inner join erp_noticeboard_batches encb on encb.noticeboardId=en.noticeboardId left join erp_users eu on eu.userId = en.uploadBy where find_in_set(?,encb.batchIds) and en.sessionId=? group by encb.noticeboardId order by en.noticeboardId desc`, [batchId, sessionId], (err, result) => {

			if (err) {
				return res.status(500).end(err.sqlMessage)
			}

			res.send(result)
		})
	} catch (e) {
		res.status(500).end(e.toString())
	}
})

/*Get assignments */
router.get("/assignments", async (req, res) => {
	try {
		const userId = res.locals.userId
		const { batchId, sessionId } = await getCandidateCBS(userId)
		con.query(`select ea.assignmentId,ea.title,ea.path,date_format(ea.datetime,'%d-%b-%Y %h:%i:%s %p') as dateTime,ea.uploadBy,eu.name,group_concat(es.subject) as subject from erp_assignments ea inner join erp_assignments_cbs eacbs on eacbs.assignmentId=ea.assignmentId inner join erp_subjects es on es.subjectId=eacbs.subjectId left join erp_users eu on eu.userId = ea.uploadBy where eacbs.batchId=? and ea.sessionId=? group by ea.assignmentId order by ea.assignmentId desc `, [batchId, sessionId], (err, result) => {

			if (err) {
				return res.status(500).end(err.sqlMessage)
			}

			res.send(result)
		})
	} catch (e) {
		res.status(500).end(e.toString())
	}
})

/*Get Online Lecture Subjects*/
router.get("/online-lecture-subjects", async (req, res) => {
	try {
		let userId = res.locals.userId
		let { batchId, sessionId } = await getCandidateCBS(userId)
		let subjects = await new Promise(resolve => {
			con.query(`select es.subjectId,es.subject,count(ols.subjectId) as lectureCount from online_lectures_subjects ols inner join online_lectures ol on ols.onlineLectureId = ol.onlineLectureId inner join erp_subjects es on es.subjectId = ols.subjectId where ols.batchId=? and ol.sessionId=? and ols.fromTime<=now() and ols.toTime>=now() group by ols.subjectId`, [batchId, sessionId], (err, result) => {

				if (err) {
					return res.status(500).end(err.sqlMessage)
				}

				resolve(result)
			})
		})

		res.send(subjects)
	} catch (e) {
		res.status(500).end(e.toString())
	}
})

//Get Classes 
router.get("/classes", async (req, res) => {
	try {
		let userId = res.locals.userId
		let { batchId } = await getCandidateCBS(userId)
		con.query(`select et.id,es.subject,date_format(et.date,'%d-%b-%Y') as date,time_format(et.fromTime,'%h:%i %p') fromTime,time_format(et.toTime,'%h:%i %p') toTime,et.isVirtual,et.join_url,u.name,u.gender from erp_timetable et inner join erp_timetable_cb et_cb on et_cb.scheduleId=et.id left join erp_subjects es on es.subjectId = et.subjectId left join erp_users u on u.userId = et.userId where et_cb.batchId = ${batchId}`, (err, result) => {

			if (err) {
				return res.status(500).end(err.sqlMessage)
			}

			res.send(result)
		})
	} catch (e) {
		res.status(500).end(e.toString())
	}
})

//Get Zoom UrL for join
router.get("/load-zoom-url/:scheduleId", (req, res) => {

	con.query(`select join_url from erp_timetable where id=?`, [req.params.scheduleId], (err, result) => {

		if (err) {
			return res.status(500).end(err.sqlMessage)
		}

		if (result[0].join_url) {
			res.send({ success: true, join_url: result[0].join_url })
		} else {
			res.send({ success: false, message: "Class not started yet,Please check again later" })
		}
	})
})

//Get Timetable
router.get("/timetable", async (req, res) => {
	try {
		let userId = res.locals.userId
		let { batchId, sessionId } = await getCandidateCBS(userId)
		con.query(`select es.subject,date_format(et.date,'%Y-%m-%d') as date,date_format(et.date,'%d-%M-%Y') as print_date,et.fromTime,et.toTime,u.name,u.gender from erp_timetable et left join erp_subjects es on es.subjectId = et.subjectId left join erp_users u on u.userId = et.userId where et.batchId = ${batchId} and et.sessionId=${sessionId} `, (err, result) => {

			if (err) {
				return res.status(500).end(err.sqlMessage)
			}

			res.send(result)
		})
	} catch (e) {
		res.status(500).end(e.toString())
	}
})

//Get Online Lectures by SubjectID
router.get('/online-lectures/:subjectId', async (req, res) => {
	const userId = res.locals.userId
	let candidateCBS = null

	try {
		candidateCBS = await getCandidateCBS(userId)
	}
	catch (e) {
		return res.status(500).end(e.toString())
	}


	const subjectId = req.params.subjectId
	const { batchId, sessionId } = candidateCBS

	const completedLectures = await new Promise(resolve => {
		con.query(`select data from lectures_completed where studentid=?`, [userId], (err, result) => {

			if (result[0] != undefined) {
				const finished = result[0].data.split(",").map(f => +f)
				resolve(finished)
			} else {
				resolve([])
			}
		})
	})

	con.query(`select concat('[','1,2,3,4',']') dummy, vl.title,vl.onlineLectureId,vl.downloadable,vl.lectureSRC,es.subject,vl.typeId,lt.type from online_lectures vl inner join online_lectures_subjects ols on ols.onlineLectureId =vl.onlineLectureId left join erp_subjects es on es.subjectId=ols.subjectId left join lecture_types lt on lt.lectureTypeId=vl.typeId where ols.subjectId=? and ols.batchId=? and ols.fromtime<=now() and ols.totime>now() and vl.sessionId=? order by ols.orderno asc`, [subjectId, batchId, sessionId], (err, result) => {

		if (err) {
			return res.status(500).end(err.sqlMessage)
		}

		res.send({ lectures: result, completed: completedLectures })
	})
})

function getOfflineTestSubjectRank(examId, subjectId) {
	return new Promise((resolve) => {
		con.query(`select studentId,subjectId,marks from erp_exam_marks where examId=? and subjectId=? order by marks desc,studentId asc `, [examId, subjectId], (err, result) => {
			resolve(result)
		})
	})
}

// offline-test-report
router.get("/offline-test-report/:examId", async (req, res) => {
	let userId = res.locals.userId
	let examId = req.params.examId
	con.query(`select es.subject,exm.subjectId,exm.studentId,exm.marks,exm.correct,exm.wrong,exs.totalMarks,exs.passMarks from erp_exam_marks exm inner join erp_exam_subjects exs on exs.examId=exm.examId and exs.subjectId=exm.subjectId inner join erp_subjects es on es.subjectId = exm.subjectId where exm.examId=? and exm.studentId=? group by exm.id`, [examId, userId], async (err, result) => {

		if (err) {
			res.status(500).end(err.sqlMessage)
		}

		let subjectId_Ranks = {}

		result.forEach(async (r, i) => {

			if (subjectId_Ranks[r.subjectId] == undefined) {
				subjectId_Ranks[r.subjectId] = await getOfflineTestSubjectRank(examId, r.subjectId)
			}

			if (i == result.length - 1) {
				result.forEach(rs => {
					let subjectRanks = subjectId_Ranks[rs.subjectId]
					let position = subjectRanks.find(sr => sr.studentId == rs.studentId)
					let rank = subjectRanks.indexOf(position)
					rs["subjectRank"] = rank + 1
				})
				res.send(result)
			}
		})
	})
})


/*Update lecture status */
router.put("/update-lecture-status", (req, res) => {
	let lessonId = req.body.id
	let userId = res.locals.userId
	con.query(`select id,data from lectures_completed where studentid=?`, [userId], (err, result) => {

		if (err) {
			return res.status(500).end(err.sqlMessage)
		}

		if (result.length == 0) {
			con.query(`insert into lectures_completed(studentid,data) values(?)`, [[userId, lessonId]], (err2, result2) => {

				if (err2) {
					return res.status(500).end(err2.sqlMessage)
				}

				res.send({ success: result2.affectedRows > 0 })
			})
		} else {
			let data = result[0].data.split(",")

			data = data.filter(d => d)

			data.map((v, i) => {
				data[i] = +v
			})

			if (data.includes(lessonId)) {
				data.splice(data.indexOf(lessonId), 1)
			} else {
				data.push(lessonId)
			}

			con.query(`update lectures_completed set data = '${data}' where studentid=?`, [userId], (err, result3) => {

				if (err) {
					return res.status(500).end(err.sqlMessage)
				}

				res.send({ success: result3.changedRows > 0 })
			})
		}
	})
})

/*Get Tests For Candidates */
router.get("/tests", async (req, res) => {
	let userId = res.locals.userId
	let candidateCBS = null

	try {
		candidateCBS = await getCandidateCBS(userId)
	} catch (e) {
		return res.status(500).end(e)
	}


	let { batchId, sessionId } = candidateCBS
	let pendingTests = await new Promise((resolve) => {

		con.query(`select t.id,t.duration,if(t.category_id=3,1,0) isAdvanceTest,dt.id as did,dt.status, t.name,(1) as attempted_count,date_format(t.publish_start_datetime,'%d-%M-%Y %h:%i:%s %p') start_datetime,date_format(t.publish_end_datetime,'%d-%M-%Y %h:%i:%s %p') end_datetime,now() as nowtime,ts.attempts_count as allowed_attempts_count from test t inner join batches_tests bt on find_in_set(t.id,bt.test_ids) inner join test_settings ts on ts.test_id=t.id left join done_tests dt on dt.test_id=t.id and dt.user_id=${userId} where t.publish=1 and t.test_type_id!=${TestType.PRACTICE} and bt.batch_id=${batchId} and t.sessionId=${sessionId} and dt.status=0 `, (err, result) => {

			if (err) return res.status(500).end(err.sqlMessage)

			resolve(result)
		})
	})

	let pendingTestIds = [0]

	pendingTests.forEach(pt => {
		pendingTestIds.push(pt.id)
	})

	let sql = `SELECT * from (select t.id,t.duration,if(t.category_id=3,1,0) isAdvanceTest,dt.id as did,dt.status, t.name,count(dt.id) as attempted_count,date_format(t.publish_start_datetime,'%d-%M-%Y %h:%i:%s %p') start_datetime,date_format(t.publish_end_datetime,'%d-%M-%Y %h:%i:%s %p') end_datetime,now() as nowtime, ts.attempts_count as allowed_attempts_count from test t inner join batches_tests bt on find_in_set(t.id,bt.test_ids) inner join test_settings ts on ts.test_id=t.id left join done_tests dt on dt.test_id=t.id and dt.user_id=${userId} where t.id not in(${pendingTestIds + ''}) and t.publish=1 and bt.batch_id=${batchId} and t.test_type_id!=2 and t.sessionId=${sessionId} group by t.id) ss where ss.attempted_count < ss.allowed_attempts_count`
	con.query(sql, (err, result) => {

		if (err) {
			return res.status(500).end(err.sqlMessage)
		}

		let allTests = result.concat(pendingTests)
		let activeTests = []
		let upcomingTests = []
		let missedTests = []

		allTests.forEach(t => {
			let start = new Date(t.start_datetime)
			let end = new Date(t.end_datetime)
			let now = new Date(t.nowtime)

			if (start <= now && end > now) {
				activeTests.push(t)
			}

			if (start > now) {
				upcomingTests.push(t)
			}

			if (end < now && (t.did == null || t.status == 0)) {
				missedTests.push(t)
			}
		})
		res.send({ activeTests, upcomingTests, missedTests })
	})
})

/*Get Completed Tests For User */
router.get("/completed-tests", async (req, res) => {
	let userId = res.locals.userId
	completedTests(userId, res)
})

/*Get Completed Tests For Admin */
router.get("/:userId/completed-tests", async (req, res) => {
	let userId = req.params.userId
	completedTests(userId, res)
})

async function completedTests(userId, res) {

	let testSettings = await new Promise((resolve) => {
		con.query(`select * from test_settings`, (err, result) => {
			resolve(result)
		})
	})

	let candidateCBS = null

	try {
		candidateCBS = await getCandidateCBS(userId)
	} catch (e) {
		return res.status(500).end(e.toString())
	}

	const { batchId, sessionId } = candidateCBS

	let sql = `select dt.*,t.id as test_id,date_format(t.publish_end_datetime,'%d-%M-%Y %h:%i:%s %p') as publish_end_datetime ,date_format(dt.done_time,'%d-%M-%Y %h:%i:%s %p') as done_time,now() as nowtime,t.name from done_tests dt inner join test t on t.id=dt.test_id where dt.user_id=${userId} and t.sessionId=${sessionId} and dt.status=1 and t.test_type_id!=2 order by dt.id desc`
	con.query(sql, (err, tests) => {

		if (err) {
			return res.status(500).end(err.sqlMessage)
		}

		tests.forEach(t => {
			let setting = testSettings.find(ts => ts.test_id == t.test_id)
			t.settings = setting
		})

		res.send(tests)
	})
}


//getOverallRankForOfflinetest
async function getOverallRank(examId) {
	return new Promise(resolve => {
		con.query(`select exm.studentId,exm.examId,sum(exm.marks) as marks from erp_exam_marks exm where exm.examId=? group by exm.studentId order by marks desc,studentId asc`, [examId], (err, result) => {
			resolve(result)
		})
	})
}

//Get Offline Tests 
router.get("/offline-tests", async (req, res) => {
	const userId = res.locals.userId
	let candidateCBS = null

	try {
		candidateCBS = await getCandidateCBS(userId)
	} catch (e) {
		return res.status(500).end(e.toString())
	}

	const { sessionId, batchId } = candidateCBS
	const totalMarks = await new Promise((resolve) => {
		con.query(`select exs.examId,sum(exs.totalMarks) as totalMarks from erp_exam_subjects exs inner join erp_exam_marks exm on exm.examId=exs.examId and exm.subjectId=exs.subjectId where exm.studentId=? group by exm.examId`, [userId], (err, result) => {
			resolve(result)
		})
	})

	con.query(`SELECT ex.examId,ex.category,exm.studentId,ex.examName,ex.pdfPath,date_format(ex.examDate,'%d-%M-%Y') examDate,sum(exm.correct) as correct,sum(exm.wrong) as wrong,sum(exm.marks) as marks from erp_exams ex left join erp_exam_marks exm on exm.examId=ex.examId where exm.studentId=? and ex.sessionId=${sessionId} and ex.batchId=${batchId} group by exm.examId order by ex.examId desc`, [userId], (err, result) => {

		if (err) {
			return res.status(500).end(err.sqlMessage)
		}

		if (result.length == 0) {
			res.send([])
		}

		result.forEach(async (r, i) => {
			let totalMark = totalMarks.find(t => t.examId == r.examId)
			r.totalMarks = totalMark ? totalMark.totalMarks : "N/A"
			let ranks = await getOverallRank(r.examId)
			let position = ranks.find(rr => rr.studentId == r.studentId)
			let rank = ranks.indexOf(position) + 1
			r.rank = rank

			if (i == result.length - 1) {
				res.send(result)
			}
		})
	})
})

//get offline exams for pdf
router.get("/offline-tests/pdf", async (req, res) => {

	const userId = res.locals.userId
	let candidateCBS = null

	try {
		candidateCBS = await getCandidateCBS(userId)
	} catch (e) {
		return res.status(500).end(e.toString())
	}

	const { sessionId, batchId } = candidateCBS

	con.query(`SELECT ex.examId,ex.category,ex.examName,ex.pdfPath,date_format(ex.examDate,'%d-%M-%Y') examDate,esp.signedPDFPath,esp.pdfPath myPDFPath from erp_exams ex left join erp_exam_student_pdfs esp on esp.examId=ex.examId and esp.studentId=${userId} where ex.sessionId=${sessionId} and ex.batchId=${batchId}   group by ex.examId`, (err, result) => {

		if (err) {
			return res.status(500).end(err.sqlMessage)
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

//Upload Pdf 
router.post("/offline-tests/upload-pdf", async (req, res) => {

	let data = req.body
	let userId = res.locals.userId
	let pdf = null
	let pdfPath = null
	const folderPath = "../public_html/uploads/student-exam-pdfs/"

	if (req.files != null) {

		let studentName = await getStudentNameById(res.locals.userId)

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
		data.examId,
		userId,
		pdfPath
	]

	con.query(`insert into erp_exam_student_pdfs(examId,studentId,pdfPath) values(?) `, [values], (err, result) => {

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

function getTestType(testId) {
	return new Promise(resolve => {
		con.query(`select test_type_id from test where id=${testId}`, (err, result) => resolve(result[0].test_type_id))
	})
}

//get All Explanations
function getExplanations() {
	return new Promise((resolve) => {
		con.query(`select * from explanation`, (err, result) => {
			resolve(result)
		})
	})
}

/*Get Single Test For Test Give Page  */
router.get("/test/:testId(\\d+)", async (req, res) => {
	const testId = req.params.testId
	const userId = res.locals.userId
	getSingleTest(res, testId, userId)
})


function getTestAttempedCount(userId, testId) {
	return new Promise((resolve, reject) => {
		con.query(`select count(dt.id) as attempts_count from done_tests dt where dt.user_id=? and test_id=? and status=1 `, [userId, testId], (err, result) => {

			if (err) {
				reject(err)
			}

			resolve(result[0].attempts_count + 1)
		})
	})
}

function getParagraphsByIds() {
	return new Promise(resolve => {
		con.query(`select * from paragraphs`, (err, result) => {
			resolve(result)
		})
	})
}

function getQuestionIdParagraphId() {
	return new Promise(resolve => {
		con.query(`select * from paragraphId_questionId`, (err, result) => {
			let questionId_paragraphId = {}

			result.forEach(r => {
				questionId_paragraphId[r.questionId] = r.paragraphId
			})

			resolve(questionId_paragraphId);
		})
	})
}

async function getSingleTest(res, testId, userId) {
	const settings = await getSettings(testId)
	const testType = await getTestType(testId)
	const paragraphs = await getParagraphsByIds()

	if (testType != TestType.PRACTICE && testType != TestType.InLectures && testType != TestType.InChapters) {
		const attempted_count = await getTestAttempedCount(userId, testId)
		if (!(attempted_count <= settings.attempts_count)) {
			return res.send({ status: false, message: "You are not authorized to give this test." })
		}
	}

	con.query(`select name,duration,total_questions,questions,markingSchemeId,sectionInstructions from test where id=?`, [testId], async (err, result1) => {
		
		let testData = result1[0]
		let questionsIds = []
		let questionId_paragraphId = await getQuestionIdParagraphId()

		let testQuestions = JSON.parse(testData.questions)

		testQuestions.forEach(q => {
			questionsIds.push(q[0])
			//questionId_paragraphId[q[0]] = q[4]
		})

		let orderby = "order by "
		let orderBySubjectAdded = false

		if (settings.group_questions) {
			orderby += "subjectId"
			orderBySubjectAdded = true
		}

		if (settings.shuffle_questions) {
			if (orderBySubjectAdded) {
				orderby += " , rand()"
			} else {
				orderby += "rand()"
			}
		}

		if (orderby == "order by ") {
			orderby = ` order by field(questionId,${questionsIds})`
		}


		con.query(`select q.questionId,q.subjectId,q.questionTypeId,sb.subject,srq.question_text,srq.option_a,srq.option_b,srq.option_c,srq.option_d,srq.option_e,srq.option_f,srq.correct from questions q inner join erp_subjects sb on sb.subjectId=q.subjectId inner join single_response_questions srq on srq.questionId=q.questionId where q.questionId in(${questionsIds}) union select q.questionId,q.subjectId,q.questionTypeId,sb.subject,ar.question_text,ar.option_a,ar.option_b,ar.option_c,ar.option_d,ar.option_e,ar.option_f,ar.correct from questions q inner join erp_subjects sb on sb.subjectId=q.subjectId inner join assertion_reason_questions ar on ar.questionId=q.questionId where q.questionId in(${questionsIds}) union select q.questionId,q.subjectId,q.questionTypeId,sb.subject,cs.question_text,cs.option_a,cs.option_b,cs.option_c,cs.option_d,cs.option_e,cs.option_f,cs.correct from questions q inner join erp_subjects sb on sb.subjectId=q.subjectId inner join case_study_questions cs on cs.questionId=q.questionId where q.questionId in(${questionsIds}) union select q.questionId,q.subjectId,q.questionTypeId,sb.subject,mrq.question_text,mrq.option_a,mrq.option_b,mrq.option_c,mrq.option_d,mrq.option_e,mrq.option_f,mrq.correct from questions q inner join erp_subjects sb on sb.subjectId=q.subjectId inner join multi_response_questions mrq on mrq.questionId=q.questionId where q.questionId in(${questionsIds}) union select q.questionId,q.subjectId,q.questionTypeId,sb.subject,tfq.question_text,null as option_a,null as option_b,null as option_c,null as option_d,null as option_e,null as option_f,tfq.correct from questions q inner join erp_subjects sb on sb.subjectId=q.subjectId inner join true_false_questions tfq on tfq.questionId=q.questionId where q.questionId in(${questionsIds}) union select q.questionId,q.subjectId,q.questionTypeId,sb.subject,iq.question_text,null as option_a,null as option_b,null as option_c,null as option_d,null as option_e,null as option_f,iq.correct from questions q inner join erp_subjects sb on sb.subjectId=q.subjectId inner join integer_questions iq on iq.questionId=q.questionId where q.questionId in(${questionsIds}) union select q.questionId,q.subjectId,q.questionTypeId,sb.subject,mmq.question_text,mmq.column1 as option_a,mmq.column2 as option_b,null as option_c,null as option_d,null as option_e,null as option_f,null as  correct from questions q inner join erp_subjects sb on sb.subjectId=q.subjectId inner join match_matrix_questions mmq on mmq.questionId=q.questionId where q.questionId in(${questionsIds}) ${orderby} `, async (err, questions) => {

			if (err) {
				return res.status(500).end(err.sqlMessage)
			}

			let explanations = await getExplanations()

			questions.forEach(q => {
				let tq = testQuestions.find(tq => tq[0] == q.questionId)
				q.right_marks = tq[2]
				q.wrong_marks = tq[3]
				q.sectionNo = tq[4] ? tq[4] : null
				if (q.questionTypeId == QuestionTypes.IntegerType) {
					q.correct = +(+q.correct).toFixed(2)
				}
				let explanation = explanations.find(e => e.questionId == q.questionId)
				q.explanation = explanation

				let paragraphId = questionId_paragraphId[q.questionId]
				q.paragraphId = paragraphId
			})

			con.query(`select id from done_tests where user_id=? and test_id=? and status=0`, [userId, testId], (err, result) => {

				if (result[0] == undefined) {
					con.query(`insert into done_tests (user_id,test_id,marks_obtained,total_marks,correct_marks,wrong_marks,skipped,time_spend,test_data,status,subject_wise_data) values(?)`, [[
						userId,
						testId, 0, 0, 0, 0, 0, 0, "{}", 0, "{}"
					]])
				}

			})

			const backup = await new Promise(resolve => {
				con.query(`select test_data from done_tests where user_id=? and test_id=? and status=0 `, [userId, testId], (err, result) => {

					if (result[0] == undefined) {
						resolve("{}")
					} else {
						resolve(result[0].test_data)
					}

				})
			})

			res.send({ status: true, questions, test: testData, backup, paragraphs })
		})
	})
}

/*Save Backup at every Submit and Mark etc */
router.put("/test/:testId", (req, res) => {
	con.query(`update done_tests set test_data='${JSON.stringify(req.body)}' where user_id=? and test_id=? and status=0 `, [res.locals.userId, req.params.testId])
	res.send({ success: true })
})

/* Parse Subject Wise Data */
function getParsedSubjectWiseData(subject_count, subject_wise_data) {
	let parsedSubjectWiseData = []

	Object.keys(subject_wise_data).forEach(key => {
		let totalInSubject = 0

		subject_count.forEach(sc => {
			if (sc == key) {
				totalInSubject++
			}
		})

		parsedSubjectWiseData.push({
			subject: key,
			maximum_marks: subject_wise_data[key].maximum_marks,
			attempted: subject_wise_data[key].attempted,
			scored_marks: parseFloat(subject_wise_data[key].scored_marks).toFixed(2),
			correct_questions: subject_wise_data[key].correct_questions,
			skipped_questions: subject_wise_data[key].skipped_questions,
			wrong_questions: totalInSubject - (subject_wise_data[key].correct_questions + subject_wise_data[key].skipped_questions),
			time_spend: subject_wise_data[key].time_spend
		})
	})
	return parsedSubjectWiseData
}

/* Parse SubjectWiseDataLast */
function getParsedSubjectWiseDataLast(subject_wise_data_last) {
	let parsedSubjectWiseDataLast = []

	Object.keys(subject_wise_data_last).forEach(key => {
		parsedSubjectWiseDataLast.push({
			subject: key,
			scored_marks: parseFloat(subject_wise_data_last[key].scored_marks).toFixed(2),
			maximum_marks: subject_wise_data_last[key].maximum_marks
		})
	})

	return parsedSubjectWiseDataLast

}

/*Get Parsed Chapter Wise Data */
function getParsedChapterWiseData(chapter_count, chapter_wise_data) {
	let parsedChapterWiseData = []
	Object.keys(chapter_wise_data).forEach(key => {
		let totalInChapter = 0
		chapter_count.forEach(sc => {
			if (sc == key) {
				totalInChapter++
			}
		})
		parsedChapterWiseData.push({
			chapter: chapter_wise_data[key].chapter,
			correct_questions: chapter_wise_data[key].correct_questions,
			skipped_questions: chapter_wise_data[key].skipped_questions,
			skipped_questions_marks: chapter_wise_data[key].skipped_questions_marks,
			wrong_questions: totalInChapter - (chapter_wise_data[key].correct_questions + chapter_wise_data[key].skipped_questions),
			time_spend: chapter_wise_data[key].time_spend,
			count: chapter_wise_data[key].count,
			subject: chapter_wise_data[key].subject
		})
	})
	return parsedChapterWiseData
}
/*Get Parsed Question Wise Data */
function getParsedQuestionWiseData(question_wise_data) {
	let parsedQuestionWiseData = []
	Object.keys(question_wise_data).forEach(key => {
		parsedQuestionWiseData.push({
			id: key,
			status: question_wise_data[key].status,
			correct: question_wise_data[key].correct,
			your_answer: question_wise_data[key].your_answer,
			time_spend: question_wise_data[key].time_spend,
			idealTime: question_wise_data[key].idealTime,
			atTime: question_wise_data[key].atTime,
			scored_marks: parseFloat(question_wise_data[key].scored_marks).toFixed(2),
			questionTaggingId: question_wise_data[key].questionTaggingId,
			difficultyLevelId: question_wise_data[key].difficultyLevelId
		})
	})
	return parsedQuestionWiseData
}

function findLastIndex(array, searchKey, searchValue) {
	var index = array.slice().reverse().findIndex(x => x[searchKey] == searchValue);
	var count = array.length - 1
	var finalIndex = index >= 0 ? count - index : index;
	return finalIndex;
}

function getParsedAccuracy(data) {
	let arr = []
	Object.keys(data).forEach(key => {
		arr.push({
			subject: key,
			accuracy: +parseFloat("" + ((data[key].correct_questions) / ((data[key].correct_questions) +
				(data[key].wrong_questions))) * 100).toFixed(2)
		})
	})
	return arr
}

/**Regenerate Result */
router.put("/regenerate-result", async (req, res) => {
	const testId = req.body.testId

	con.query(`select id,user_id,test_data,accuracy_data,notAnswered,notVisited,markedForReview,subjectSwaps from done_tests where test_id=?`, [testId], (err, result) => {

		result.forEach(r => {

			const paceAnalysis = {
				notAnswered: r.notAnswered,
				notVisited: r.notVisited,
				markedForReview: r.markedForReview
			}

			submitTest(res, JSON.parse(r.test_data), testId, r.userId, r.id, [], JSON.parse(r.accuracy_data), paceAnalysis, r.subjectSwaps)
		})
	})

	res.send({ message: "Result is being Regenerated" })
})

/*Submit Test  */
router.post("/submit-test", async (req, res) => {
	const data = req.body.data
	const testId = req.body.testId
	const userId = res.locals.userId
	let subject_times = req.body.subject_times
	if (subject_times == undefined) {
		subject_times = []
	}


	let finalAccuracyData = req.body.finalAccuracyData
	if (finalAccuracyData == undefined) {
		finalAccuracyData = []
	}

	const notAnswered = req.body.notAnswered
	const notVisited = req.body.notVisited
	const markedForReview = req.body.markedForReview
	const subjectSwaps = req.body.subjectSwaps
	const paceAnalysis = {
		notAnswered,
		notVisited,
		markedForReview
	}

	submitTest(res, data, testId, userId, 0, subject_times, finalAccuracyData, paceAnalysis, subjectSwaps)
})

/*Submit Test Function */
async function submitTest(res, data, testId, userId, done_id = 0, subject_times, finalAccuracyData, paceAnalysis, subjectSwaps) {

	const uniqueSubjects = []
	const marks_etc = {
		correct: 0,
		wrong: 0,
		skipped: 0,
		marks: 0,
		rightMarks: 0,
		negativeMarks: 0
	}

	const test_settings = await getSettings(testId)
	const questionIds = []
	let test_questions
	let markingSchemeId
	let total_marks
	let total_questions
	let total_time_spend = 0
	let total_time
	let productiveTime = 0
	let nonProductiveTime = 0
	let unUsedTime = 0

	let test = await new Promise(resolve => {
		con.query(`select total_marks,total_questions,questions,duration,markingSchemeId from test where id=? `, [testId], (err, result) => {
			if (err) {
				res.status(500).end(err.sqlMessage)
			}
			resolve(result[0])
		})
	})

	total_marks = test.total_marks
	total_questions = test.total_questions
	markingSchemeId = test.markingSchemeId
	total_time = test.duration * 60

	test_questions = JSON.parse(test.questions)
	let testQuestions = JSON.parse(test.questions)

	testQuestions.forEach(q => {
		questionIds.push(q[0])
	})

	const firstAttemptQuestions = []
	const reAttemptQuestions = []

	questionIds.forEach(qId => {
		if (finalAccuracyData.find(fad => fad[0] == qId))
			firstAttemptQuestions.push(finalAccuracyData.find(fad => fad[0] == qId))
	})

	finalAccuracyData.forEach(fad => {
		if (finalAccuracyData.filter(f => f[0] == fad[0]).length > 1) {
			if (reAttemptQuestions.find(r => r[0] == fad[0]) == undefined) {
				reAttemptQuestions.push(finalAccuracyData[findLastIndex(finalAccuracyData, 0, fad[0])])
			}
		}
	})

	const test_questions_data = await new Promise(resolve => {

		con.query(`select q.questionId,q.idealTime,q.questionTaggingId,ch.chapter,q.chapterId,s.subject,q.questionTypeId,srq.correct,q.difficultyLevelId from questions q inner join single_response_questions srq on srq.questionId=q.questionId inner join erp_subjects s on s.subjectId=q.subjectId inner join erp_chapters ch on ch.chapterId=q.chapterId inner join difficulty_level dl on dl.difficultyLevelId=q.difficultyLevelId where q.questionId in(${questionIds + ''}) group by q.questionId union select q.questionId,q.idealTime,q.questionTaggingId,ch.chapter,q.chapterId,s.subject,q.questionTypeId,ar.correct,q.difficultyLevelId from questions q inner join assertion_reason_questions ar on ar.questionId=q.questionId inner join erp_subjects s on s.subjectId=q.subjectId inner join erp_chapters ch on ch.chapterId=q.chapterId inner join difficulty_level dl on dl.difficultyLevelId=q.difficultyLevelId where q.questionId in(${questionIds + ''}) group by q.questionId union select q.questionId,q.idealTime,q.questionTaggingId,ch.chapter,q.chapterId,s.subject,q.questionTypeId,cs.correct,q.difficultyLevelId from questions q inner join case_study_questions cs on cs.questionId=q.questionId inner join erp_subjects s on s.subjectId=q.subjectId inner join erp_chapters ch on ch.chapterId=q.chapterId inner join difficulty_level dl on dl.difficultyLevelId=q.difficultyLevelId where q.questionId in(${questionIds + ''}) group by q.questionId  union select q.questionId,q.idealTime,q.questionTaggingId,ch.chapter,q.chapterId,s.subject,q.questionTypeId,mrq.correct,q.difficultyLevelId from questions q inner join multi_response_questions mrq on mrq.questionId=q.questionId inner join erp_subjects s on s.subjectId=q.subjectId inner join erp_chapters ch on ch.chapterId=q.chapterId inner join difficulty_level dl on dl.difficultyLevelId=q.difficultyLevelId where q.questionId in(${questionIds + ''}) group by q.questionId union select q.questionId,q.idealTime,q.questionTaggingId,ch.chapter,q.chapterId,s.subject,q.questionTypeId,tfq.correct,q.difficultyLevelId from questions q inner join true_false_questions tfq on tfq.questionId=q.questionId inner join erp_subjects s on s.subjectId=q.subjectId inner join erp_chapters ch on ch.chapterId=q.chapterId inner join difficulty_level dl on dl.difficultyLevelId=q.difficultyLevelId where q.questionId in(${questionIds + ''}) group by q.questionId  union select q.questionId,q.idealTime,q.questionTaggingId,ch.chapter,q.chapterId,s.subject,q.questionTypeId,concat(iq.correct,',',iq.correct_from,',',iq.correct_to) correct,q.difficultyLevelId from questions q inner join integer_questions iq on iq.questionId=q.questionId inner join erp_subjects s on s.subjectId=q.subjectId inner join erp_chapters ch on ch.chapterId=q.chapterId inner join difficulty_level dl on dl.difficultyLevelId=q.difficultyLevelId where q.questionId in(${questionIds + ''}) group by q.questionId union select q.questionId,q.idealTime,q.questionTaggingId,ch.chapter,q.chapterId,s.subject,q.questionTypeId,mmq.answer_key as correct,q.difficultyLevelId from questions q inner join match_matrix_questions mmq on mmq.questionId=q.questionId inner join erp_subjects s on s.subjectId=q.subjectId inner join erp_chapters ch on ch.chapterId=q.chapterId inner join difficulty_level dl on dl.difficultyLevelId=q.difficultyLevelId  where q.questionId in(${questionIds + ''}) group by q.questionId  `, (err, result) => {
			if (err) res.status(500).end(err.sqlMessage)
			resolve(result)
		})
	})

	const subject_wise_data = {}
	const subject_wise_data_last = {}
	const subject_wise_first_attempt_data = {}
	const subject_wise_re_attempt_data = {}
	const chapter_wise_data = {}
	const question_wise_data = {}
	const subject_count = []
	const chapter_count = []
	let totalSpendTime = 0
	data.forEach(d => totalSpendTime += d[2])

	const lastMinutes = totalSpendTime - 10

	const subjectTimes = []
	subject_times.forEach(s => {
		subjectTimes.push({
			subject: s.subject,
			time: s.times.filter(st => st > lastMinutes).length
		})
	})

	test_questions_data.forEach(tqd => {
		const tq = test_questions.find(t => t[0] == tqd.questionId)

		tqd.right_marks = tq[2]
		tqd.wrong_marks = tq[3]
		tqd.bonus = tq[1]

		if (uniqueSubjects.find(us => us == tqd.subject) == undefined) {
			uniqueSubjects.push(tqd.subject)
		}

		subject_count.push(tqd.subject)
		chapter_count.push(tqd.chapterId)

		subject_wise_data[tqd.subject] = {
			maximum_marks: 0,
			scored_marks: 0,
			attempted: 0,
			correct_questions: 0,
			skipped_questions: 0,
			wrong_questions: 0,
			time_spend: 0
		}

		subject_wise_data_last[tqd.subject] = {
			scored_marks: 0,
			maximum_marks: 0
		}

		subject_wise_first_attempt_data[tqd.subject] = {
			correct_questions: 0,
			wrong_questions: 0
		}

		subject_wise_re_attempt_data[tqd.subject] = {
			correct_questions: 0,
			wrong_questions: 0
		}

		chapter_wise_data[tqd.chapterId] = {
			count: 0,
			correct_questions: 0,
			wrong_questions: 0,
			skipped_questions: 0,
			skipped_questions_marks: 0,
			time_spend: 0,
			subject: null,
			chapter: null
		}

		question_wise_data[tqd.questionId] = {
			status: null,
			scored_marks: 0,
			time_spend: 0,
			atTime: 0,
			correct: null,
			your_answer: null,
			idealTime: 0,
			questionTaggingId: tqd.questionTaggingId,
			difficultyLevelId: tqd.difficultyLevelId
		}

		// If new JEE Scheme
		if (markingSchemeId == MarkingScheme.NewJEE2021) {
			subject_wise_data[tqd.subject].maximum_marks = -20
		}
	})

	/*
	Submitted Data
	data = [
		[1,"A",200],
		[2,"B",230]
	]
	*/

	// First attempt Questions Data
	firstAttemptQuestions.forEach(d => {
		const findAnswer = test_questions_data.find(t => t.questionId == d[0])

		if (findAnswer.questionTypeId == QuestionTypes.SingleResponse) {
			processSingleResponseForAccuracy(findAnswer, d[1], subject_wise_first_attempt_data)
		}

		if (findAnswer.questionTypeId == QuestionTypes.MultiResponse) {
			processMultiResponseForAccuracy(findAnswer, d[1], subject_wise_first_attempt_data, test_settings)
		}

		if (findAnswer.questionTypeId == QuestionTypes.TrueFalse) {
			processTrueFalseForAccuracy(findAnswer, d[1], subject_wise_first_attempt_data)
		}

		if (findAnswer.questionTypeId == QuestionTypes.IntegerType) {
			processIntegerTypeForAccuracy(findAnswer, d[1], subject_wise_first_attempt_data)
		}

		if (findAnswer.questionTypeId == QuestionTypes.MatchMatrix) {
			processMatchMatrixForAccuracy(findAnswer, d[1], subject_wise_first_attempt_data, test_settings)
		}

	})

	// First attempt Questions Data
	reAttemptQuestions.forEach(d => {
		const findAnswer = test_questions_data.find(t => t.questionId == d[0])

		if (findAnswer.questionTypeId == QuestionTypes.SingleResponse || findAnswer.QuestionTypes.ASSERTION_) {
			processSingleResponseForAccuracy(findAnswer, d[1], subject_wise_re_attempt_data)
		}

		if (findAnswer.questionTypeId == QuestionTypes.MultiResponse) {
			processMultiResponseForAccuracy(findAnswer, d[1], subject_wise_re_attempt_data, test_settings)
		}

		if (findAnswer.questionTypeId == QuestionTypes.TrueFalse) {
			processTrueFalseForAccuracy(findAnswer, d[1], subject_wise_re_attempt_data)
		}

		if (findAnswer.questionTypeId == QuestionTypes.IntegerType) {
			processIntegerTypeForAccuracy(findAnswer, d[1], subject_wise_re_attempt_data)
		}

		if (findAnswer.questionTypeId == QuestionTypes.MatchMatrix) {
			processMatchMatrixForAccuracy(findAnswer, d[1], subject_wise_re_attempt_data, test_settings)
		}

	})

	const firstAttemptAccuracy = getParsedAccuracy(subject_wise_first_attempt_data)
	const reAttemptAccuracy = getParsedAccuracy(subject_wise_re_attempt_data)

	const accuracy = JSON.stringify({ firstAttemptAccuracy, reAttemptAccuracy })

	data.forEach(d => {
		const findAnswer = test_questions_data.find(t => t.questionId == d[0])

		const times = {
			totalSpendTime,
			atTime: d[3]
		}

		if (findAnswer.questionTypeId == QuestionTypes.SingleResponse ||
			findAnswer.questionTypeId == QuestionTypes.AssertionReason ||
			findAnswer.questionTypeId == QuestionTypes.CaseStudy
		) {
			processSingleResponse(marks_etc, findAnswer, d[1], subject_wise_data, chapter_wise_data, question_wise_data, subject_wise_data_last, times)
		}

		if (findAnswer.questionTypeId == QuestionTypes.MultiResponse) {
			processMultiResponse(marks_etc, findAnswer, d[1], test_settings, subject_wise_data, chapter_wise_data, question_wise_data, subject_wise_data_last, times)
		}

		if (findAnswer.questionTypeId == QuestionTypes.TrueFalse) {
			processTrueFalse(marks_etc, findAnswer, d[1], subject_wise_data, chapter_wise_data, question_wise_data, subject_wise_data_last, times)
		}

		if (findAnswer.questionTypeId == QuestionTypes.IntegerType) {
			processIntegerType(marks_etc, findAnswer, d[1], subject_wise_data, chapter_wise_data, question_wise_data, subject_wise_data_last, times)
		}

		if (findAnswer.questionTypeId == QuestionTypes.MatchMatrix) {
			processMatchMatrix(marks_etc, findAnswer, d[1], test_settings, subject_wise_data, chapter_wise_data, question_wise_data, subject_wise_data_last, times)
		}

		if (d[1] == "S") {
			marks_etc.skipped++
			subject_wise_data[findAnswer.subject].skipped_questions++
			chapter_wise_data[findAnswer.chapterId].skipped_questions++
			chapter_wise_data[findAnswer.chapterId].skipped_questions_marks += parseFloat(findAnswer.right_marks)
		} else {
			subject_wise_data[findAnswer.subject].attempted++
		}

		total_time_spend += d[2]

		subject_wise_data[findAnswer.subject].time_spend += d[2]
		chapter_wise_data[findAnswer.chapterId].time_spend += d[2]
		chapter_wise_data[findAnswer.chapterId].count++
		chapter_wise_data[findAnswer.chapterId].subject = findAnswer.subject
		chapter_wise_data[findAnswer.chapterId].chapter = findAnswer.chapter
		question_wise_data[findAnswer.questionId].time_spend = d[2]
		question_wise_data[findAnswer.questionId].atTime = d[3]

		if (findAnswer.questionTypeId == QuestionTypes.MultiResponse) {
			correct = findAnswer.correct.split(",").map((n) => n.split("_")[1].toUpperCase())
		} else if (findAnswer.questionTypeId == QuestionTypes.MatchMatrix) {
			correct = findAnswer.correct
		} else if (findAnswer.questionTypeId == QuestionTypes.SingleResponse ||
			findAnswer.questionTypeId == QuestionTypes.AssertionReason ||
			findAnswer.questionTypeId == QuestionTypes.CaseStudy
		) {
			correct = findAnswer.correct.split("_")[1].toUpperCase()
		} else if (findAnswer.questionTypeId == QuestionTypes.IntegerType) {
			correct = findAnswer.correct.split(",")[0]
		} else {
			correct = findAnswer.correct
		}

		question_wise_data[findAnswer.questionId].correct = correct
		question_wise_data[findAnswer.questionId].idealTime = findAnswer.idealTime
		question_wise_data[findAnswer.questionId].your_answer = d[1]
	})

	marks_etc.wrong = total_questions - (marks_etc.correct + marks_etc.skipped)
	marks_etc.marks = parseFloat(marks_etc.marks).toFixed(2)

	const attempted_count = await new Promise((resolve) => {
		con.query(`select count(dt.id) as attempts_count from done_tests dt where dt.user_id=? and test_id=? and status=1 `, [userId, testId], (err, result) => {

			if (err) {
				res.status(500).end(err.sqlMessage)
			}

			resolve(result[0].attempts_count + 1)
		})
	})

	const testType = await getTestType(testId)

	if (testType != TestType.PRACTICE && testType != TestType.InLectures
		&& done_id == 0
		&& !(attempted_count <= test_settings.attempts_count)
	) {
		res.send({
			marksObtained: parseFloat(marks_etc.marks).toFixed(2),
			correctQuestions: marks_etc.correct,
			wrongQuestions: marks_etc.wrong,
			skippedQuestions: marks_etc.skipped,
			attemptedQuestions: parseInt(marks_etc.correct) + parseInt(marks_etc.wrong),
			rightMarks: parseFloat(marks_etc.rightMarks).toFixed(2),
			negativeMarks: parseFloat(marks_etc.negativeMarks).toFixed(2),
			totalMarks: total_marks,
			totalQuestions: total_questions,
			timeTaken: total_time_spend,
			totalTime: total_time,
			subjects: uniqueSubjects,
			attempted_count: attempted_count
		})
		return
	}

	let rank = 1
	let parsedSubjectWiseData = JSON.stringify(getParsedSubjectWiseData(subject_count, subject_wise_data))
	let parsedChapterWiseData = JSON.stringify(getParsedChapterWiseData(chapter_count, chapter_wise_data))
	let parsedQuestionWiseData = getParsedQuestionWiseData(question_wise_data)
	let parsedSubjectWiseDataLast = JSON.stringify(getParsedSubjectWiseDataLast(subject_wise_data_last))

	parsedQuestionWiseData.forEach(p => {
		let spendTime = p.time_spend
		let idealTime = p.idealTime * 1.25
		let difference = spendTime - idealTime
		productiveTime += difference > 0 ? idealTime : spendTime
		nonProductiveTime += difference > 0 ? difference : 0
	})

	unUsedTime = total_time - total_time_spend

	let test_insert_data = [
		userId,
		testId,
		parseFloat(marks_etc.marks).toFixed(2),
		total_marks,
		parseFloat(marks_etc.rightMarks).toFixed(2),
		marks_etc.negativeMarks,
		marks_etc.correct,
		marks_etc.wrong,
		marks_etc.skipped,
		total_time_spend,
		JSON.stringify(data),
		attempted_count,
		rank,
		1,
		parsedSubjectWiseData,
		parsedChapterWiseData,
		JSON.stringify(parsedQuestionWiseData),
		parsedSubjectWiseDataLast,
		JSON.stringify(subjectTimes),
		accuracy,
		JSON.stringify(finalAccuracyData),
		paceAnalysis.notAnswered,
		paceAnalysis.notVisited,
		paceAnalysis.markedForReview,
		productiveTime,
		nonProductiveTime,
		unUsedTime,
		subjectSwaps
	]

	if (done_id == 0) {

		con.query(`insert into done_tests (user_id,test_id,marks_obtained,total_marks,correct_marks,wrong_marks,correct_questions,wrong_questions,skipped,time_spend,test_data,attempt_no,rank,status,subject_wise_data,chapter_wise_data,question_wise_data,subject_wise_data_last,subject_last_time,accuracy,accuracy_data,notAnswered,notVisited,markedForReview,productiveTime,nonProductiveTime,unUsedTime,subjectSwaps) values(?)`, [test_insert_data], (err) => {

			if (err) {
				return res.status(500).end(err.message)
			}

			con.query(`delete from done_tests where test_id=? and user_id=? and status=0 `, [testId, userId])

			res.send({
				marksObtained: parseFloat(marks_etc.marks).toFixed(2),
				correctQuestions: marks_etc.correct,
				wrongQuestions: marks_etc.wrong,
				skippedQuestions: marks_etc.skipped,
				attemptedQuestions: parseInt(marks_etc.correct) + parseInt(marks_etc.wrong),
				rightMarks: parseFloat(marks_etc.rightMarks).toFixed(2),
				negativeMarks: parseFloat(marks_etc.negativeMarks).toFixed(2),
				totalMarks: total_marks,
				totalQuestions: total_questions,
				timeTaken: total_time_spend,
				totalTime: total_time,
				subjects: uniqueSubjects,
				attempted_count: attempted_count
			})
		})
	} else {

		let test_insert_data = [
			parseFloat(marks_etc.marks).toFixed(2),
			total_marks,
			parseFloat(marks_etc.rightMarks).toFixed(2),
			marks_etc.negativeMarks,
			marks_etc.correct,
			marks_etc.wrong,
			marks_etc.skipped,
			total_time_spend,
			JSON.stringify(data),
			rank,
			1,
			parsedSubjectWiseData,
			parsedChapterWiseData,
			JSON.stringify(parsedQuestionWiseData),
			parsedSubjectWiseDataLast,
			JSON.stringify(subjectTimes),
			accuracy,
			JSON.stringify(finalAccuracyData),
			paceAnalysis.notAnswered,
			paceAnalysis.notVisited,
			paceAnalysis.markedForReview,
			productiveTime,
			nonProductiveTime,
			unUsedTime,
			subjectSwaps
		]

		con.query(`update done_tests set marks_obtained = ?,total_marks=?,correct_marks=?,wrong_marks=?,correct_questions=?,wrong_questions=?,skipped=?,time_spend=?,test_data=?,rank=?,status=?,subject_wise_data=?,chapter_wise_data=?,question_wise_data=?,subject_wise_data_last=?,subject_last_time=?,accuracy=?,accuracy_data=?,notAnswered=?,notVisited=?,markedForReview=?,productiveTime=?,nonProductiveTime=?,unUsedTime=?,subjectSwaps=? where id = ${done_id}`, test_insert_data, (err, result) => {
			if (err) res.status(500).end(err.message)
		})
	}
}

function isLastMinutes(times) {
	return times.atTime >= (times.totalSpendTime - 10)
}

function processSingleResponseForAccuracy(answer, choosed, subject_wise_data) {

	if (answer.correct.split("option_")[1].trim() == choosed.trim().toLowerCase() || answer.bonus == 1) {
		subject_wise_data[answer.subject].correct_questions++
	}
	else {
		if (choosed != "S") {
			subject_wise_data[answer.subject].wrong_questions++
		}
	}

}

function processMultiResponseForAccuracy(answer, choosed, subject_wise_data, settings) {
	let corrects = answer.correct.split(",")
	corrects = corrects.map(c => c.split("option_")[1].trim())
	let count = 0
	let isNegative = false
	let isFullMarks = false

	if (typeof choosed == "object") {

		choosed.forEach(c => {

			if (corrects.includes(c.toLowerCase())) {
				count++
			} else {
				//Apply Negative Marks if Option Choosed is not in correct answers
				if (isNegative == false) {
					subject_wise_data[answer.subject].wrong_questions++
				}

				isNegative = true
			}
		})
	}

	// Apply Full Marks
	if (count == corrects.length && count == choosed.length && !isNegative || answer.bonus == 1) {
		subject_wise_data[answer.subject].correct_questions++
	}

	// Apply Partial Marking
	if (!isNegative && count > 0 && !isFullMarks && settings.partial_marking) {
		subject_wise_data[answer.subject].correct_questions++
	}

}

function processTrueFalseForAccuracy(answer, choosed, subject_wise_data) {
	if (answer.correct == choosed || answer.bonus == 1) {
		subject_wise_data[answer.subject].correct_questions++
	}
	else {
		if (choosed != "S") {
			subject_wise_data[answer.subject].wrong_questions++
		}
	}
}

function processIntegerTypeForAccuracy(answer, choosed, subject_wise_data) {

	const corrects = answer.correct.split(",")
	const correct = parseFloat(corrects[0])
	const correct_from = parseFloat(corrects[1])
	const correct_to = parseFloat(corrects[2])

	if (correct == choosed || (choosed >= correct_from && choosed <= correct_to) || answer.bonus == 1) {
		subject_wise_data[answer.subject].correct_questions++
	}
	else {
		if (choosed != "S") {
			subject_wise_data[answer.subject].wrong_questions++
		}
	}
}

function processMatchMatrixForAccuracy(answer, choosed, subject_wise_data, settings) {
	let corrects = JSON.parse(answer.correct)
	let count = 0
	let isNegative = false
	let isFullMarks = false

	if (typeof choosed == "object") {
		Object.keys(choosed).forEach((key) => {
			let choosedCurrent = choosed[key]
			let correctCurrent = corrects[key]

			if (choosedCurrent.every((c) => {
				return correctCurrent.includes(c)
			})) {
				count++
			} else {
				//Apply Negative Marks if Option Choosed is not in correct answers
				if (isNegative == false) {
					subject_wise_data[answer.subject].wrong_questions++
				}

				isNegative = true
			}
		})
	}

	let choosedLength = 0

	if (typeof choosed == "object") {
		Object.keys(choosed).forEach(key => {
			choosedLength += choosed[key].length
		})
	}

	let correctsLength = 0

	if (typeof corrects == "object") {
		Object.keys(corrects).forEach(key => {
			correctsLength += corrects[key].length
		})
	}

	// Apply Full Marks
	if (count == correctsLength && count == choosedLength && !isNegative || answer.bonus == 1) {
		isFullMarks = true
		subject_wise_data[answer.subject].correct_questions++
	}

	// Apply Partial Marking
	if (!isNegative && count > 0 && !isFullMarks && settings.partial_marking) {
		subject_wise_data[answer.subject].correct_questions++
	}

}

function processSingleResponse(marks_obj, answer, choosed, subject_wise_data, chapter_wise_data, question_wise_data, subject_wise_data_last, times) {

	subject_wise_data[answer.subject].maximum_marks += parseFloat(answer.right_marks)

	if (isLastMinutes(times)) {
		subject_wise_data_last[answer.subject].maximum_marks += parseFloat(answer.right_marks)
	}

	if (answer.correct.split("option_")[1].trim() == choosed.trim().toLowerCase() || answer.bonus == 1) {
		marks_obj.correct++
		marks_obj.marks += parseFloat(answer.right_marks)
		marks_obj.rightMarks += parseFloat(answer.right_marks)
		subject_wise_data[answer.subject].scored_marks += parseFloat(answer.right_marks)
		subject_wise_data[answer.subject].correct_questions++
		chapter_wise_data[answer.chapterId].correct_questions++
		question_wise_data[answer.questionId].status = "C"
		question_wise_data[answer.questionId].scored_marks = answer.right_marks

		if (isLastMinutes(times)) {
			subject_wise_data_last[answer.subject].scored_marks += parseFloat(answer.right_marks)
		}

	} else {

		if (choosed != "S") {
			marks_obj.marks -= parseFloat(answer.wrong_marks)
			marks_obj.negativeMarks += parseFloat(answer.wrong_marks)
			subject_wise_data[answer.subject].scored_marks -= parseFloat(answer.wrong_marks)
			question_wise_data[answer.questionId].status = "W"
			question_wise_data[answer.questionId].scored_marks = "-" + answer.wrong_marks

			if (isLastMinutes(times)) {
				subject_wise_data_last[answer.subject].scored_marks -= parseFloat(answer.wrong_marks)
			}

		} else {
			question_wise_data[answer.questionId].status = "S"
		}
	}
}

function processMultiResponse(marks_obj, answer, choosed, settings, subject_wise_data, chapter_wise_data, question_wise_data, subject_wise_data_last, times) {

	if (isLastMinutes(times)) {
		subject_wise_data_last[answer.subject].maximum_marks += parseFloat(answer.right_marks)
	}

	let corrects = answer.correct.split(",")
	corrects = corrects.map(c => c.split("option_")[1].trim())
	let count = 0
	let isNegative = false
	let isFullMarks = false
	subject_wise_data[answer.subject].maximum_marks += parseFloat(answer.right_marks)

	if (choosed == "S") {
		question_wise_data[answer.questionId].status = "S"
	}

	if (typeof choosed == "object") {

		choosed.forEach(c => {

			if (corrects.includes(c.toLowerCase())) {
				count++
			} else {
				//Apply Negative Marks if Option Choosed is not in correct answers
				if (isNegative == false) {
					marks_obj.marks -= parseFloat(answer.wrong_marks)
					marks_obj.negativeMarks += parseFloat(answer.wrong_marks)
					subject_wise_data[answer.subject].scored_marks -= parseFloat(answer.wrong_marks)
					question_wise_data[answer.questionId].status = "W"
					question_wise_data[answer.questionId].scored_marks = "-" + answer.wrong_marks

					if (isLastMinutes(times)) {
						subject_wise_data_last[answer.subject].scored_marks -= parseFloat(answer.wrong_marks)
					}

				}

				isNegative = true
			}

		})

	}
	// Apply Full Marks
	if (count == corrects.length && count == choosed.length && !isNegative || answer.bonus == 1) {
		isFullMarks = true
		marks_obj.correct++
		marks_obj.marks += parseFloat(answer.right_marks)
		marks_obj.rightMarks += parseFloat(answer.right_marks)
		subject_wise_data[answer.subject].scored_marks += parseFloat(answer.right_marks)
		subject_wise_data[answer.subject].correct_questions++
		chapter_wise_data[answer.chapterId].correct_questions++
		question_wise_data[answer.questionId].status = "C"
		question_wise_data[answer.questionId].scored_marks = answer.right_marks

		if (isLastMinutes(times)) {
			subject_wise_data_last[answer.subject].scored_marks += parseFloat(answer.right_marks)
		}

	}

	// Apply Partial Marking
	if (!isNegative && count > 0 && !isFullMarks && settings.partial_marking) {
		let fraction = (choosed.length / corrects.length)
		let marks = parseFloat(answer.right_marks * fraction)
		marks_obj.marks += marks
		marks_obj.rightMarks += marks
		marks_obj.correct++
		subject_wise_data[answer.subject].scored_marks += marks
		subject_wise_data[answer.subject].correct_questions++
		chapter_wise_data[answer.chapterId].correct_questions++
		question_wise_data[answer.questionId].status = "C"
		question_wise_data[answer.questionId].scored_marks = marks

		if (isLastMinutes(times)) {
			subject_wise_data_last[answer.subject].scored_marks += marks
		}
	}
}

function processMatchMatrix(marks_obj, answer, choosed, settings, subject_wise_data, chapter_wise_data, question_wise_data, subject_wise_data_last, times) {

	if (isLastMinutes(times)) {
		subject_wise_data_last[answer.subject].maximum_marks += parseFloat(answer.right_marks)
	}

	let corrects = JSON.parse(answer.correct)
	let count = 0
	let isNegative = false
	let isFullMarks = false
	subject_wise_data[answer.subject].maximum_marks += parseFloat(answer.right_marks)

	if (choosed == "S") {
		question_wise_data[answer.questionId].status = "S"
	}

	if (typeof choosed == "object") {
		Object.keys(choosed).forEach((key) => {
			let choosedCurrent = choosed[key]
			let correctCurrent = corrects[key]

			if (choosedCurrent.every((c) => {
				return correctCurrent.includes(c)
			})) {
				count++
			} else {
				//Apply Negative Marks if Option Choosed is not in correct answers
				if (isNegative == false) {
					marks_obj.marks -= parseFloat(answer.wrong_marks)
					marks_obj.negativeMarks += parseFloat(answer.wrong_marks)
					subject_wise_data[answer.subject].scored_marks -= parseFloat(answer.wrong_marks)
					question_wise_data[answer.questionId].status = "W"
					question_wise_data[answer.questionId].scored_marks = "-" + answer.wrong_marks

					if (isLastMinutes(times)) {
						subject_wise_data_last[answer.subject].scored_marks -= parseFloat(answer.wrong_marks)
					}

				}

				isNegative = true
			}
		})
	}

	let choosedLength = 0

	if (typeof choosed == "object") {

		Object.keys(choosed).forEach(key => {
			choosedLength += choosed[key].length
		})

	}

	let correctsLength = 0

	if (typeof corrects == "object") {

		Object.keys(corrects).forEach(key => {
			correctsLength += corrects[key].length
		})

	}

	// Apply Full Marks
	if (count == correctsLength && count == choosedLength && !isNegative || answer.bonus == 1) {
		isFullMarks = true
		marks_obj.correct++
		marks_obj.marks += parseFloat(answer.right_marks)
		marks_obj.rightMarks += parseFloat(answer.right_marks)
		subject_wise_data[answer.subject].scored_marks += parseFloat(answer.right_marks)
		subject_wise_data[answer.subject].correct_questions++
		chapter_wise_data[answer.chapterId].correct_questions++
		question_wise_data[answer.questionId].status = "C"
		question_wise_data[answer.questionId].scored_marks = answer.right_marks

		if (isLastMinutes(times)) {
			subject_wise_data_last[answer.subject].scored_marks += parseFloat(answer.right_marks)
		}

	}

	// Apply Partial Marking
	if (!isNegative && count > 0 && !isFullMarks && settings.partial_marking) {
		let fraction = (choosedLength / correctsLength)
		let marks = parseFloat(answer.right_marks * fraction)
		marks_obj.marks += marks
		marks_obj.rightMarks += marks
		marks_obj.correct++
		subject_wise_data[answer.subject].scored_marks += marks
		subject_wise_data[answer.subject].correct_questions++
		chapter_wise_data[answer.chapterId].correct_questions++
		question_wise_data[answer.questionId].status = "C"
		question_wise_data[answer.questionId].scored_marks = marks

		if (isLastMinutes(times)) {
			subject_wise_data_last[answer.subject].scored_marks += marks
		}

	}

}

function processTrueFalse(marks_obj, answer, choosed, subject_wise_data, chapter_wise_data, question_wise_data, subject_wise_data_last, times) {
	subject_wise_data[answer.subject].maximum_marks += parseFloat(answer.right_marks)

	if (isLastMinutes(times)) {
		subject_wise_data_last[answer.subject].maximum_marks += parseFloat(answer.right_marks)
	}

	if (answer.correct == choosed || answer.bonus == 1) {
		marks_obj.correct++
		marks_obj.marks += parseFloat(answer.right_marks)
		marks_obj.rightMarks += parseFloat(answer.right_marks)
		subject_wise_data[answer.subject].scored_marks += parseFloat(answer.right_marks)
		subject_wise_data[answer.subject].correct_questions++
		chapter_wise_data[answer.chapterId].correct_questions++
		question_wise_data[answer.questionId].status = "C"
		question_wise_data[answer.questionId].scored_marks = answer.right_marks

		if (isLastMinutes(times)) {
			subject_wise_data_last[answer.subject].scored_marks += parseFloat(answer.right_marks)
		}

	} else {
		if (choosed != "S") {
			marks_obj.marks -= parseFloat(answer.wrong_marks)
			marks_obj.negativeMarks += parseFloat(answer.wrong_marks)
			subject_wise_data[answer.subject].scored_marks -= parseFloat(answer.wrong_marks)
			question_wise_data[answer.questionId].status = "W"
			question_wise_data[answer.questionId].scored_marks = "-" + answer.wrong_marks

			if (isLastMinutes(times)) {
				subject_wise_data_last[answer.subject].scored_marks -= parseFloat(answer.wrong_marks)
			}

		} else {
			question_wise_data[answer.questionId].status = "S"
		}
	}
}

function processIntegerType(marks_obj, answer, choosed, subject_wise_data, chapter_wise_data, question_wise_data, subject_wise_data_last, times) {
	subject_wise_data[answer.subject].maximum_marks += parseFloat(answer.right_marks)

	if (isLastMinutes(times)) {
		subject_wise_data_last[answer.subject].maximum_marks += parseFloat(answer.right_marks)
	}


	const corrects = answer.correct.split(",")
	const correct = parseFloat(corrects[0])
	const correct_from = parseFloat(corrects[1])
	const correct_to = parseFloat(corrects[2])

	if (correct == choosed || (choosed >= correct_from && choosed <= correct_to) || answer.bonus == 1) {
		marks_obj.correct++
		marks_obj.marks += parseFloat(answer.right_marks)
		marks_obj.rightMarks += parseFloat(answer.right_marks)
		subject_wise_data[answer.subject].scored_marks += parseFloat(answer.right_marks)
		subject_wise_data[answer.subject].correct_questions++
		chapter_wise_data[answer.chapterId].correct_questions++
		question_wise_data[answer.questionId].status = "C"
		question_wise_data[answer.questionId].scored_marks = answer.right_marks

		if (isLastMinutes(times)) {
			subject_wise_data_last[answer.subject].scored_marks += parseFloat(answer.right_marks)
		}
	} else {
		if (choosed != "S") {
			marks_obj.marks -= parseFloat(answer.wrong_marks)
			marks_obj.negativeMarks += parseFloat(answer.wrong_marks)
			subject_wise_data[answer.subject].scored_marks -= parseFloat(answer.wrong_marks)
			question_wise_data[answer.questionId].status = "W"
			question_wise_data[answer.questionId].scored_marks = "-" + answer.wrong_marks

			if (isLastMinutes(times)) {
				subject_wise_data_last[answer.subject].scored_marks -= parseFloat(answer.wrong_marks)
			}
		} else {
			question_wise_data[answer.questionId].status = "S"
		}
	}
}

//export this router to use in our index.js
module.exports = { router, getSingleTest, getTestAttempedCount }