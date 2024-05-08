const express = require('express')
const router = express.Router()
const con = require("../../db")
const { TestType } = require("../constants/test")
const { getUserActiveSession } = require("../../user-functions")

/*Test Category Create*/
router.post('/category', (req, res) => {
	if (req.body.id == 0) {
		con.query(`insert into test_categories(category,publish) values(?,?)`, [req.body.category, req.body.publish], function (err, result) {
			if (err) {
				res.status(500).end(err.sqlMessage)
				return
			}
			if (result.affectedRows > 0) {
				res.send({
					status: true,
					message: "Category Added Successfully",
					data: {
						id: result.insertId,
						category: req.body.category
					}
				})
			}
		})
	} else {
		con.query(`update test_categories set category=?,publish=? where id=? `, [req.body.category, req.body.publish, req.body.id], (err, result) => {
			if (err) {
				res.status(500).end(err.sqlMessage)
				return
			}
			res.send({
				status: true,
				message: "Category Updated Successfully"
			})
		})
	}
})

/*Test Category Get*/
router.get("/categories", (req, res) => {
	con.query(`select id,category,publish from test_categories`, (err, result) => {
		if (err) {
			res.status(500).end(err.sqlMessage)
			return
		}
		res.send(result)
	})
})

/*Test Category Delete*/
router.delete("/category/:id", (req, res) => {
	con.query(`delete from test_categories where id=?`, [req.params.id], (err, result) => {
		if (err) {
			res.status(500).end(err.sqlMessage)
			return
		}
		res.send({
			status: true,
			message: "Category Deleted Successfully"
		})
	})
})

// Duplicate Test
router.post("/duplicate", (req, res) => {
	let testId = req.body.testId
	let testQuery = `insert into test(name,category_id,instruction_id,duration,difficulty_id,total_questions,total_marks,test_type_id,quiz_pool,publish,publish_start_datetime,publish_end_datetime,generate_certificate,questions) select concat(name,' copy') name,category_id,instruction_id,duration,difficulty_id,total_questions,total_marks,test_type_id,quiz_pool,publish,publish_start_datetime,publish_end_datetime,generate_certificate,questions from test where id=?`

	con.query(testQuery, [testId], (err, result) => {
		if (err)
			return res.status(500).end(err.sqlMessage)

		let settingsQuery = `insert into test_settings(test_id, shuffle_questions, group_questions, optionwise_shuffling, all_questions_mandatory, allow_move, show_marks, partial_marking, show_calculator, bonus_marking, time_bound, clock_format, sectionwise_time, section_wise_times, questionwise_time, end_test_show_message, pass_feedback, fail_feedback, submit_message, show_percentage, passage_percentage, generate_rank, allow_duplicate_rank, skip_rank_after_duplicate, priority_to_finish_time, show_reports, show_reports_condition, full_screen, attempts_count) select ? test_id, shuffle_questions, group_questions, optionwise_shuffling, all_questions_mandatory, allow_move, show_marks, partial_marking, show_calculator, bonus_marking, time_bound, clock_format, sectionwise_time, section_wise_times, questionwise_time, end_test_show_message, pass_feedback, fail_feedback, submit_message, show_percentage, passage_percentage, generate_rank, allow_duplicate_rank, skip_rank_after_duplicate, priority_to_finish_time, show_reports, show_reports_condition, full_screen, attempts_count from test_settings where test_id=? `

		con.query(settingsQuery, [result.insertId, testId], (err2, result2) => {
			if (err2)
				return res.status(500).end(err2.sqlMessage)
			let success = result.affectedRows > 0 && result2.affectedRows > 0
			res.send({
				success,
				testId: result.insertId,
			})
		})
	})
})

/*Test Instructions Get*/
router.get("/instructions", (req, res) => {
	con.query(`select id,name,description from test_instructions`, (err, result) => {
		if (err)
			return res.status(500).end(err.sqlMessage)
		res.send(result)
	})
})

/*Get Section Instructions*/
router.get("/section-instructions", (req, res) => {
	con.query(`select id,name,description from section_instructions`, (err, result) => {
		if (err)
			return res.status(500).end(err.sqlMessage)
		res.send(result)
	})
})

/*Test Instructions Create*/
router.post('/instruction', (req, res) => {
	if (req.body.id == 0) {
		con.query(`insert into test_instructions(name,description) values(?,?)`, [req.body.name, req.body.description], function (err, result) {
			if (err) {
				return res.status(500).end(err.sqlMessage)
			}
			if (result.affectedRows > 0) {
				res.send({
					status: true,
					message: "Instructions Added Successfully",
					data: {
						id: result.insertId,
						name: req.body.name,
						description: req.body.description
					}
				})
			}
		})
	} else {
		con.query(`update test_instructions set name=?,description=? where id=? `, [req.body.name, req.body.description, req.body.id], (err, result) => {
			if (err) {
				res.status(500).end(err.sqlMessage)
				return
			}
			res.send({
				status: true,
				message: "Instructions Updated Successfully"
			})
		})
	}
})

/*Test Instruction Delete*/
router.delete("/instruction/:id", (req, res) => {
	con.query(`delete from test_instructions where id=?`, [req.params.id], (err, result) => {
		if (err) {
			return res.status(500).end(err.sqlMessage)
		}
		res.send({
			status: true,
			message: "Instruction Deleted Successfully"
		})
	})
})

/*Create Section Instruction*/
router.post("/section-instructions", (req, res) => {
	let data = req.body
	con.query("insert into section_instructions(name,description) values(?,?)", [data.name, data.description], (err, result) => {
		res.send({ id: result.insertId })
	})
})

// Update Section Instructions
router.put("/section-instructions", (req, res) => {
	let data = req.body
	con.query("update section_instructions set name=? , description=? where id=? ", [data.name, data.description, data.id], (err, result) => {
		res.send({ success: result.changedRows > 0 })
	})
})

// Delete Section Instructions
router.delete("/section-instructions/:id", (req, res) => {
	con.query("delete from section_instructions where id=? ", [req.params.id], (err, result) => {
		res.send({ success: result.affectedRows > 0 })
	})
})

/* Create Test */
router.post("/", async (req, res) => {
	const data = req.body
	const sessionId = await getUserActiveSession(res.locals.userId)
	const testTableData = [
		data.testName,
		data.testCategory,
		data.testInstruction,
		data.testDuration,
		data.difficulty,
		data.totalQuestions,
		data.totalMarks,
		data.testType,
		data.quiz_pool,
		data.publish,
		data.startDateTime,
		data.endDateTime,
		data.generateCertificate,
		data.markingSchemeId,
		data.selectedQuestions,
		sessionId,
		data.sectionCount,
		JSON.stringify(data.sectionInstructions)
	]


	const testId = await new Promise(resolve => {
		con.query("insert into test (name,category_id,instruction_id,duration,difficulty_id,total_questions,total_marks,test_type_id,quiz_pool,publish,publish_start_datetime,publish_end_datetime,generate_certificate,markingSchemeId,questions,sessionId,sectionsCount,sectionInstructions) values(?)", [testTableData], (err, result) => {
			if (err)
				return res.status(500).end(err.sqlMessage)
			resolve(result.insertId)
		})
	})

	JSON.parse(data.batches).forEach((batchId) => {
		con.query(`select batch_id,test_ids from batches_tests where batch_id=?`, [batchId], (err, result) => {
			let rs = result[0]
			if (rs == undefined) {
				con.query(`insert into batches_tests (batch_id,test_ids) values(?,?) `, [batchId, testId], (err, result) => {
					if (err)
						return res.status(500).end(err.sqlMessage)
				})
			} else {
				let test_ids = result[0].test_ids
				let concat = test_ids == "" ? `concat(test_ids,${testId})` : `concat(test_ids,',',${testId})`
				con.query(`update batches_tests set test_ids = ` + concat + `  where batch_id=? `, [batchId], (err, result) => {
					if (err)
						return res.status(500).end(err.sqlMessage)
				})
			}
		})
	})

	let test_settings = [
		testId,
		data.shuffleQuestionsWithSubject,
		data.groupQuestionsSubjectwise,
		data.optionwiseShuffling,
		data.mandatoryToAttemptAllQuestions,
		data.allowUsersMoveBackAndForward,
		data.showMarksPointsForTest,
		data.applyPartialMarking,
		data.showCalculator,
		data.allowBonusMarking,
		data.timeBound,
		data.clockFormat,
		data.sectionWiseTime,
		data.sectionWiseTimes,
		data.questionWiseTime,
		data.showCustomMessage,
		data.feedbackForPass,
		data.feedbackForFail,
		data.submitTestMessage,
		data.showPassFailPercentage,
		data.passPercentage,
		data.generateRank,
		data.allowDuplicateRank,
		data.skipRankAfterDuplicate,
		data.givePriorityToFinishTime,
		data.showTestTakerReports,
		data.showReportsCondition,
		data.fullScreenModeTest,
		data.attemptsCount
	]

	con.query("insert into test_settings( test_id, shuffle_questions, group_questions, optionwise_shuffling, all_questions_mandatory, allow_move, show_marks, partial_marking, show_calculator, bonus_marking, time_bound, clock_format, sectionwise_time, section_wise_times, questionwise_time, end_test_show_message, pass_feedback, fail_feedback, submit_message, show_percentage, passage_percentage, generate_rank, allow_duplicate_rank, skip_rank_after_duplicate, priority_to_finish_time, show_reports,show_reports_condition, full_screen, attempts_count) values(?)", [test_settings], (err, result) => {
		if (err)
			return res.status(500).end(err.sqlMessage)
		res.send({
			status: true,
			message: "Test Saved Successfully"
		})
	})

})

/*Get All Tests */
router.get("/", async (req, res) => {
	const sessionId = await getUserActiveSession(res.locals.userId)
	con.query(`select t.id,t.name,t.publish,t.total_questions,d.name as difficulty,tc.category from test t left join difficulty_level d on d.difficultyLevelId=t.difficulty_id left join test_categories tc on tc.id=t.category_id where t.sessionId=${sessionId} order by t.id desc`, (err, result) => {
		if (err)
			return res.status(500).end(err.sqlMessage)
		res.send(result)
	})
})

/*Get Done Tests for admin reports */
router.post("/done-tests", async (req, res) => {
	let data = req.body
	let test_ids = ""
	let batch_ids = ""
	let whereAdded = false
	let sqlAppend = ""
	const sessionId = await getUserActiveSession(res.locals.userId)

	if (data.courseId != 0 && data.batchId == 0) {
		batch_ids = await new Promise((resolve) => {
			con.query(`select group_concat(batchId) as id from erp_batches where courseId=${data.courseId}`, (err, result) => {
				if (err) {
					res.status(500).end(err.sqlMessage)
					return
				}
				if (result[0])
					resolve(result[0].id)
				else
					resolve(null)
			})
		})
	}

	if (data.batchId != 0) {
		test_ids = await new Promise((resolve) => {
			con.query(`select test_ids from batches_tests where batch_id=?`, [data.batchId], (err, result) => {
				if (err) {
					res.status(500).end(err.sqlMessage)
					return
				}

				if (result[0])
					resolve(result[0].test_ids.split(","))
				else
					resolve(null)
			})
		})

		if (test_ids) {
			sqlAppend += ` where dt.test_id in (${test_ids}) `
			whereAdded = true
		} else {
			sqlAppend += ` where dt.test_id = 0 `
			whereAdded = true
		}
	}

	if (data.batchId == 0 && data.courseId != 0) {
		test_ids = await new Promise((resolve) => {
			con.query(`select test_ids from batches_tests where batch_id in (${batch_ids})`, (err, result) => {

				if (err) {
					res.status(500).end(err.sqlMessage)
					return
				}

				if (result[0] != undefined) {
					let test_ids_temp = []
					result.forEach(r => {
						test_ids_temp = test_ids_temp.concat(r.test_ids.split(","))
					})
					resolve(test_ids_temp)
				} else {
					resolve(null)
				}
			})
		})

		if (test_ids) {
			sqlAppend += ` where dt.test_id in (${test_ids}) `
			whereAdded = true
		} else {
			sqlAppend += ` where dt.test_id = 0 `
			whereAdded = true
		}
	}

	if (data.name.trim()) {
		if (whereAdded) {
			sqlAppend += ` and t.name like '%${data.name}%' `
		} else {
			sqlAppend += ` where t.name like '%${data.name}%'`
			whereAdded = true
		}
	}

	if (whereAdded) {
		sqlAppend += " and dt.status=1"
	} else {
		sqlAppend += " where dt.status=1"
		whereAdded = true
	}

	if (whereAdded)
		sqlAppend += ` and t.sessionId=${sessionId}`
	else
		sqlAppend += ` where t.sessionId=${sessionId}`

	con.query(`select t.id,dt.attempt_no,t.name, date_format(t.publish_start_datetime,'%d-%M-%Y %h:%i:%s%p') as start_date,date_format(t.publish_end_datetime,'%d-%M-%Y %h:%i:%s%p') as end_date from test t inner join done_tests dt on dt.test_id=t.id ${sqlAppend} group by dt.test_id,dt.attempt_no order by t.id desc,dt.attempt_no desc`, (err, result) => {
		if (err) {
			res.status(500).end(err.sqlMessage)
			return
		}
		res.send(result)
	})
})

/*Get Single Test Details */
router.get("/:id(\\d+)/details", (req, res) => {
	con.query("select publish_end_datetime,now() as nowtime,name from test where id = ?", [req.params.id], (err, result) => {
		res.send(result[0])
	})
})

/*Get Attempts For Test  */
router.get("/:id/attempts", (req, res) => {
	con.query(`select attempt_no from done_tests where test_id=? group by attempt_no `, [req.params.id], (err, result) => {
		res.send(result)
	})
})

/*Get Single Test For Edit Test  */
router.get("/:id(\\d+)/edit", async (req, res) => {
	let testId = req.params.id

	let testSettingsDetails
	let testQuestions
	let testDetails = await new Promise((resolve) => {
		con.query(`select * from test where id=?`, [testId], (err, result) => {
			if (err) {
				return res.status(500).end(err.sqlMessage)
			}
			resolve(result[0])
		})
	})

	let setting = new Promise((res, rej) => {
		con.query(`select * from test_settings where test_id=?`, [testId], (err, result) => {
			if (err) {
				res.status(500).end(err.sqlMessage)
				return
			}
			if (result[0] == null) {
				res(null)
				return
			}
			res(result[0])
		})
	})

	await setting.then((data) => testSettingsDetails = data)

	if (testSettingsDetails == null) {
		return res.status(500).end("Error In Settings")
	}

	let testBatches = await new Promise((resolve, rej) => {
		con.query(`SELECT concat('[',group_concat(batch_id),']') as batches FROM batches_tests where find_in_set(?,test_ids)`, [testId], (err, result) => {
			if (err) {
				return res.status(500).end(err.sqlMessage)
			}
			if (result[0].batches == null) {
				resolve([])
			}
			resolve(JSON.parse(result[0].batches))
		})
	})

	let questionsIds = []
	JSON.parse(testDetails.questions).forEach((q) => {
		questionsIds.push(q[0])
	})

	if (questionsIds.length == 0) {
		questionsIds.push(0)
	}

	let subjects
	let subjectPromise = new Promise((resolve) => {
		con.query(`select es.subjectId,es.subject from erp_subjects es inner join questions q on es.subjectId=q.subjectId where q.questionId in(${questionsIds})`, (err, result) => {
			if (err) {
				res.status(500).end(err.sqlMessage)
				return
			}
			resolve(result)
		})
	})

	await subjectPromise.then(data => subjects = data)

	let questions = new Promise((resolve, reject) => {
		con.query(`select q.subjectId,q.questionCategoryId,srq.questionId,srq.question_text from single_response_questions srq inner join questions q on q.questionId=srq.questionId where srq.questionId in(${questionsIds}) union select q.subjectId,q.questionCategoryId,cs.questionId,cs.question_text from case_study_questions cs inner join questions q on q.questionId=cs.questionId where cs.questionId in(${questionsIds}) union select q.subjectId,q.questionCategoryId,ar.questionId,ar.question_text from assertion_reason_questions ar inner join questions q on q.questionId=ar.questionId where ar.questionId in(${questionsIds}) union select q.subjectId,q.questionCategoryId,mrq.questionId,mrq.question_text from multi_response_questions mrq inner join questions q on q.questionId=mrq.questionId  where mrq.questionId in(${questionsIds}) union select q.subjectId,q.questionCategoryId,tfq.questionId,tfq.question_text from true_false_questions tfq inner join questions q on q.questionId=tfq.questionId  where tfq.questionId in(${questionsIds}) union select q.subjectId,q.questionCategoryId,iq.questionId,iq.question_text from integer_questions iq inner join questions q on q.questionId=iq.questionId where iq.questionId in(${questionsIds}) union select q.subjectId,q.questionCategoryId,mmq.questionId,mmq.question_text from match_matrix_questions mmq inner join questions q on q.questionId=mmq.questionId where mmq.questionId in(${questionsIds}) order by field(questionId,${questionsIds})`, (err, result) => {

			if (err) {
				return res.status(500).end(err.sqlMessage)
			}

			let questions = JSON.parse(testDetails.questions)
			let section_wise_times = JSON.parse(testSettingsDetails.section_wise_times)
			result.forEach((r) => {
				let currentQuestion = questions.find((q) => q[0] == r.questionId)
				let currentSubject = subjects.find((s) => s.subjectId == r.subjectId)
				let currentSectionWiseTime = section_wise_times.find(swt => swt.id == r.subjectId)
				r["bonus"] = currentQuestion[1]
				r["right_marks"] = currentQuestion[2]
				r["wrong_marks"] = currentQuestion[3]
				r["subjectId"] = currentSubject.subjectId
				r["subject"] = currentSubject.subject
				if (currentSectionWiseTime != undefined)
					r["minutes"] = currentSectionWiseTime.minutes
			})
			resolve(result)
		})
	})
	await questions.then((data) => testQuestions = data)
	res.send(Object.assign({
		test: testDetails
	}, {
		settings: testSettingsDetails
	}, {
		batches: testBatches
	}, {
		questions: testQuestions
	}))
})

/*Update Test */
router.put("/", async (req, res) => {
	let data = req.body
	data.batches = JSON.parse(data.batches)

	let testTableData = [
		data.testName,
		data.testCategory,
		data.testInstruction,
		data.testDuration,
		data.difficulty,
		data.totalQuestions,
		data.totalMarks,
		data.testType,
		data.quiz_pool,
		data.publish,
		data.startDateTime,
		data.endDateTime,
		data.generateCertificate,
		data.markingSchemeId,
		data.selectedQuestions,
		data.testId
	]

	let testPromise = new Promise((resolve) => {
		con.query(`update test set name=?,category_id=?,instruction_id=?,duration=?,difficulty_id=?,total_questions=?,total_marks=?,test_type_id=?,quiz_pool=?,publish=?,publish_start_datetime=?,publish_end_datetime=?,generate_certificate=?,markingSchemeId=?,questions=? where id=? `, testTableData, (err, result) => {

			if (err) {
				res.status(500).end(err.sqlMessage)
			}

			resolve("OK")
		})
	})

	await testPromise.then(data => () => { })

	let test_settings = [
		data.shuffleQuestionsWithSubject,
		data.groupQuestionsSubjectwise,
		data.optionwiseShuffling,
		data.mandatoryToAttemptAllQuestions,
		data.allowUsersMoveBackAndForward,
		data.showMarksPointsForTest,
		data.applyPartialMarking,
		data.showCalculator,
		data.allowBonusMarking,
		data.timeBound,
		data.clockFormat,
		data.sectionWiseTime,
		data.sectionWiseTimes,
		data.questionWiseTime,
		data.showCustomMessage,
		data.feedbackForPass,
		data.feedbackForFail,
		data.submitTestMessage,
		data.showPassFailPercentage,
		data.passPercentage,
		data.generateRank,
		data.allowDuplicateRank,
		data.skipRankAfterDuplicate,
		data.givePriorityToFinishTime,
		data.showTestTakerReports,
		data.showReportsCondition,
		data.fullScreenModeTest,
		data.attemptsCount,
		data.testId
	]

	let testSettingsPromise = new Promise((resolve) => {
		con.query(`update test_settings set shuffle_questions=?, group_questions=?, optionwise_shuffling=?, all_questions_mandatory=?, allow_move=?, show_marks=?, partial_marking=?, show_calculator=?, bonus_marking=?, time_bound=?, clock_format=?, sectionwise_time=?, section_wise_times=?, questionwise_time=?, end_test_show_message=?, pass_feedback=?, fail_feedback=?, submit_message=?, show_percentage=?, passage_percentage=?, generate_rank=?, allow_duplicate_rank=?, skip_rank_after_duplicate=?, priority_to_finish_time=?, show_reports=?,show_reports_condition=?, full_screen=?, attempts_count=? where test_id=?`, test_settings, (err, r) => {
			if (err) {
				res.status(500).end(err.sqlMessage)
			}
			resolve("OK")
		})
	})

	await testSettingsPromise.then(data => () => { })

	data.batches.forEach((b) => {
		con.query(`select batch_id from batches_tests where batch_id=?`, [b], (err, result) => {
			if (result[0] == undefined) {
				con.query(`insert into batches_tests (batch_id,test_ids) values(?,?)`, [b, data.testId])
			}
		})
	})

	if (data.batches.length == 0) {
		data.batches.push(0)
	}
	let batchTestPromise = new Promise((resolve) => {
		con.query(`select batch_id,test_ids from batches_tests where batch_id in(${data.batches + ""})  and !find_in_set(${data.testId},test_ids)  `, (err, result) => {
			if (err) {
				res.status(500).end(err.sqlMessage)
				return
			}
			if (result[0] != undefined) {
				result.forEach(r => {
					let test_ids = r.test_ids
					let testId = data.testId
					let concat = test_ids == "" ? `concat(test_ids,${testId})` : `concat(test_ids,',',${testId})`
					con.query(`update batches_tests set test_ids=${concat} where batch_id=? `, [r.batch_id], (err, result) => {
						if (err) {
							res.status(500).end(err.sqlMessage)
						}
						resolve('OK')
					})
				})
			} else {
				resolve("OK")
			}
		})
	})

	await batchTestPromise.then(data => { })


	let batchPromise = new Promise((resolve) => {
		con.query(`select batch_id,test_ids from batches_tests where find_in_set(${data.testId},test_ids)  `, (err, result) => {
			if (err) {
				res.status(500).end(err.sqlMessage)
				return
			}
			if (result[0] != undefined) {
				result.forEach(r => {
					let test_ids = JSON.parse("[" + r.test_ids + "]")
					let testId = parseInt(data.testId)
					test_ids.splice(test_ids.indexOf(testId), 1)
					if (!data.batches.includes(r.batch_id)) {
						con.query(`update batches_tests set test_ids='${test_ids + ""}' where batch_id=?`, [r.batch_id], (err, result) => {
							if (err) {
								res.status(500).end(err.sqlMessage)
							}
							resolve("OK")
						})
					} else {
						resolve("OK")
					}
				})
			} else {
				resolve("OK")
			}
		})
	})
	await batchPromise.then(d => { })
	res.send({
		message: "Test Updated Successfully"
	})
})

/*Publish Test*/
router.put("/:id/publish", (req, res) => {
	con.query(`update test set publish=? where id=?`, [req.body.publish, req.params.id], (err, result) => {
		res.send({
			message: "Test Published Successfully"
		})
	})
})

/*Delete Test*/
router.delete("/:id", (req, res) => {
	con.query(`delete from test where id=?`, [req.params.id], (err, result) => {
		res.send({
			message: "Test Deleted Successfully"
		})
	})
})

/*Delete Multiple Tests*/
router.delete("/multiple/:ids", (req, res) => {
	con.query(`delete from test where id in(${req.params.ids})`, (err, result) => {
		if (err)
			res.status(500).end(err.sqlMessage)
		res.send({
			message: "Tests Deleted Successfully"
		})
	})
})

function getTestType(testId) {
	return new Promise(resolve => {
		con.query(`select test_type_id from test where id=${testId}`, (err, result) => resolve(result[0].test_type_id))
	})
}

/*Get Instructions By Test ID and User Id*/
router.get("/:testId/instructions-for-candidate", async (req, res) => {
	const testId = req.params.testId
	const userId = res.locals.userId
	const settings = await new Promise((resolve) => {
		con.query(`select * from test_settings where test_id=?`, [testId], (err, result) => {
			resolve(result[0])
		})
	})

	const testType = await getTestType(testId)
	if (testType != TestType.PRACTICE) {
		const attempted_count = await new Promise((resolve) => {
			con.query(`select count(dt.id) as attempts_count from done_tests dt where dt.user_id=? and test_id=? and status=1 `, [userId, testId], (err, result) => {
				if (err) return res.status(500).end(err.sqlMessage)
				resolve(result[0].attempts_count + 1)
			})
		})

		if (!(attempted_count <= settings.attempts_count))
			return res.send({ status: false, message: "You are not authorized to give this test." })
	}

	con.query(`select ti.description,t.name,t.id,t.total_questions questions,t.duration,t.sectionInstructions from test_instructions ti inner join test t on ti.id=t.instruction_id where t.id=? `, [testId], async (err, result) => {
		if (err) return res.status(500).end(err.sqlMessage)

		let sectionInstructions = await getSectionInstructions(JSON.parse(result[0].sectionInstructions))

		res.send({ ...result[0], sectionInstructions, status: true })
	})
})

async function getSectionInstructions(sectionInstructions) {
	if (!sectionInstructions) return []
	let sectionInstructionsIds = sectionInstructions.map(m => m.sectionInstructionId)
	return new Promise((resolve, reject) => {
		con.query(`select * from section_instructions where id in(?) `, [sectionInstructionsIds], (err, result) => {
			resolve(result)
		})
	})
}

/*Get Instructions By Test ID  */
router.get("/:testId/instructions", async (req, res) => {
	let testId = req.params.testId
	con.query(`select ti.description,t.name,t.id,t.questions,t.total_questions,t.duration from test_instructions ti inner join test t on ti.id=t.instruction_id where t.id=? `, [testId], (err, result) => {
		if (err)
			return res.status(500).end(err.sqlMessage)
		res.send(Object.assign({ status: true }, result[0]))
	})
})

/*Get Settings By Test ID */
router.get("/:id/settings", (req, res) => {
	con.query(`select * from test_settings where test_id=? `, [req.params.id], (err, result) => {
		if (err)
			return res.status(500).end(err.sqlMessage)
		res.send(result[0])
	})
})

//export this router to use in our index.js
module.exports = router