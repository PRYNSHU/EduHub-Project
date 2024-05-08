var express = require('express')
var router = express.Router()
var con = require("../../db")
const { questionType } = require("../constants/test")

router.post("/sample", (req, res) => {
	res.send(req.body)
});

/*Check if Test Name already exists */
router.get("/checkname/:name", (req, res) => {
	con.query(`select name from test where name = '${req.params.name}'`, (err, result) => {
		res.send(result.length > 0)
	})
})

/*Check If chapter exist or not */
router.get("/check-chapters", (req, res) => {
	con.query(`SELECT group_concat(lower(ec.course),'¥',lower(ecs.subject),'¥',lower(esc.chapter) SEPARATOR '£') as sc FROM erp_courses_subjects ecs inner join erp_subjects_chapters esc on ecs.subjectId=esc.subjectId inner join erp_courses ec on ec.courseId=ecs.courseId`, (err, result) => {
		res.send(result[0].sc)
	})
})

function insertExplanation(content, questionId) {
	con.query(`insert into explanation (content,questionId) values(?,?)`, [content, questionId])
}

function getChapterId(chaptername, subjectId) {
	const promise = new Promise((resolve, reject) => {
		con.query("select chapterId from erp_subjects_chapters where chapter=? and subjectId=?", [chaptername, subjectId], (err, res) => {
			!err ? resolve(res[0].chapterId) : reject(err.message)
		})
	})
	return promise;
}

function getTopicId(topicname, chapterId) {
	const promise = new Promise((resolve, reject) => {
		con.query("select topicId from erp_topics where topic=? and chapterId=?", [topicname, chapterId], (err, result) => {

			if (err) {
				return reject(err.message);
			}

			if (result.length == 0) {

				if (topicname) {
					con.query(`insert into topics(chapterId,topic) values(?,?)`, [chapterId, topicname], (err, result) => {

						if (err) {
							return reject(err.message);
						}

						resolve(result.insertId)
					})
				} else {
					resolve(null)
				}

			} else {
				resolve(result[0].topicId)
			}
		})
	})

	return promise;
}

function getSubjectsIds() {
	const promise = new Promise((resolve, reject) => {
		con.query("select subjectId,subject,ec.course from erp_courses_subjects ecs inner join erp_courses ec on ec.courseId=ecs.courseId", (err, res) => {

			if (err) {
				return reject(err.message)
			}

			var temp = {};

			res.forEach((r) => {
				temp[r.course.trim().toLowerCase() + '-' + r.subject.trim().toLowerCase()] = r.subjectId;
			})

			resolve(temp);
		})
	})
	return promise;
}

function getQuestionTypes() {
	return new Promise((resolve, reject) => {
		con.query("select questionTypeId,name from questiontypes", (err, result) => {

			if (err) {
				return reject(err.message)
			}

			let temp = {}

			result.forEach(r => {
				temp[r.name.trim().toLowerCase()] = r.questionTypeId;
			})

			resolve(temp);
		})
	})
}

function getQuestionCategories() {
	return new Promise((resolve, reject) => {
		con.query("select questionCategoryId,questionCategory from question_categories", (err, result) => {

			if (err) {
				return reject(err.message)
			}

			let temp = {}

			result.forEach(r => {
				temp[r.questionCategory.trim().toLowerCase()] = r.questionCategoryId;
			})

			resolve(temp);
		})
	})
}

function getQuestionTaggings() {
	return new Promise((resolve, reject) => {
		con.query("select questionTaggingId,questionTagging from question_taggings", (err, result) => {

			if (err) {
				return reject(err.message)
			}

			let temp = {}

			result.forEach(r => {
				temp[r.questionTagging.trim().toLowerCase()] = r.questionTaggingId;
			})

			resolve(temp);
		})
	})
}


function getDifficulties() {
	return new Promise((resolve, reject) => {
		con.query(`select * from difficulty_level`, (err, result) => {

			if (err) {
				return reject(err.message)
			}

			let temp = {}

			result.forEach(r => {
				temp[r.name.trim().toLowerCase()] = r.difficultyLevelId
			})

			resolve(temp)
		})
	})
}

router.post("/questions", async (req, res) => {

	let questionTypes = difficulty_ids = subject_id = questionCategories = questionTaggings = null;

	try {
		questionTypes = await getQuestionTypes()
		difficulty_ids = await getDifficulties()
		subject_id = await getSubjectsIds()
		questionCategories = await getQuestionCategories()
		questionTaggings = await getQuestionTaggings()
	} catch (e) {
		return res.send(e)
	}

	let data = req.body;
	let count = data.question.length
	let questions_ids = []

	let paragraphIndex_paragraphId = {}

	// If there are paragraphs then insert them and get paragraph ids to put in questions
	if (data.paragraph) {
		await new Promise(resolve => {
			data.paragraph.forEach((p, index) => {
				con.query(`insert into paragraphs(paragraph) values(?)`, [p], (err, result) => {
					let indexes = data.paragraphQuestionNumbers[index].split("-")

					indexes.forEach(i => {
						paragraphIndex_paragraphId[i - 1] = result.insertId
					})

					resolve("done")
				})
			})
		})
	}

	let paragraphId_chapterId = {}
	let questionId_paragraphId = {}

	for (let i = 0; i < count; i++) {
		data.options[i] = data.options[i].split("-,")
		data.options[i] = data.options[i].map((val) => val.trim())
		data.difficulty[i] = data.difficulty[i].toLowerCase().trim()

		let questionPromise = new Promise(async (resolve, reject) => {

			let subjectId = null;
			let questionTypeId = null;
			let chapterId = null;
			let topicId = null;
			let questionCategoryId = null;
			let questionTaggingId = null;
			let idealTime = null;
			let difficultyLevelId = null;
			try {
				subjectId = subject_id[data.course[i].trim().toLowerCase() + '-' + data.subject[i].trim().toLowerCase()]
				questionTypeId = questionTypes[data.questiontype[i].trim().toLowerCase()]
				questionCategoryId = questionCategories[data.questionCategory[i].trim().toLowerCase()]
				questionTaggingId = questionTaggings[data.questionTagging[i].trim().toLowerCase()]
				idealTime = data.idealTime[i]
				chapterId = await getChapterId(data.chapter[i].trim(), subjectId)
				topicId = await getTopicId(data.topic[i], chapterId)
				difficultyLevelId = difficulty_ids[data.difficulty[i]]
			} catch (e) {
				return reject(e);
			}

			con.query("insert into questions(subjectId,chapterId,questionTypeId,topicId,questionCategoryId,questionTaggingId,difficultyLevelId,idealTime) values(?)",
				[[subjectId, chapterId, questionTypeId, topicId, questionCategoryId, questionTaggingId, difficultyLevelId, idealTime]], (err, result) => {

					if (err) {
						return reject(err.message)
					}

					questions_ids.push([result.insertId, 0, data.right[i], data.wrong[i]])

					if (paragraphIndex_paragraphId[i] != undefined) {
						paragraphId_chapterId[paragraphIndex_paragraphId[i]] = chapterId
						questionId_paragraphId[result.insertId] = paragraphIndex_paragraphId[i]
						questions_ids[i].push(paragraphIndex_paragraphId[i])
					}

					resolve(result.insertId)
				})
		})


		let questionId = null

		try {
			questionId = await questionPromise
		} catch (e) {
			return res.send(e)
		}

		if (data.explanation) {
			insertExplanation(data.explanation[i], questionId)
		}

		let questionTypeId = questionTypes[data.questiontype[i].trim().toLowerCase()]

		//For single,multi response,Case Study and Assertion Reason question type
		console.log("questionTypeId", questionTypeId);
		if ([1, 2, 6, 7].includes(questionTypeId)) {
			let table = "";
			let correct = [];

			if (questionTypeId == questionType.SINGLE_RESPONSE) {
				table = "single_response_questions";
				correct = "option_" + (data.correct[i].toLowerCase().trim());
			}

			if (questionTypeId == questionType.ASSERTION_REASON) {
				table = "assertion_reason_questions";
				correct = "option_" + (data.correct[i].toLowerCase().trim());
			}

			if (questionTypeId == questionType.CASE_STUDY) {
				table = "case_study_questions";
				correct = "option_" + (data.correct[i].toLowerCase().trim());
			}


			if (questionTypeId == questionType.MULTI_RESPONSE) {

				data.correct[i].split(",").forEach(c => {
					correct.push("option_" + c.toLowerCase().trim());
				});

				table = "multi_response_questions";
			}

			con.query(`insert into ${table}(questionId,question_text,option_a,option_b,option_c,option_d,option_e,option_f,` +
				`right_marks,wrong_marks,correct) values(?)`,
				[[questionId, data.question[i], data.options[i][0], data.options[i][1], data.options[i][2],
					data.options[i][3], data.options[i][4], data.options[i][5], data.right[i], data.wrong[i], correct + ""
				]],
				(err, result) => {
					if (err) {
						return res.send(err.sql);
					}
				})
			//For true false question type
		} else if (questionTypeId == questionType.TRUE_FALSE) {
			data.correct[i] = data.correct[i].toLowerCase();

			if (data.correct[i] == "true") {
				data.correct[i] = 1;
			} else if (data.correct[i] == "false") {
				data.correct[i] = 0;
			}

			con.query(`insert into true_false_questions(questionId,question_text,right_marks,wrong_marks,correct) values(?)`,
				[[questionId, data.question[i], data.right[i], data.wrong[i], data.correct[i]]],
				(err, result) => {
					if (err) {
						return res.send(err.sqlMessage);
					}
				});
			// For Integer Question Type
		} else if (questionTypeId == questionType.INTEGER) {
			data.correct[i] = data.correct[i].toLowerCase();
			con.query(`insert into integer_questions(questionId,question_text,right_marks,wrong_marks,correct) values(?)`,
				[[questionId, data.question[i], data.right[i], data.wrong[i], data.correct[i]]],
				(err, result) => {
					if (err) {
						return res.send(err.sqlMessage);
					}
				});
		}
	}

	// set ChapterId of Paragraphs
	for (let [paragraphId, chapterId] of Object.entries(paragraphId_chapterId)) {
		con.query(`update paragraphs set chapterId=${chapterId} where paragraphId=${paragraphId}`, (err, result) => {
			if (err) {
				console.log(err)
			}
		})
	}

	// Map paragraphIds and QuestionIds
	mapParagraphIdQuestionId(questionId_paragraphId)

	// Create Test If Test Create is Choosed
	if (data.createTest == "true") {

		let testId = await new Promise((resolveTest) => {

			let date = new Date();
			let ISOFormat = new Date(date + " UTC").toISOString().slice(0, 19).replace("T", " ")

			let testTableData = [
				data.testname,
				16,
				7,
				data.duration,
				3,
				data.totalquestions,
				data.testmarks,
				1,
				0,
				0,
				ISOFormat,
				ISOFormat,
				0,
				JSON.stringify(questions_ids),
				data.sessionId
			];

			con.query("insert into test (name,category_id,instruction_id,duration,difficulty_id,total_questions,total_marks,test_type_id,quiz_pool,publish,publish_start_datetime,publish_end_datetime,generate_certificate,questions,sessionId) values(?)", [testTableData], (err, result) => {

				if (err) {
					res.send(err.sqlMessage);
				}

				resolveTest(result.insertId);
			})
		})


		let test_settings = [
			testId,
			0,
			0,
			0,
			0,
			1,
			1,
			1,
			1,
			1,
			1,
			"mm:ss",
			0,
			'[{"id":2,"minutes":0},{"id":1,"minutes":0}]',
			0,
			1,
			"Pass",
			"Fail",
			"DOne",
			1,
			33,
			1,
			1,
			1,
			1,
			0,
			0,
			1
		]
		// Insert Test Settings
		con.query("insert into test_settings( test_id, shuffle_questions, group_questions, optionwise_shuffling, all_questions_mandatory, allow_move, show_marks, partial_marking, show_calculator, bonus_marking, time_bound, clock_format, sectionwise_time, section_wise_times, questionwise_time, end_test_show_message, pass_feedback, fail_feedback, submit_message, show_percentage, passage_percentage, generate_rank, allow_duplicate_rank, skip_rank_after_duplicate, priority_to_finish_time, show_reports, full_screen, attempts_count) values(?)", [test_settings], (err, result) => {

			if (err) {
				return res.send(err.sqlMessage);
			}

			res.send("success");
		})
	} else {
		res.send("success");
	}
});

function mapParagraphIdQuestionId(questionId_paragraphId) {
	let sql = "insert into paragraphId_questionId (paragraphId,questionId) values ";

	for (let [questionId, paragraphId] of Object.entries(questionId_paragraphId)) {
		sql += `(${paragraphId},${questionId}),`
	}

	if (Object.keys(questionId_paragraphId).length == 0) {
		return
	}

	sql = sql.slice(0, sql.length - 1)

	con.query(sql, (err, result) => {
		if (err) {
			console.log(err)
		}
	})

}

router.post("/upload-images", (req, res) => {
	let sampleFile = req.files.myfile;
	// Use the mv() method to place the file somewhere on your server
	sampleFile.mv("../public_html/test/sample_files/" + sampleFile.name, function (err) {
		if (err)
			return res.status(500).send(err + " Here");
		res.send('File uploaded!');
	});
})



//export this router to use in our index.js
module.exports = router;