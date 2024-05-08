const e = require('express');
const express = require('express');
const router = express.Router();
const con = require("../db");
const utility = require("./tagger-function")

// Get Marked Count
router.get("/dashboard-count", async (req, res) => {
  const userId = res.locals.userId

  const markedCount = await new Promise((resolve) => {
    con.query(`select count(questionId) markedCount from questions where markedBy=?`, [userId], (err, result) => {
      resolve(result[0].markedCount);
    })
  })

  const reportedCount = await new Promise((resolve) => {
    con.query(`select count(questionId) reportedCount from questions where reportedBy=?`, [userId], (err, result) => {
      resolve(result[0].reportedCount);
    })
  })

  res.send({ markedCount, reportedCount })
})

function getChaptersBySubjectId(subjectId) {
  return new Promise((resolve) => {
    con.query(`select * from (SELECT esc.chapterId,esc.chapter,(select count(questionId) from questions where chapterId=esc.chapterId and markedBy is null and report is null GROUP by chapterId) questionsCount FROM erp_subjects_chapters esc where esc.subjectId=?) ss where ss.questionsCount is not null `, [subjectId], (err, result) => {
      resolve(result)
    })
  })
}

// get SUbjects and chapters
router.get("/subjects-chapters", (req, res) => {
  const userId = res.locals.userId
  con.query(`SELECT ecs.subjectId,ecs.subject,ec.course FROM erp_users_subjects eus inner join erp_courses_subjects ecs on ecs.subjectId=eus.subjectId inner join erp_courses ec on ec.courseId=eus.courseId where eus.userId=?`, [userId], async (err, result) => {
    if (err) {
      return res.status(500).end(err.sqlMessage)
    }

    for (let i = 0; i < result.length; i++) {
      result[i].chapters = await getChaptersBySubjectId(result[i].subjectId)
    }

    res.send(result)
  })
})

// Get Questions by chapterId
router.get("/chapters/:chapterId/questions", async (req, res) => {
  const chapterId = req.params.chapterId
  const result = [].concat(...await utility.getQuestions(chapterId, null, 'questions'))
  res.send(result)
})

// Get Topics By ChapterId
router.get("/chapters/:chapterId/topics", (req, res) => {
  const chapterId = req.params.chapterId
  con.query(`select topicId,topic from erp_topics where chapterId=? `, [chapterId], (err, result) => {
    res.send(result)
  })
})

// Mark Question
router.put("/mark-question", (req, res) => {
  let data = req.body

  let updateData = [
    data.questionTaggingId,
    data.topicId,
    res.locals.userId,
    data.difficultyLevelId,
    data.questionId
  ]

  con.query(`update questions set questionTaggingId=?,topicId=?,markedBy=?,difficultyLevelId=? where questionId=? `, updateData)
  res.send({ success: true, message: 'Question marked successfully' })
})

// Get Marked Questions By ChapterId
router.get("/chapters/:chapterId/marked-questions", async (req, res) => {
  const userId = res.locals.userId
  const chapterId = req.params.chapterId
  let result = [].concat(...await utility.getQuestions(chapterId, userId, 'marked'))
  res.send(result)
})

// Get Tagger Issues Reported
router.get("/reported-issues", (req, res) => {
  con.query(`select q.questionId,json_unquote(json_extract(report,'$.remarks')) remarks,qrt.type,eu.name from questions q inner join questions_reported_types qrt on qrt.id=json_extract(report,'$.type') inner join erp_users eu on eu.userId=q.reportedBy`, (err, result) => {
      res.send(result)
  })
})

// Get Reported Questions By ChapterId
router.get("/chapters/:chapterId/reported-questions", async (req, res) => {
  const userId = res.locals.userId
  const chapterId = req.params.chapterId
  let result = [].concat(...await utility.getQuestions(chapterId, userId, 'reported'))
  res.send(result)
})

function getMarkedChaptersBySubjectId(userId, subjectId) {

  return new Promise((resolve) => {
    con.query(`select * from (SELECT esc.chapterId,esc.chapter,(select count(questionId) from questions where chapterId=esc.chapterId and markedBy=?  GROUP by chapterId) questionsCount FROM erp_subjects_chapters esc where esc.subjectId=?) s where s.questionsCount is not null `, [userId, subjectId], (err, result) => {
      resolve(result)
    })
  })
}

// get Subjects and chapters marked
router.get("/subjects-chapters-marked", (req, res) => {
  const userId = res.locals.userId
  con.query(`SELECT ecs.subjectId,ecs.subject,ec.course FROM erp_users_subjects eus inner join erp_courses_subjects ecs on ecs.subjectId=eus.subjectId inner join erp_courses ec on ec.courseId=eus.courseId where eus.userId=?`, [userId], async (err, result) => {
    if (err) {
      return res.status(500).end(err.sqlMessage)
    }

    for (let i = 0; i < result.length; i++) {
      result[i].chapters = await getMarkedChaptersBySubjectId(userId, result[i].subjectId)
    }

    res.send(result)
  })
})

function getReportedChaptersBySubjectId(userId, subjectId) {

  return new Promise((resolve) => {
    con.query(`select * from (SELECT esc.chapterId,esc.chapter,(select count(questionId) from questions where chapterId=esc.chapterId and reportedBy=?  GROUP by chapterId) questionsCount FROM erp_subjects_chapters esc where esc.subjectId=?) s where s.questionsCount is not null `, [userId, subjectId], (err, result) => {
      resolve(result)
    })
  })
}

// get Subjects and chapters Reported
router.get("/subjects-chapters-reported", (req, res) => {
  const userId = res.locals.userId
  con.query(`SELECT ecs.subjectId,ecs.subject,ec.course FROM erp_users_subjects eus inner join erp_courses_subjects ecs on ecs.subjectId=eus.subjectId inner join erp_courses ec on ec.courseId=eus.courseId where eus.userId=?`, [userId], async (err, result) => {
    if (err) {
      return res.status(500).end(err.sqlMessage)
    }

    for (let i = 0; i < result.length; i++) {
      result[i].chapters = await getReportedChaptersBySubjectId(userId, result[i].subjectId)
    }

    res.send(result)
  })
})

// Report Question
router.put("/questions/report-question", (req, res) => {
  const data = req.body
  const updateData = [
    JSON.stringify({ type: data.type, remarks: data.remarks }),
    res.locals.userId,
    data.questionId,
  ]
  con.query(`update questions set report=?,reportedBy=? where questionId=?`, updateData, (err, result) => {
    if (err) {
      return res.status(500).end(err.sqlMessage)
    }
    res.send({ success: result.changedRows > 0 })
  })
})

module.exports = router