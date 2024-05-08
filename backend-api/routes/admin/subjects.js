const express = require('express')
const router = express.Router()
const con = require("../../db")
const fs = require('fs')
const { getUserActiveSession } = require("../../user-functions");

/**Create Subject */
router.post('/', (req, res) => {
	con.query(`insert into erp_courses_subjects(subject) values(?)`, [req.body.subject], function (err, result) {
		if (err)
			return res.status(500).end(err.sqlMessage)
		if (result.affectedRows > 0) {
			res.send({
				status: true,
				message: "Subject Added Successfully",
				data: {
					subjectId: result.insertId,
					subject: req.body.subject
				}
			})
		}
	})
})

/**Update Subject */
router.put('/:id', (req, res) => {
	con.query(`update erp_courses_subjects set subject=? where subjectId=?`, [req.body.subject, req.params.id], (err, result) => {
		if (err)
			return res.status(500).end(err.sqlMessage)

		if (result.changedRows > 0) {
			res.send({
				status: true,
				message: "Subject Updated Successfully"
			})
		} else {
			res.send({
				status: true,
				message: "No Rows Updated"
			})
		}
	})
})

/*Get All Subjects */
router.get('/', (req, res) => {

	var topics
	con.query("select * from erp_topics", (err, result) => {
		topics = result
	})

	var chapters
	con.query("select * from erp_subjects_chapters order by chapter asc", (err, result) => {
		result.forEach((r) => {

			r.topics = topics.filter((c) => {
				return c.chapterId == r.chapterId
			})

			r.topics.forEach((ca) => {
				delete ca.chapterId
			})

		})
		chapters = result
	})

	con.query("select ecs.subjectId,ecs.subject,ec.course from erp_courses_subjects ecs inner join erp_courses ec on ec.courseId=ecs.courseId order by ecs.subject asc", (err, result) => {

		if (err) {
			return res.status(500).end(err.sqlMessage)
		}	
		result.forEach((r) => {

			r.chapters = chapters.filter((c) => {
				return c.subjectId == r.subjectId
			})

			r.chapters.forEach((ca) => {
				delete ca.subjectId
			})

		})
		res.send(result)
	})
})

// Get Assigned subjects and batches
router.get("/assigned-to-batches", (req, res) => {
	con.query(`select batchId, concat('[',group_concat(subjectId),']') as subjectIds from batches_subjects group by batchId`, (err, result) => {
		if (err) {
			return res.status(500).end(err.sqlMessage)
		}
		res.send(result)
	})
})

//Assign Subjects to Users
router.post("/assign-to-users", (req, res) => {
	let userId = req.body.userId
	let batchIds = req.body.batchIds
	let courseIds = req.body.courseIds
	let subjectIds = req.body.subjectIds
	let sql = `insert into erp_users_subjects (userId,courseId,batchId,subjectId) values `

	for (let i = 0; i < batchIds.length; i++) {
		sql += `(${userId},${courseIds[i]},${batchIds[i]},${subjectIds[i]}),`
	}

	sql = sql.replace(/,(?=[^,]*$)/, '')
	con.query(sql, (err, result) => {
		if (err) return res.status(500).end(err.sqlMessage)
		res.send({ message: 'Subjects Assigned Successfully' })
	})
})

//Remove Subject from users
router.delete("/remove-from-users/:userId/:batchId/:subjectId", (req, res) => {
	let userId = req.params.userId
	let batchId = req.params.batchId
	let subjectId = req.params.subjectId
	con.query(`delete from erp_users_subjects where userId=? and batchId=? and subjectId=?`, [userId, batchId, subjectId], (err, result) => {
		if (err)
			return res.status(500).end(err.sqlMessage)
		res.send({ success: result.affectedRows > 0 })
	})
})

//get Assigned Subjects to users
router.get("/assigned-to-users", async (req, res) => {

	let coursesBatchesSubjects = await new Promise(resolve => {
		con.query(`select eus.userId,eus.batchId,ec.course,ec.courseId,eb.batch,es.subjectId,es.subject from erp_users_subjects eus inner join erp_users eu on eu.userId=eus.userId inner join erp_batches eb on eb.batchId = eus.batchId inner join erp_courses ec on ec.courseId = eb.courseId inner join erp_courses_subjects es on es.subjectId = eus.subjectId`, (err, result) => {
			resolve(result)
		})
	})

	con.query(`select eub.userId,eu.name from erp_users_batches eub inner join erp_users eu on eu.userId=eub.userId group by eub.userId`, (err, result) => {
		if (err)
			return res.status(500).end(err.sqlMessage)

		result.forEach(r => {
			let courseBatchSubject = coursesBatchesSubjects.filter(cb => cb.userId == r.userId)
			r["assignedSubjects"] = courseBatchSubject
		})

		res.send(result)
	})
})

//Assign Subjects to batches
router.post("/assign-to-batches", async (req, res) => {
	let batchId = req.body.batchId
	let subjectIds = req.body.subjectIds

	let AssignedSubjects = await new Promise((resolve) => {
		con.query(`select concat('[',group_concat(subjectId),']') as subjectIds from batches_subjects where batchId = ${batchId}`, (err, result) => {
			resolve(result[0].subjectIds ? JSON.parse(result[0].subjectIds) : [])
		})
	})

	subjectIds = subjectIds.filter(s => {
		return !AssignedSubjects.includes(s)
	})

	if (subjectIds.length == 0) {
		res.send({ message: 'Subjects assigned successfully' })
		return
	}

	let sql = "insert into batches_subjects(batchId,subjectId) values"
	subjectIds.forEach(sid => {
		sql += `(${batchId},${sid}),`
	})
	sql = sql.replace(/,(?=[^,]*$)/, '')

	con.query(sql, (err, result) => {
		if (err) {
			return res.status(500).end(err.sqlMessage)
		}
		res.send({ message: 'Subjects assigned successfully' })
	})
})

// Remove subject from assigned batches
router.delete("/remove-assigned-subject/:batchId/:subjectId", (req, res) => {
	let batchId = req.params.batchId
	let subjectId = req.params.subjectId
	con.query(`delete from batches_subjects where batchId=? and subjectId=?`, [batchId, subjectId], (err, result) => {
		if (err)
			return res.status(500).end(err.sqlMessage)
		res.send({ success: result.affectedRows > 0 })
	})
})

//Get question Types
router.get("/questions/types", (req, res) => {
	con.query("select questionTypeId,name from questiontypes", (err, result) => {
		if (err) {
			res.status(500).end(err.sqlMessage)
			return
		}
		res.send(result)
	})
})

//Get Difficulty levels
router.get("/questions/difficulty-levels", (req, res) => {
	con.query("select difficultyLevelId,name from difficulty_level", (err, result) => {
		if (err) {
			res.status(500).end(err.sqlMessage)
			return
		}
		res.send(result)
	})
})

//Get Question Taggings
router.get("/questions/taggings", (req, res) => {
	con.query("select * from question_taggings", (err, result) => {
		if (err) {
			return res.status(500).end(err.message)
		}
		res.send(result)
	})
})

//Get Question Categories
router.get("/questions/categories", (req, res) => {
	con.query("select * from question_categories", (err, result) => {
		if (err) {
			return res.status(500).end(err.message)
		}
		res.send(result)
	})
})


/* Get Questions with little Details only */
router.get("/:subjectid(\\d+)/chapters/:chapterid(\\d+)/question-type/:typeid(\\d+)/little", (req, res) => {
	let data = req.params
	let typeid_table = {
		1: 'single_response_questions',
		2: 'multi_response_questions',
		3: 'true_false_questions',
		4: 'integer_questions',
		5: 'match_matrix_questions',
		6: 'assertion_reason_questions',
		7: 'case_study_questions'
	}

	let typetable = typeid_table[data.typeid]

	let sql = `select q.questionId,sr.question_text,dl.name as difficulty from questions q inner join ${typetable} sr on sr.questionId = q.questionId left join difficulty_level dl on dl.difficultyLevelId=q.difficultyLevelId left join erp_chapters ch on ch.chapterId=q.chapterId left join erp_courses_subjects sub on sub.subjectId=q.subjectId where q.subjectId=? and q.chapterId=? and q.questionTypeId=? group by q.questionId`

	con.query(sql, [data.subjectid, data.chapterid, data.typeid], (err, result) => {
		if (err) {
			res.status(500).end(err.sqlMessage)
			return
		}
		res.send(result)
	})
})

/*Get Questions With All The Details */
router.get("/:subjectid(\\d+)/chapters/:chapterid(\\d+)/question-type/:typeid(\\d+)", (req, res) => {
	let data = req.params
	let typetable = ""
	let sql = ""
	if (["1", "2", "6", "7"].includes(data.typeid)) {

		if (data.typeid == 1)
			typetable = "single_response"
		else if (data.typeid == 2)
			typetable = "multi_response"
		else if (data.typeid == 6)
			typetable = "assertion_reason"
		else if (data.typeid == 7)
			typetable = "case_study"


		sql = `select sub.subject,ex.content as explanation,sr.question_text,sr.option_a,sr.option_b,sr.option_c,sr.option_d,sr.right_marks,sr.wrong_marks,q.difficultyLevelId,sr.correct,t.topic,q.subjectId,q.questionTypeId,
		q.questionId,q.chapterId ,q.topicId,dl.name as difficulty,ch.chapter from questions q inner join ${typetable}_questions sr on sr.questionId = q.questionId left join difficulty_level dl on dl.difficultyLevelId=q.difficultyLevelId left join erp_chapters ch on ch.chapterId=q.chapterId left join erp_topics t on t.chapterId=q.chapterId left join explanation ex on ex.questionId=q.questionId left join erp_courses_subjects sub on sub.subjectId=q.subjectId where q.subjectId=? and q.chapterId=? and q.questionTypeId=? group by q.questionId`
	} else if (data.typeid == 3 || data.typeid == 4) {
		if (data.typeid == 3) typetable = "true_false"
		else typetable = "integer"
		sql = `select sub.subject,ex.content as explanation,sr.question_text,sr.right_marks,sr.wrong_marks,q.difficultyLevelId,sr.correct,t.topic,q.subjectId,q.questionTypeId,
		q.questionId,q.chapterId ,q.topicId,dl.name as difficulty,ch.chapter from questions q inner join ${typetable}_questions sr on sr.questionId = q.questionId left join difficulty_level dl on dl.difficultyLevelId=q.difficultyLevelId left join erp_chapters ch on ch.chapterId=q.chapterId left join erp_topics t on t.chapterId=q.chapterId left join explanation ex on ex.questionId=q.questionId left join erp_courses_subjects sub on sub.subjectId=q.subjectId where q.subjectId=? and q.chapterId=? and q.questionTypeId=? group by q.questionId`
	}

	con.query(sql, [data.subjectid, data.chapterid, data.typeid], (err, result) => {
		if (err) {
			res.status(500).end(err.sqlMessage)
			return
		}
		res.send(result)
	})
})

function getAddedQuestionIdsByTestCategoryId(testCategoryId, userId) {
	return new Promise(async (resolve, reject) => {

		const sessionId = await getUserActiveSession(userId)

		con.query(`select questions from test where category_id=? and sessionId=?`, [testCategoryId, sessionId], (err, result) => {

			let questionIds = []
			result.forEach(r => {
				let questions = JSON.parse(r.questions)
				questions.forEach(q => {
					questionIds.push(q[0])
				})
			})

			resolve(questionIds.length > 0 ? questionIds : [0])
		})
	})
}

/*Get Questions For Adding In Test With More Details */
router.post("/add-to-test", async (req, res) => {

	let data = req.body
	let typeid_table = {
		1: 'single_response_questions',
		2: 'multi_response_questions',
		3: 'true_false_questions',
		4: 'integer_questions',
		5: 'match_matrix_questions',
		6: "assertion_reason_questions",
		7: "case_study_questions"
	}

	let append = data.count ? ` order by rand() limit ${data.count}` : ``

	let typetable = typeid_table[data.typeId]

	let questionsToSkip = await getAddedQuestionIdsByTestCategoryId(data.testCategoryId, res.locals.userId)


	let sql = `select q.questionId,q.questionCategoryId,q.questionTaggingId,sr.question_text,q.subjectId,sub.subject,sr.right_marks,sr.wrong_marks,dl.name as difficulty from questions q inner join ${typetable} sr on sr.questionId = q.questionId left join difficulty_level dl on dl.difficultyLevelId=q.difficultyLevelId left join erp_courses_subjects sub on sub.subjectId=q.subjectId where q.subjectId=? and q.chapterId=? and q.questionTypeId=? and q.questionCategoryId=? and q.questionId not in (${questionsToSkip}) group by q.questionId  ${append} `

	con.query(sql, [data.subjectId, data.chapterId, data.typeId, data.questionCategoryId], (err, result) => {

		if (err) {
			return res.status(500).end(err.sqlMessage)
		}

		res.send(result)
	})
})

function getParagraphs() {
	return new Promise((resolve, reject) => {
		con.query(`SELECT p.paragraph,p.paragraphId,pq.questionId from paragraphs p inner join paragraphId_questionId pq on pq.paragraphId = p.paragraphId`, (err, result) => {
			if (err) {
				return reject(err)
			}
			resolve(result)
		});
	})
}

/*Get Single Question With All The Details */
router.get("/question/:questionId/question-type/:typeid", (req, res) => {
	let data = req.params
	let typetable = ""
	let sql = ""

	if (["1", "2","6","7"].includes(data.typeid)) {

		if (data.typeid == 1) {
			typetable = "single_response"
		}

		else if (data.typeid == 2) {
			typetable = "multi_response"
		}

		else if (data.typeid == 6) {
			typetable = "assertion_reason"
		}
		else if (data.typeid == 7) {
			typetable = "case_study"
		}

		sql = `select sub.subject,ex.content as explanation,sr.question_text,sr.option_a,sr.option_b,sr.option_c,sr.option_d,sr.option_e,sr.option_f,sr.right_marks,sr.wrong_marks,q.difficultyLevelId,sr.correct,t.topic,q.subjectId,q.questionTypeId,
		q.questionId,q.chapterId,q.topicId,dl.name as difficulty,ch.chapter from questions q inner join ${typetable}_questions sr on sr.questionId = q.questionId left join difficulty_level dl on dl.difficultyLevelId = q.difficultyLevelId left join erp_chapters ch on ch.chapterId=q.chapterId left join erp_topics t on t.chapterId=q.chapterId left join explanation ex on ex.questionId=q.questionId left join erp_courses_subjects sub on sub.subjectId=q.subjectId where q.questionTypeId=? and q.questionId=? group by q.questionId`
	} else if (data.typeid == 3) {
		typetable = "true_false"
		sql = `select sub.subject,ex.content as explanation,sr.question_text,sr.right_marks,sr.wrong_marks,q.difficultyLevelId,sr.correct,t.topic,q.subjectId,q.questionTypeId,
		q.questionId,q.chapterId,q.topicId,dl.name as difficulty,ch.chapter from questions q inner join ${typetable}_questions sr on sr.questionId = q.questionId left join difficulty_level dl on dl.difficultyLevelId=q.difficultyLevelId left join erp_chapters ch on ch.chapterId=q.chapterId left join erp_topics t on t.chapterId=q.chapterId left join explanation ex on ex.questionId=q.questionId left join erp_courses_subjects sub on sub.subjectId=q.subjectId where q.questionTypeId=? and q.questionId=? group by q.questionId`
	} else if (data.typeid == 4) {
		typetable = "integer"
		sql = `select sub.subject,ex.content as explanation,sr.question_text,sr.right_marks,sr.wrong_marks,q.difficultyLevelId,sr.correct,sr.correct_from,sr.correct_to,t.topic,q.subjectId,q.questionTypeId,
		q.questionId,q.chapterId,q.topicId,dl.name as difficulty,ch.chapter from questions q inner join ${typetable}_questions sr on sr.questionId = q.questionId left join difficulty_level dl on dl.difficultyLevelId=q.difficultyLevelId left join erp_chapters ch on ch.chapterId=q.chapterId left join erp_topics t on t.chapterId=q.chapterId left join explanation ex on ex.questionId=q.questionId left join erp_courses_subjects sub on sub.subjectId=q.subjectId where q.questionTypeId=? and q.questionId=? group by q.questionId`
	} else if (data.typeid == 5) {
		sql = `select sub.subject,ex.content as explanation,sr.question_text,sr.column1,sr.column2,sr.answer_key,sr.right_marks,sr.wrong_marks,q.difficultyLevelId,t.topic,q.subjectId,q.questionTypeId,
		q.questionId,q.chapterId,q.topicId,dl.name as difficulty,ch.chapter from questions q inner join match_matrix_questions sr on sr.questionId = q.questionId left join difficulty_level dl on dl.difficultyLevelId=q.difficultyLevelId left join erp_chapters ch on ch.chapterId = q.chapterId left join erp_topics t on t.chapterId=q.chapterId left join explanation ex on ex.questionId=q.questionId left join erp_courses_subjects sub on sub.subjectId=q.subjectId where q.questionTypeId=? and q.questionId=? group by q.questionId`
	}

	con.query(sql, [data.typeid, data.questionId], async (err, result) => {

		if (err) {
			return res.status(500).end(err.sqlMessage)
		}

		let paragraphs = await getParagraphs()

		result.forEach(r => {

			let paragraph = paragraphs.find(p => p.questionId == r.questionId)

			if (paragraph) {
				r.paragraph = paragraph.paragraph
				r.paragraphId = paragraph.paragraphId
			}

		})

		res.send(result[0])
	})
})

/*Get Question Details For Edit Page */
router.get("/questions/:questionId/details", (req, res) => {
	con.query(`select subjectId,chapterId,topicId,questionTypeId,questionCategoryId,questionTaggingId from questions where questionId = ?`, [req.params.questionId], (err, result) => {
		res.send(result[0])
	})
})

/*Get Count of questions in subject,chapter etc */
router.get("/:subjectId(\\d+)/chapters/:chapterId(\\d+)/topics/:topicId/question-type/:typeId(\\d+)/count", (req, res) => {
	let data = req.params
	var topic_sql = ` and topicId=${data.topicId} `
	if (data.topicId == 0 || data.topicId == null) {
		topic_sql = ``
	}

	con.query(`select count(questionId) as total from questions where subjectId=? and chapterId=? ${topic_sql} and questionTypeId=?`,
		[data.subjectId, data.chapterId, data.typeId], (err, result) => {
			if (err) {
				res.status(500).end(err.sqlMessage)
			}
			res.send(result[0])
		})
})

//Delete Subject By ID
router.delete('/:id', (req, res) => {
	con.query(`delete from erp_courses_subjects where subjectId = ?`, [req.params.id], function (err, result) {
		if (err) {
			res.status(500).end(err.sqlMessage)
			return
		}

		if (result.affectedRows > 0) {
			res.send({
				status: true,
				message: "Subject Deleted Successfully"
			})
		} else {
			res.send({
				status: false,
				message: "Could not delete the subject"
			})
		}
	})
})

//Delete multiple Subjects 
router.delete('/multiple/:ids', (req, res) => {
	let ids = req.params.ids.split(",")

	con.query(`delete from erp_courses_subjects where subjectId in (?)`, [ids], function (err, result) {
		if (err) {
			res.send({
				status: false,
				message: err.sqlMessage
			})
			return
		}
		if (result.affectedRows > 0) {
			res.send({
				status: true,
				message: "Subjects Deleted Successfully"
			})
		} else {
			res.send({
				status: false,
				message: "Counld not delete subjects"
			})
		}
	})
})

async function isChapterExistInSubject(subjectId, chapter) {
	return new Promise(resolve => {
		con.query(`select chapter from erp_chapters where chapter=? and subjectId=? `, [chapter, subjectId], (err, result) => {
			resolve(result.length > 0)
		})
	})
}

// Create new Chapter
router.post('/chapters', async (req, res) => {
	const subjectId = req.body.subjectId
	const chapter = req.body.chapter

	const isChapterExist = await isChapterExistInSubject(subjectId, chapter)
	if (isChapterExist)
		return res.status(500).end(`Chapter "${chapter}" already exists in subject`)

	con.query(`insert into erp_chapters(subjectId,chapter) values(?)`, [[subjectId, chapter]], function (err, result) {
		if (err)
			return res.status(500).end(err.sqlMessage)

		if (result.affectedRows > 0) {
			res.send({
				status: true,
				message: "Chapter Added Successfully",
				data: {
					chapterId: result.insertId,
					chapter: chapter
				}
			})
		}
		else {
			res.send({
				status: false,
				message: 'Could not add chapter'
			})
		}
	})
})

function insertQuestionTableData(data, res) {
	return new Promise((resolve, reject) => {
		con.query("insert into questions(subjectId,chapterId,questionTypeId,topicId,questionCategoryId,questionTaggingId,difficultyLevelId,idealTime) values(?)",
			[[data.subjectId, data.chapterId, data.questionTypeId, data.topicId, data.questionCategoryId, data.questionTaggingId, data.difficultyId,data.idealTime]], (err, result) => {
				if (err) {
					res.status(500).end(err.sqlMessage)
					return
				}
				let questionId = result.insertId
				resolve(questionId)
			})
	})
}

function insertExplation(data, questionId, res) {
	if (data.explanation.trim() != "") {
		con.query("insert into explanation (content,questionId) values(?,?)", [data.explanation, questionId], (err, r) => {
			if (err) {
				res.status(500).end(err.sqlMessage)
				return
			}
		})
	}
}

/*Create Singlechoise,Assertion,Case Study Questions */
router.post('/questions/common/:table', async (req, res) => {
	let data = req.body
	let table = req.params.table
	data.correct = "option_" + (data.correct.toLowerCase())

	data.topicId = data.topicId == 0 ? null : data.topicId

	let questionId = await insertQuestionTableData(data, res)

	insertExplation(data, questionId, res)

	con.query(`insert into ${table}(questionId,question_text,option_a,option_b,option_c,option_d,option_e,option_f,right_marks,wrong_marks,correct) values(?)`,
		[[questionId, data.question, data.options[0], data.options[1], data.options[2],
			data.options[3], data.options[4], data.options[5], data.rightmarks, data.wrongmarks,  data.correct
		]],
		(err, r) => {
			if (err){
				return res.status(500).end(err.sqlMessage)
			}
			res.send({
				message: "Question Added Successfully"
			})
		})
})

/*Create Multichoise Questions */
router.post('/questions/multichoice', async (req, res) => {
	const data = req.body

	data.correct.forEach((d, i) => {
		data.correct[i] = "option_" + (d.toLowerCase())
	})

	data.topicId = data.topicId == 0 ? null : data.topicId

	let questionId = await insertQuestionTableData(data, res)

	insertExplation(data, questionId, res)

	con.query(`insert into multi_response_questions(questionId,question_text,option_a,option_b,option_c,option_d,option_e,option_f,
right_marks,wrong_marks,correct) values(?)`,
		[[questionId, data.question, data.options[0], data.options[1], data.options[2],
			data.options[3], data.options[4], data.options[5], data.rightmarks, data.wrongmarks,"" + data.correct
		]],
		(err, r) => {

			if (err)
				return res.status(500).end(err.sqlMessage)

			res.send({ message: "Question Added Successfully" })
		})

})

/*Create True False Questions */
router.post('/questions/true-false', async (req, res) => {
	const data = req.body
	data.topicId = data.topicId == 0 ? null : data.topicId

	const questionId = await insertQuestionTableData(data, res)

	insertExplation(data, questionId, res)

	con.query(`insert into true_false_questions(questionId,question_text,right_marks,wrong_marks,correct) values(?)`,
		[[questionId, data.question, data.rightmarks, data.wrongmarks, data.correct]],
		(err, r) => {
			if (err)
				return res.status(500).end(err.sqlMessage)
			res.send({ message: "Question Added Successfully" })
		})
})

/*Create Integer Questions */
router.post('/questions/integer', async (req, res) => {
	const data = req.body
	data.topicId = data.topicId == 0 ? null : data.topicId

	const questionId = await insertQuestionTableData(data, res)

	insertExplation(data, questionId, res)

	con.query(`insert into integer_questions(questionId,question_text,right_marks,wrong_marks,correct,correct_from,correct_to) values(?)`,
		[[questionId, data.question, data.rightmarks, data.wrongmarks, data.correct, data.correct_from, data.correct_to]],
		(err, r) => {
			if (err)
				return res.status(500).end(err.sqlMessage)
			res.send({ message: "Question Added Successfully" })
		})
})

/*Create Match-Matrix Questions */
router.post('/questions/match-matrix', async (req, res) => {
	let data = req.body

	data.topicId = data.topicId == 0 ? null : data.topicId

	let questionId = await insertQuestionTableData(data, res)

	insertExplation(data, questionId, res)

	data.column1 = JSON.stringify(data.column1)
	data.column2 = JSON.stringify(data.column2)
	data.answerKey = JSON.stringify(data.answerKey)

	con.query(`insert into match_matrix_questions(questionId,question_text,right_marks,wrong_marks,column1,column2,answer_key) values(?)`,
		[[questionId, data.question, data.rightmarks, data.wrongmarks,data.column1, data.column2, data.answerKey]],
		(err, r) => {
			if (err)
				return res.status(500).end(err.sqlMessage)
			res.send({ message: "Question Added Successfully" })
		})
})

function updateParagraph(data) {
	if (data.paragraph.trim()) {
		con.query(`select questionId from paragraphId_questionId where questionId=?`, [data.questionId], (err, result) => {

			if (result.length > 0) {
				con.query(`update paragraphs set paragraph=? where paragraphId=?`, [data.paragraph, data.paragraphId])
			} else {
				con.query(`insert into paragraphs (paragraph,chapterId) values(?) `, [[data.paragraph, data.chapterId]], (err, result) => {
					let paragraphId = result.insertId
					con.query(`insert into paragraphId_questionId(paragraphId,questionId) values(?)`, [[paragraphId, data.questionId]])
				})
			}

		})
	}
}

function updateExplanation(data) {
	if (data.explanation != null && data.explanation.trim() != "") {
		con.query(`select questionId from explanation where questionId = ? `, [data.questionId], (err, result) => {

			if (result.length > 0) {
				con.query(`update explanation set content = ? where questionId = ?`, [data.explanation, data.questionId])
			} else {
				con.query("insert into explanation (content,questionId) values(?,?)", [data.explanation, data.questionId])
			}

		})
	} else {
		con.query('delete from explanation where questionId = ?', [data.questionId])
	}
}

/*Update Single,Assertion,Case Study Questions */
router.put('/questions/common/:table', (req, res) => {
	let table = req.params.table
	const data = req.body
	data.correct = "option_" + (data.correct.toLowerCase())
	data.topicId = data.topicId == 0 ? null : data.topicId

	con.query(`update ${table} set question_text=?,option_a=?,option_b=?,option_c=?,option_d=?,option_e=?,option_f=?,
	right_marks=?,wrong_marks=?,correct=? where questionId=? `, [data.question, data.options[0], data.options[1], data.options[2], data.options[3],
	data.options[4], data.options[5], data.rightmarks, data.wrongmarks, data.correct, data.questionId
	], (err, r) => {
		if (err) res.status(500).end(err.sqlMessage)
	})

	con.query(`update questions set subjectId=?,chapterId=?,topicId=?,questionTypeId=?,questionCategoryId=?,questionTaggingId=? where questionId=? `, [data.subjectId, data.chapterId, data.topicId, data.questionTypeId, data.questionCategoryId, data.questionTaggingId, data.questionId], (err, r) => {
		if (err) res.status(500).end(err.sqlMessage)
	})

	updateExplanation(data)
	updateParagraph(data)

	res.send({ message: "Question Updated Successfully" })
})


/*Update Multichoise Questions */
router.put('/questions/multichoice', (req, res) => {
	const data = req.body

	data.correct.forEach((d, i) => {
		data.correct[i] = "option_" + (d.toLowerCase())
	})

	data.topicId = data.topicId == 0 ? null : data.topicId

	con.query(`update multi_response_questions set question_text=?,option_a=?,option_b=?,option_c=?,option_d=?,option_e=?,option_f=?,
	right_marks=?,wrong_marks=?,correct=? where questionId=? `, [data.question, data.options[0], data.options[1], data.options[2], data.options[3],
	data.options[4], data.options[5], data.rightmarks, data.wrongmarks, "" + data.correct, data.questionId
	], (err, r) => {
		if (err) res.status(500).end(err.sqlMessage)
	})

	con.query(`update questions set subjectId=?,chapterId=?,topicId=?,questionTypeId=?,questionCategoryId=?,questionTaggingId=? where questionId=? `, [data.subjectId, data.chapterId, data.topicId, data.questionTypeId, data.questionCategoryId, data.questionTaggingId, data.questionId], (err, result) => {
		if (err) res.status(500).end(err.sqlMessage)
	})

	updateExplanation(data)
	updateParagraph(data)

	res.send({ message: "Question Updated Successfully" })
})

/*Update True False Questions */
router.put('/questions/true-false', (req, res) => {
	const data = req.body
	data.topicId = data.topicId == 0 ? null : data.topicId
	con.query(`update true_false_questions set question_text=?,right_marks=?,wrong_marks=?,correct=? where questionId=? `,
		[data.question, data.rightmarks, data.wrongmarks, data.correct, data.questionId], (err, r) => {
			if (err) res.status(500).end(err.sqlMessage)
		})

	con.query(`update questions set subjectId=?,chapterId=?,topicId=?,questionTypeId=?,questionCategoryId=?,questionTaggingId=? where questionId=? `, [data.subjectId, data.chapterId, data.topicId, data.questionTypeId, data.questionCategoryId, data.questionTaggingId, data.questionId], (err, r) => {
		if (err) res.status(500).end(err.sqlMessage)
	})

	updateExplanation(data)
	updateParagraph(data)
	res.send({ message: "Question Updated Successfully" })
})

/*Update Integer Questions */
router.put('/questions/integer', (req, res) => {
	const data = req.body
	data.topicId = data.topicId == 0 ? null : data.topicId

	con.query(`update integer_questions set question_text=?,right_marks=?,wrong_marks=?,correct=?,correct_from=?,correct_to=? where questionId=? `,
		[data.question, data.rightmarks, data.wrongmarks, data.correct, data.correct_from, data.correct_to, data.questionId], (err, r) => {
			if (err) res.status(500).end(err.sqlMessage)
		})

	con.query(`update questions set subject_id=?,chapter_id=?,topic_id=?,questionTypeId=?,questionCategoryId=?,questionTaggingId=? where questionId=? `, [data.subjectId, data.chapterId, data.topicId, data.questionTypeId, data.questionCategoryId, data.questionTaggingId, data.questionId], (err, result) => {
		if (err) res.status(500).end(err.sqlMessage)
	})

	updateExplanation(data)
	updateParagraph(data)

	res.send({ message: "Question Updated Successfully" })
})

/*Update Match Matrix Questions */
router.put('/questions/match-matrix', (req, res) => {
	const data = req.body
	data.topicId = data.topicId == 0 ? null : data.topicId
	data.column1 = JSON.stringify(data.column1)
	data.column2 = JSON.stringify(data.column2)
	data.answerKey = JSON.stringify(data.answerKey)

	con.query(`update match_matrix_questions set question_text=?,right_marks=?,wrong_marks=?,column1=?,column2=?,answer_key=? where questionId=? `,
		[data.question, data.rightmarks, data.wrongmarks, data.column1, data.column2, data.answerKey, data.questionId], (err, r) => {
			if (err) res.status(500).end(err.sqlMessage)
		})

	con.query(`update questions set subjectId=?,chapterId=?,topicId=?,questionTypeId=? where questionId=? `, [data.subjectId, data.chapterId, data.topicId, data.questionTypeId, data.questionId], (err, r) => {
		if (err) res.status(500).end(err.sqlMessage)
	})

	updateExplanation(data)
	res.send({ message: "Question Updated Successfully" })
})


/*Create Topic */
router.post('/topics', (req, res) => {
	con.query(`insert into erp_topics(chapterId,topic) values(?,?)`, [req.body.chapterId, req.body.topic], function (err, result) {
		if (err) res.status(500).end(err.sqlMessage)
		if (result.affectedRows > 0) {
			res.send({
				status: true,
				message: "Topic Added Successfully",
				data: {
					topicId: result.insertId,
					topic: req.body.topic
				}
			})
		}
		else {
			res.send({
				status: false,
				message: "Could not add topic"
			})
		}
	})
})

router.put('/chapters/:id', (req, res) => {

	con.query(`update erp_chapters set chapter=? where chapterId=?`, [req.body.chapter, req.params.id], function (err, result) {
		if (err) return res.status(500).end(err.sqlMessage)

		if (result.changedRows > 0) {
			res.send({
				status: true,
				message: "Chapter Updated Successfully"
			})
		} else {
			res.send({
				status: true,
				message: "No Rows Updated"
			})
		}
	})

})

router.put('/topics/:id', (req, res) => {
	con.query(`update erp_topics set topic=? where topicId=?`, [req.body.topic, req.params.id], function (err, result) {
		if (err) return res.status(500).end(err.sqlMessage)
		if (result.changedRows > 0) {
			res.send({
				status: true,
				message: "Topic Updated Successfully"
			})
		} else {
			res.send({
				status: true,
				message: "No Rows Updated"
			})
		}
	})
})

//Delete Chapter By Id
router.delete('/chapters/:id', (req, res) => {
	con.query(`delete from erp_chapters where chapterId=?`, [req.params.id], function (err, result) {
		if (err) return res.status(500).end(err.sqlMessage)

		if (result.affectedRows > 0) {
			res.send({
				success: true,
				message: "Chapter Deleted Successfully"
			})
		} else {
			res.send({
				success: false,
				message: "Could not delete chapter"
			})
		}
	})
})

router.delete('/topics/:id', (req, res) => {
	con.query(`delete from erp_topics where topicId=?`, [req.params.id], function (err, result) {
		if (err) return res.status(500).end(err.sqlMessage)
		if (result.affectedRows > 0) {
			res.send({
				success: true,
				message: "Topic Deleted Successfully"
			})
		} else {
			res.send({
				success: false,
				message: "Cound not delete topic"
			})
		}
	})
})

/*Delete Single Question */
router.delete('/questions/:id', async (req, res) => {
	const questionId = req.params.id
	const content = await getContentFromQuestions(questionId)

	con.query(`delete from questions where questionId=?`, [questionId], function (err, result) {

		if (err) return res.status(500).end(err.sqlMessage)

		if (result.affectedRows > 0) {
			deleteFiles(content)
			res.send({
				status: true,
				message: "Question Deleted Successfully"
			})
		} else {
			res.send({
				status: false,
				message: "Could not delete Question"
			})
		}
	})

})

/*Delete Multiple Questions */
router.delete('/questions/multiple/:ids', async (req, res) => {
	let questionIds = req.params.ids.split(",")

	// delete questions along with images by question id(s)
	deleteQuestionsByQuestionIds(questionIds, res);
})

async function deleteQuestionsByQuestionIds(questionId, res) {
	let content = await getContentFromQuestions(questionId, res)

	con.query(`delete from questions where questionId in (?)`, [questionId], function (err, result) {

		if (err) {
			return res.status(500).end(err.sqlMessage)
		}

		if (result.affectedRows > 0) {

			deleteFiles(content)

			res.send({
				status: true,
				message: `${result.affectedRows} Questions Deleted Successfully`
			})

		} else {
			res.send({
				status: false,
				message: "Could not delete questions"
			})
		}
	})
}

function getContentFromQuestions(questionId, res) {

	return new Promise((resolve) => {
		con.query(`select srq.question_text,srq.option_a,srq.option_b,srq.option_c,srq.option_d,srq.option_e,srq.option_f from  single_response_questions srq where srq.questionId in(${questionId}) union select mrq.question_text,mrq.option_a,mrq.option_b,mrq.option_c,mrq.option_d,mrq.option_e,mrq.option_f from multi_response_questions mrq  where mrq.questionId in(${questionId}) union select tfq.question_text,null as option_a,null as option_b,null as option_c,null as option_d,null as option_e,null as option_f from  true_false_questions tfq where tfq.questionId in(${questionId}) union select iq.question_text,null as option_a,null as option_b,null as option_c,null as option_d,null as option_e,null as option_f from integer_questions iq where iq.questionId in(${questionId}) union select mmq.question_text,mmq.column1 as option_a,mmq.column2 as option_b,null as option_c,null as option_d,null as option_e,null as option_f from match_matrix_questions mmq where mmq.questionId in(${questionId}) union select content as question_text,'' as option_a,'' as option_b,'' as option_c ,'' as option_d,'' as option_e,'' as option_f from explanation where questionId in (${questionId}) `, (err, result) => {

			if (err) {
				return res.status(500).end(err.sqlMessage)
			}

			let content = ""

			result.forEach(r => {
				content += r.question_text
				content += r.option_a
				content += r.option_b
				content += r.option_c
				content += r.option_d
				content += r.option_e
				content += r.option_f
			})

			resolve(content)
		})
	})
}

function deleteFiles(cont) {

	var pattern = /<img[^>]+>/gi
	var match = []

	while (mat = pattern.exec(cont)) {
		match.push(mat)
	}

	var tag = /(?<=\bsrc=")[^"]*/

	filesArray = []

	match.forEach(m => {
		matching = tag.exec(m)
		filesArray.push(matching)
	})

	filesArray.forEach(file => {

		if (fs.existsSync("../public_html/test/" + file)) {

			fs.unlink("../public_html/test/" + file, (err) => {

				if (err) {
					console.error(err)
					return
				}

			})

		}

	})
}

router.get("/check-questions", async (req, res) => {
	con.query(`select questions from test`, (err, result) => {
		let questionIds = []

		result.forEach(r => {
			let questions = JSON.parse(r.questions)

			questions.forEach(q => {
				questionIds.push(q[0])
			})
		})

		con.query(`select group_concat(questionId) as questionIds from questions where questionId not in (?)`, [questionIds], (err, result) => {

			if (err) {
				return res.status(500).end(err.message)
			}

			if (result[0].questionIds != null) {
				return deleteQuestionsByQuestionIds(result[0].questionIds.split(","), res)
			}

			res.send({ message: "No questions found to delete" })
		})

	})
})

router.get("/check-images", async (req, res) => {
	fs.readdir("../public_html/test/question-images/", (err, files) => {
		files.forEach(file => {
			let fileName = "question-images/" + file

			let query = `select questionId from single_response_questions where question_text like '%${fileName}%' or option_a like '%${fileName}%' or option_b like '%${fileName}%' or option_c like '%${fileName}%' or option_d like '%${fileName}%' or option_e like '%${fileName}%' or option_f like '%${fileName}%' union select questionId from multi_response_questions where question_text like '%${fileName}%' or option_a like '%${fileName}%' or option_b like '%${fileName}%' or option_c like '%${fileName}%' or option_d like '%${fileName}%' or option_e like '%${fileName}%' or option_f like '%${fileName}%' union select questionId from integer_questions where question_text like '%${fileName}%' union select questionId from true_false_questions where question_text like '%${fileName}%' union select questionId from explanation where content like '%${fileName}%' union select null as questionId from paragraphs where paragraph like '%${fileName}%'`

			con.query(query, (err, result) => {

				if (err) {
					return res.status(500).end(err.message)
				}

				if (result.length == 0) {

					if (fs.existsSync("../public_html/test/" + fileName)) {
						fs.unlinkSync("../public_html/test/" + fileName)
						console.count("Deleted ");
					}

				}

				console.count("Finded Files ");
			})

		})
	})

	res.send({ message: "Deleting Images in Background Process" })
})

//export this router to use in our index.js
module.exports = router