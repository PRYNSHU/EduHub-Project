const express = require("express")
const { reset } = require("nodemon")
const router = express.Router()
const con = require("../db")

/*Get Test Settings */
function getSettings(testId) {
    let settingsPromise = new Promise((resolve) => {
        con.query(`select * from test_settings where test_id=?`, [testId], (err, result) => {
            resolve(result[0])
        })
    })
    return settingsPromise
}

/*Get TestById */
function getTestById(testId) {
    return new Promise((resolve) => {
        con.query(`select * from test where id=?`, [testId], (err, result) => {
            resolve(result[0])
        })
    })
}



/*Get Topper's Score Subject Wise */
async function getTopperScore(testId, attemptNo, subject) {
    let allSubjectsPromise = new Promise(async (resolve) => {
        con.query(`select subject_wise_data from done_tests where test_id=? and attempt_no = ?`, [testId, attemptNo], async (err, result) => {
            let data = result
            let scoreArray = []
            let timeArray = []
            data.forEach(d => {
                let swd = JSON.parse(d.subject_wise_data)
                let sub = swd.find(s => s.subject == subject)
                scoreArray.push(parseFloat(sub.scored_marks).toFixed(2))
                timeArray.push(sub.time_spend)
            })
            let score = parseFloat(Math.max(...scoreArray)).toFixed(2)
            let timeSpend = timeArray[scoreArray.indexOf(score)]
            resolve({
                score: score,
                timeSpend: timeSpend
            })
        })
    })
    return allSubjectsPromise
}

/*Get Topper's Score Question Wise */
async function getQuestionWiseTopperScore(testId, attemptNo) {
    let allQuestionsPromise = new Promise(async (resolve) => {
        let topperId
        let data
        let promise = new Promise((resolve) => {
            con.query(`select user_id,question_wise_data,marks_obtained from done_tests where test_id=? and attempt_no = ? order by marks_obtained desc limit 1`, [testId, attemptNo], async (err, result) => {
                resolve(result)
            })
        })

        await promise.then(dat => {
            topperId = dat[0].user_id
            data = JSON.parse(dat[0].question_wise_data)
        })

        let topperData = []
        data.forEach((d, i) => {
            topperData.push({
                qid: d.id,
                scored_marks: d.scored_marks,
                time_spend: d.time_spend
            })
        })
        resolve({
            topperData: topperData
        })
    })

    return allQuestionsPromise
}

/* Get User's Correct Percentage */
async function getUserCorrectPercentage(testId, attemptNo, qids) {
    return new Promise((resolve) => {
        con.query(`select question_wise_data from done_tests where test_id=? and attempt_no=?`, [testId, attemptNo], (err, result) => {

            let qid_correct = {}
            qids.forEach(qid => {
                let correct = 0

                for (let i = 0; i < result.length; i++) {
                    let qwd = JSON.parse(result[i].question_wise_data)
                    for (let j = 0; j < qwd.length; j++) {
                        if (qwd[j].id == qid && qwd[j].status == "C") {
                            correct++
                            break
                        }
                    }
                }

                qid_correct[qid] = parseFloat((correct / result.length) * 100).toFixed(2)
            })

            resolve(qid_correct)
        })
    })
}

/*Get Your Compare Data */
function getYourCompareData(userId, testId, attemptNo) {
    return new Promise(async (resolve) => {
        con.query(`select (t.duration*60)as duration,t.total_questions,dt.marks_obtained,dt.time_spend,dt.correct_questions,dt.wrong_questions,dt.total_marks from done_tests dt inner join test t on t.id = dt.test_id where dt.user_id=? and dt.test_id=? and dt.attempt_no = ?`, [userId, testId, attemptNo], async (err, result) => {
            let data = result[0]
            resolve({
                marks_obtained: data.marks_obtained,
                score: parseFloat((data.marks_obtained / data.total_marks) * 100).toFixed(2),
                attempted_questions: data.correct_questions + data.wrong_questions,
                attempted_percentage: parseFloat(((data.correct_questions + data.wrong_questions) / data.total_questions) * 100).toFixed(2),
                accuracy: parseFloat(((data.correct_questions) / ((data.correct_questions) + (data.wrong_questions))) * 100).toFixed(2),
                time_spend_percentage: parseFloat((data.time_spend / data.duration) * 100).toFixed(2),
                time_spend: data.time_spend
            })
        })
    })
}

/*Get Compare data of top 10 Students */
function getTop10CompareData(userId, testId, attemptNo) {
    return new Promise(async (resolve) => {
        con.query(`select (t.duration*60) as duration,t.total_questions, es.name,dt.marks_obtained,dt.time_spend,dt.correct_questions,dt.wrong_questions,dt.total_marks from done_tests dt inner join erp_students es on es.studentId=dt.user_id inner join test t on t.id=dt.test_id where dt.user_id!=? and dt.test_id=? and dt.attempt_no = ? order by marks_obtained desc limit 10 `, [userId, testId, attemptNo], async (err, result) => {
            let data = result
            let compareData = []
            data.forEach(d => {
                compareData.push({
                    name: d.name,
                    marks_obtained: d.marks_obtained,
                    score: parseFloat((d.marks_obtained / d.total_marks) * 100).toFixed(2),
                    attempted_questions: d.correct_questions + d.wrong_questions,
                    attempted_percentage: parseFloat(((d.correct_questions + d.wrong_questions) / d.total_questions) * 100).toFixed(2),
                    accuracy: parseFloat(((d.correct_questions) / ((d.correct_questions) + (d.wrong_questions))) * 100).toFixed(2),
                    time_spend: d.time_spend,
                    time_spend_percentage: parseFloat((d.time_spend / d.duration) * 100).toFixed(2),
                })
            })
            resolve(compareData)
        })
    })
}

/* For Get Reports Page Fixed Test Information  */
router.get("/test-details/:testId(\\d+)/:attempt_no(\\d+)", async (req, res) => {
    let userId = res.locals.userId
    let testId = req.params.testId
    let attemptNo = req.params.attempt_no

    let testDetailsPromise = new Promise((resolve) => {
        con.query(`select count(dt.id) as total_candidates,t.name,t.total_questions,t.total_marks,t.duration from done_tests dt left join test t on t.id=dt.test_id where dt.test_id=? and dt.attempt_no=? `, [testId, attemptNo], (err, result) => {
            if (err) {
                res.status(500).end(err.sqlMessage)
            }
            resolve(result[0])
        })
    })

    let TestDetails = await testDetailsPromise
    res.send(TestDetails)

})

async function getRank(userId, testId, attemptNo, marks, settings, type, subject = "") {
    let RankSQL = ""
    if (settings.allow_duplicate_rank == 1) {
        if (settings.skip_rank_after_duplicate == 1) {
            RankSQL = "select marks_obtained,subject_wise_data,user_id from done_tests where test_id=? and attempt_no=? order by marks_obtained desc"
        } else {
            RankSQL = "select marks_obtained,subject_wise_data,user_id from done_tests where test_id=? and attempt_no=? group by marks_obtained  order by marks_obtained desc"
        }
    } else {
        if (settings.priority_to_finish_time == 1) {
            RankSQL = "select marks_obtained,subject_wise_data,user_id from done_tests where test_id=? and attempt_no=? order by marks_obtained desc,time_spend asc "
        } else {
            RankSQL = "select marks_obtained,subject_wise_data,user_id from done_tests where test_id=? and attempt_no=? order by marks_obtained desc"
        }
    }

    let RankPromise = new Promise((resolve) => {
        con.query(RankSQL, [testId, attemptNo], (err, result) => {
            if (type == "subject") {

                result.sort(function (a, b) {
                    let bb = JSON.parse(b.subject_wise_data).find(swd => swd.subject == subject)
                    let aa = JSON.parse(a.subject_wise_data).find(swd => swd.subject == subject)
                    return bb.scored_marks - aa.scored_marks
                })

                if (settings.priority_to_finish_time == 1) {
                    result.sort(function (a, b) {
                        let bb = JSON.parse(b.subject_wise_data).find(swd => swd.subject == subject)
                        let aa = JSON.parse(a.subject_wise_data).find(swd => swd.subject == subject)
                        return bb.scored_marks - aa.scored_marks || aa.time_spend - bb.time_spend
                    })
                }
            }
            resolve(result)
        })
    })

    let RankArray
    await RankPromise.then(data => RankArray = data)

    let myRank = 0

    RankArray.forEach((r, index) => {
        if (type == "overall") {
            if (settings.allow_duplicate_rank == 1) {
                if (r.marks_obtained == marks && myRank == 0) {
                    myRank = index + 1
                }
            } else {
                if (r.marks_obtained == marks && r.user_id == userId && myRank == 0) {
                    myRank = index + 1
                }
            }
        } else {
            let subs = JSON.parse(r.subject_wise_data)
            let sub = subs.find(s => s.subject == subject)
            if (subject == sub.subject) {
                if (settings.allow_duplicate_rank == 1) {
                    if (sub.scored_marks == marks && myRank == 0) {
                        myRank = index + 1
                    }
                } else {
                    if (sub.scored_marks == marks && r.user_id == userId && myRank == 0) {
                        myRank = index + 1
                    }
                }
            }
        }
    })

    return myRank
}

/* Get Score Card */
router.get("/score-card/:testId(\\d+)/:attempt_no(\\d+)", async (req, res) => {
    let userId = res.locals.userId
    let testId = req.params.testId
    let attemptNo = req.params.attempt_no
    let totalCandidates
    let settings = await getSettings(testId)
    let test = await getTestById(testId)

    await new Promise((resolve) => {
        con.query(`select count(id) as total_candidates from done_tests where test_id=? and attempt_no=? `, [testId, attemptNo], (err, result) => {
            if (err) {
                res.status(500).end(err.sqlMessage)
            }
            resolve(result[0].total_candidates)
        })
    }).then(data => totalCandidates = data)

    con.query(`select * from done_tests where user_id=? and test_id=? and attempt_no = ? `, [userId, testId, attemptNo], async (err, result) => {
        if (err) {
            res.status(500).end(err.sqlMessage)
        }
        let skippedQuestionMarks = 0

        JSON.parse(result[0].test_data).forEach(td => {
            if (td[1] == "S") {
                skippedQuestionMarks += td[2]
            }
        })

        let subject_wise_data = JSON.parse(result[0].subject_wise_data)
        subject_wise_data.forEach(async (swd) => {
            swd.rank = await getRank(userId, testId, attemptNo, swd.scored_marks, settings, "subject", swd.subject)
            swd.percentile = parseFloat(((totalCandidates + 1) - swd["rank"]) / (totalCandidates) * 100).toFixed(2)
        })

        let myMarks = result[0].marks_obtained
        let myRank = await getRank(userId, testId, attemptNo, myMarks, settings, "overall")
        let percentile = parseFloat(((totalCandidates + 1) - myRank) / (totalCandidates) * 100).toFixed(2)
        let data = {
            leftQuestionsMarks: skippedQuestionMarks,
            rightMarks: result[0].correct_marks,
            wrongMarks: result[0].wrong_marks,
            marks: result[0].marks_obtained,
            correctQuestions: result[0].correct_questions,
            wrongQuestions: result[0].wrong_questions,
            skippedQuestions: result[0].skipped,
            myRank: myRank,
            subjectSwaps: result[0].subjectSwaps,
            percentile: percentile,
            questions_attempted: parseInt(result[0].correct_questions) + parseInt(result[0].wrong_questions),
            time_spend: result[0].time_spend,
            totalTime: test.duration * 60,
            totalMarks: test.total_marks,
            subject_wise_data: subject_wise_data
        }
        res.send(data)
    })
})

/* Get Subject Report */
router.get("/subject-report/:testId(\\d+)/:attempt_no(\\d+)", async (req, res) => {
    let userId = res.locals.userId
    let testId = req.params.testId
    let attemptNo = req.params.attempt_no
    con.query(`select subject_wise_data,subject_wise_data_last,subject_last_time,chapter_wise_data from done_tests where user_id=? and test_id=? and attempt_no = ?`, [userId, testId, attemptNo], async (err, result) => {
        let data = JSON.parse(result[0].subject_wise_data)
        let settings
        await getSettings(testId).then(data => settings = data)
        data.forEach(async (swd, index) => {
            swd["rank"] = await getRank(userId, testId, attemptNo, swd.scored_marks, settings, "subject", swd.subject)
            await getTopperScore(testId, attemptNo, swd.subject).then((data) => {
                swd["topper_score"] = data.score
                swd["topper_time_spend"] = data.timeSpend
            })

            if (index == data.length - 1) {
                res.send({
                    subject_wise_data: data,
                    chapter_wise_data: JSON.parse(result[0].chapter_wise_data),
                    subject_wise_data_last: JSON.parse(result[0].subject_wise_data_last),
                    subject_last_time: JSON.parse(result[0].subject_last_time)
                })
            }
        })
    })
})

/*Get Questions Report */
router.get("/questions-report/:testId(\\d+)/:attempt_no(\\d+)", async (req, res) => {
    let userId = res.locals.userId
    let testId = req.params.testId
    let attemptNo = req.params.attempt_no

    let question_ids = []
    let qid_qtypeid = {}

    let testPromise = new Promise((resolve) => {
        con.query(`select questions from test where id = ? `, [testId], (err, result) => {
            resolve(JSON.parse(result[0].questions))
        })
    })

    let testQuestions = await testPromise

    con.query(`select question_wise_data from done_tests where user_id=? and test_id=? and attempt_no = ?`, [userId, testId, attemptNo], async (err, result) => {
        let data = JSON.parse(result[0].question_wise_data)
        let topperData
        await getQuestionWiseTopperScore(testId, attemptNo).then(data => {
            topperData = data.topperData
        })

        data.forEach(d => {
            question_ids.push(d.id)
        })

        let qid_corrects = await getUserCorrectPercentage(testId, attemptNo, question_ids)

        let promise = new Promise((resolve) => {
            con.query(`select questionId,questionTypeId,subjectId from questions where questionId in (${question_ids})`, (err, result) => {
                result.forEach(r => {
                    qid_qtypeid[r.questionId] = r.questionTypeId
                    let qwd = data.find(d => d.id == r.questionId)
                    qwd["subjectId"] = r.subjectId
                })
                resolve("OK")
            })
        })

        await promise.then(data => { })

        result = []

        testQuestions.forEach(function (key) {
            var found = false
            data = data.filter(function (item) {
                if (!found && item.id == key[0]) {
                    result.push(item)
                    found = true
                    return false
                } else
                    return true
            })
        })

        data = result

        data.forEach(async (qwd, index) => {
            let topperQuestionData = topperData.find(d => d.qid == qwd.id)
            let testQuestion = testQuestions.find(tq => tq[0] == qwd.id)
            qwd["topper_score"] = topperQuestionData.scored_marks
            qwd["topper_time_spend"] = topperQuestionData.time_spend
            qwd["user_correct_attempts"] = qid_corrects[qwd.id]
            qwd["questionTypeId"] = qid_qtypeid[qwd.id]
            qwd["bonus"] = testQuestion[1]
            if (index == data.length - 1) {
                res.send(data)
            }
        })
    })
})

/*Get Solution Report */
router.get("/solution-report/:testId(\\d+)/:attempt_no(\\d+)", async (req, res) => {
    let userId = res.locals.userId
    let testId = req.params.testId
    let attemptNo = req.params.attempt_no

    let testQuestions = await new Promise((resolve) => {
        con.query(`select questions from test where id = ? `, [testId], (err, result) => {
            resolve(JSON.parse(result[0].questions))
        })
    })

    let explanations = await new Promise((resolve) => {
        let question_ids = []
        testQuestions.forEach(tq => question_ids.push(tq[0]))
        con.query('select questionId,content from explanation where questionId in (?)', [question_ids], (err, result) => {
            let questionId_Explanations = {}
            result.forEach(r => {
                questionId_Explanations[r.questionId] = r.content
            })
            resolve(questionId_Explanations)
        })
    })

    let paragraphs = await new Promise(resolve => {
        con.query(`SELECT p.paragraphId,p.paragraph,pq.questionId from paragraphs p inner join paragraphId_questionId pq on p.paragraphId=pq.paragraphId`, (err, result) => {
            resolve(result)
        })
    })

    con.query(`select question_wise_data from done_tests where user_id=? and test_id=? and attempt_no = ?`, [userId, testId, attemptNo], async (err, result) => {
        let question_ids = []
        let data = JSON.parse(result[0].question_wise_data)

        testQuestions.forEach(tq => question_ids.push(tq[0]))

        let solutionQuestionsData = await getQuestionsDataForSolutionReport(question_ids, res)

        solutionQuestionsData.forEach(sqd => {
            let question_wise_data = data.find(d => d.id == sqd.questionId)
            let testData = testQuestions.find(tq => tq[0] == sqd.questionId)
            let paragraph = paragraphs.find(p => p.questionId == sqd.questionId)

            if (paragraph) {
                sqd.paragraph = paragraph.paragraph
            }

            sqd.correct = isNaN(question_wise_data.correct) ? question_wise_data.correct : parseFloat(question_wise_data.correct)
            sqd.answer = isNaN(question_wise_data.your_answer) ? question_wise_data.your_answer : parseFloat(question_wise_data.your_answer)
            sqd.explanation = explanations[sqd.questionId]
            sqd.bonus = testData[1]
        })

        res.send(solutionQuestionsData)
    })
})

/*Get Compare Report */
router.get("/compare-report/:testId(\\d+)/:attempt_no(\\d+)", async (req, res) => {
    let userId = res.locals.userId
    let testId = req.params.testId
    let attemptNo = req.params.attempt_no
    let top10Data
    let yourData
    await getTop10CompareData(userId, testId, attemptNo).then(data => top10Data = data)
    await getYourCompareData(userId, testId, attemptNo).then(data => yourData = data)
    res.send({
        your: yourData,
        top10Data: top10Data
    })
})

/**Test Wise Report */
router.get("/test-wise-reports/:testId/:attemptNo", (req, res) => {
    con.query(`select st.studentId,st.name as Name,st.phone as 'Student Mobile',dt.marks_obtained as Marks,dt.skipped as Skipped,dt.correct_questions as Correct,dt.wrong_questions as Wrong,dt.subject_wise_data from done_tests dt inner join erp_students st on st.studentId=dt.user_id where dt.test_id=? and dt.attempt_no=? order by dt.marks_obtained desc`, [req.params.testId, req.params.attemptNo],
        (err, result) => {
            if (err){
               return res.status(500).end(err.sqlMessage)
            }
            result.forEach(r => r.subject_wise_data = JSON.parse(r.subject_wise_data))
            result.forEach(r => {
                r.subject_wise_data.forEach(s => {
                    r[s.subject + "-marks"] = s.scored_marks
                    r[s.subject + "-correct"] = s.correct_questions
                    r[s.subject + "-wrong"] = s.wrong_questions
                    r[s.subject + "-skipped"] = s.skipped_questions
                })
            })
            res.send(result)
        })
})

/* Get Marks Distribution of all */
router.get("/marks-distribution-all/:testId/:attemptNo", (req, res) => {
    const userId = res.locals.userId
    const testId = req.params.testId
    const attemptNo = req.params.attemptNo

    con.query(`select avg(marks_obtained) avgMarks,min(marks_obtained) lowestMarks,max(marks_obtained) highestMarks from done_tests where test_id=? and attempt_no=? `, [testId, attemptNo], (err, result1) => {

        if (err) {
            return res.status(500).end(err.message)
        }

        con.query(`select marks_obtained,total_marks from done_tests where user_id=? and test_id=? and attempt_no=? `, [userId, testId, attemptNo], (err, result) => {
            if (err) {
                return res.status(500).end(err.message)
            }
            res.send({
                totalMarks: result[0].total_marks,
                yourMarks: result[0].marks_obtained,
                avgMarks: result1[0].avgMarks,
                lowestMarks: result1[0].lowestMarks,
                highestMarks: result1[0].highestMarks
            })
        })
    })
})

/* Get Performance Analysys */
router.get("/performance-analysis/:testId/:attemptNo", async (req, res) => {
    const userId = res.locals.userId
    const testId = req.params.testId
    const attemptNo = req.params.attemptNo

    const questionWiseData = await new Promise((resolve) => {
        con.query(`select question_wise_data from done_tests where user_id=? and test_id=? and attempt_no=?`, [userId, testId, attemptNo], (err, result) => {
            resolve(JSON.parse(result[0].question_wise_data))
        })
    })

    const EASY = 1
    const MEDIUM = 2
    const HARD = 3

    const totalEasyQuestions = questionWiseData.filter(q => q.difficultyLevelId == EASY).length
    const totalMediumQuestions = questionWiseData.filter(q => q.difficultyLevelId == MEDIUM).length
    const totalHardQuestions = questionWiseData.filter(q => q.difficultyLevelId == HARD).length

    const totalEasyCorrectQuestions = questionWiseData.filter(q => q.difficultyLevelId == EASY && q.status == 'C').length
    const totalEasyWrongQuestions = questionWiseData.filter(q => q.difficultyLevelId == EASY && q.status == 'W').length
    const totalEasyUnAnsweredQuestions = questionWiseData.filter(q => q.difficultyLevelId == EASY && q.status == 'S').length

    const totalMediumCorrectQuestions = questionWiseData.filter(q => q.difficultyLevelId == MEDIUM && q.status == 'C').length
    const totalMediumWrongQuestions = questionWiseData.filter(q => q.difficultyLevelId == MEDIUM && q.status == 'W').length
    const totalMediumUnAnsweredQuestions = questionWiseData.filter(q => q.difficultyLevelId == MEDIUM && q.status == 'S').length

    const totalHardCorrectQuestions = questionWiseData.filter(q => q.difficultyLevelId == HARD && q.status == 'C').length
    const totalHardWrongQuestions = questionWiseData.filter(q => q.difficultyLevelId == HARD && q.status == 'W').length
    const totalHardUnAnsweredQuestions = questionWiseData.filter(q => q.difficultyLevelId == HARD && q.status == 'S').length

    const easyCorrectPercentage = +((totalEasyCorrectQuestions / totalEasyQuestions) * 100).toFixed(2)
    const easyWrongPercentage = +((totalEasyWrongQuestions / totalEasyQuestions) * 100).toFixed(2)
    const easyUnAnsweredPercentage = +((totalEasyUnAnsweredQuestions / totalEasyQuestions) * 100).toFixed(2)

    const mediumCorrectPercentage = +((totalMediumCorrectQuestions / totalMediumQuestions) * 100).toFixed(2)
    const mediumWrongPercentage = +((totalMediumWrongQuestions / totalMediumQuestions) * 100).toFixed(2)
    const mediumUnAnsweredPercentage = +((totalMediumUnAnsweredQuestions / totalMediumQuestions) * 100).toFixed(2)

    const hardCorrectPercentage = +((totalHardCorrectQuestions / totalHardQuestions) * 100).toFixed(2)
    const hardWrongPercentage = +((totalHardWrongQuestions / totalHardQuestions) * 100).toFixed(2)
    const hardUnAnsweredPercentage = +((totalHardUnAnsweredQuestions / totalHardQuestions) * 100).toFixed(2)

    res.send({
        easyCorrectPercentage,
        easyWrongPercentage,
        easyUnAnsweredPercentage,
        mediumCorrectPercentage,
        mediumWrongPercentage,
        mediumUnAnsweredPercentage,
        hardCorrectPercentage,
        hardWrongPercentage,
        hardUnAnsweredPercentage
    })
})

// Get Skills Strenth
router.get("/skills-strength/:testId/:attemptNo", async (req, res) => {
    const userId = res.locals.userId
    const testId = req.params.testId
    const attemptNo = req.params.attemptNo
    const questionWiseData = await new Promise((resolve) => {
        con.query(`select question_wise_data from done_tests where user_id=? and test_id=? and attempt_no=?`, [userId, testId, attemptNo], (err, result) => {
            resolve(JSON.parse(result[0].question_wise_data))
        })
    })

    const MEMORY = 1
    const CONCEPTUAL = 2
    const APPLICATION = 3

    const totalMemoryQuestions = questionWiseData.filter(q => q.questionTaggingId == MEMORY).length
    const totalConceptualQuestions = questionWiseData.filter(q => q.questionTaggingId == CONCEPTUAL).length
    const totalApplicationQuestions = questionWiseData.filter(q => q.questionTaggingId == APPLICATION).length

    const totalMemoryCorrectQuestions = questionWiseData.filter(q => q.questionTaggingId == MEMORY && q.status == 'C').length
    const totalConceptualCorrectQuestions = questionWiseData.filter(q => q.questionTaggingId == CONCEPTUAL && q.status == 'C').length
    const totalApplicationCorrectQuestions = questionWiseData.filter(q => q.questionTaggingId == APPLICATION && q.status == 'C').length

    const memoryPercentage = +((totalMemoryCorrectQuestions / totalMemoryQuestions) * 100).toFixed(2)
    const conceptualPercentage = +((totalConceptualCorrectQuestions / totalConceptualQuestions) * 100).toFixed(2)
    const applicationPercentage = +((totalApplicationCorrectQuestions / totalApplicationQuestions) * 100).toFixed(2)

    res.send({ memoryPercentage, conceptualPercentage, applicationPercentage })
})


/* Accuracy Based On Difficulty Level */
router.get("/accuracy-based-on-difficulty-levels/:testId/:attemptNo", async (req, res) => {
    const userId = res.locals.userId
    const testId = req.params.testId
    const attemptNo = req.params.attemptNo

    const data = await new Promise((resolve) => {
        con.query(`select question_wise_data,user_id from done_tests where test_id=? and attempt_no=?`, [testId, attemptNo], (err, result) => {
            resolve(result)
        })
    })

    const EASY = 1
    const MEDIUM = 2
    const HARD = 3

    const myData = data.find(d => d.user_id == userId);
    const myQuestionWiseData = JSON.parse(myData.question_wise_data)

    const totalEasyCorrectQuestions = myQuestionWiseData.filter(q => q.difficultyLevelId == EASY && q.status == 'C').length
    const totalEasyWrongQuestions = myQuestionWiseData.filter(q => q.difficultyLevelId == EASY && q.status == 'W').length

    const totalMediumCorrectQuestions = myQuestionWiseData.filter(q => q.difficultyLevelId == MEDIUM && q.status == 'C').length
    const totalMediumWrongQuestions = myQuestionWiseData.filter(q => q.difficultyLevelId == MEDIUM && q.status == 'W').length

    const totalHardCorrectQuestions = myQuestionWiseData.filter(q => q.difficultyLevelId == HARD && q.status == 'C').length
    const totalHardWrongQuestions = myQuestionWiseData.filter(q => q.difficultyLevelId == HARD && q.status == 'W').length

    const myEasyAccuracy = parseFloat("" + (totalEasyCorrectQuestions / (totalEasyCorrectQuestions +
        totalEasyWrongQuestions)) * 100).toFixed(2)

    const myMediumAccuracy = parseFloat("" + (totalMediumCorrectQuestions / (totalMediumCorrectQuestions +
        totalMediumWrongQuestions)) * 100).toFixed(2)

    const myHardAccuracy = parseFloat("" + (totalHardCorrectQuestions / (totalHardCorrectQuestions +
        totalHardWrongQuestions)) * 100).toFixed(2)


    let overallTotalEasyCorrectQuestions = 0
    let overallTotalEasyWrongQuestions = 0

    let overallTotalMediumCorrectQuestions = 0
    let overallTotalMediumWrongQuestions = 0

    let overallTotalHardCorrectQuestions = 0
    let overallTotalHardWrongQuestions = 0

    data.forEach(d => {
        const questionWiseData = JSON.parse(d.question_wise_data)

        overallTotalEasyCorrectQuestions += questionWiseData.filter(q => q.difficultyLevelId == EASY && q.status == 'C').length
        overallTotalEasyWrongQuestions += questionWiseData.filter(q => q.difficultyLevelId == EASY && q.status == 'W').length

        overallTotalMediumCorrectQuestions += questionWiseData.filter(q => q.difficultyLevelId == MEDIUM && q.status == 'C').length
        overallTotalMediumWrongQuestions += questionWiseData.filter(q => q.difficultyLevelId == MEDIUM && q.status == 'W').length

        overallTotalHardCorrectQuestions += questionWiseData.filter(q => q.difficultyLevelId == HARD && q.status == 'C').length
        overallTotalHardWrongQuestions += questionWiseData.filter(q => q.difficultyLevelId == HARD && q.status == 'W').length
    })

    const overallEasyAccuracy = parseFloat("" + (overallTotalEasyCorrectQuestions / (overallTotalEasyCorrectQuestions +
        overallTotalEasyWrongQuestions)) * 100).toFixed(2)

    const overallMediumAccuracy = parseFloat("" + (overallTotalMediumCorrectQuestions / (overallTotalMediumCorrectQuestions +
        overallTotalMediumWrongQuestions)) * 100).toFixed(2)

    const overallHardAccuracy = parseFloat("" + (overallTotalHardCorrectQuestions / (overallTotalHardCorrectQuestions +
        overallTotalHardWrongQuestions)) * 100).toFixed(2)

    res.send({
        overallEasyAccuracy,
        overallHardAccuracy,
        overallMediumAccuracy,
        myEasyAccuracy,
        myHardAccuracy,
        myMediumAccuracy
    });

})


// Get Accuracy Based on skills strength
router.get("/accuracy-based-on-skills-strength/:testId/:attemptNo", async (req, res) => {
    const userId = res.locals.userId
    const testId = req.params.testId
    const attemptNo = req.params.attemptNo
    const data = await new Promise((resolve) => {
        con.query(`select question_wise_data,user_id from done_tests where test_id=? and attempt_no=?`, [testId, attemptNo], (err, result) => {
            resolve(result)
        })
    })

    const MEMORY = 1
    const CONCEPTUAL = 2
    const APPLICATION = 3


    const myData = data.find(d => d.user_id == userId);
    const myQuestionWiseData = JSON.parse(myData.question_wise_data)

    const totalMemoryCorrectQuestions = myQuestionWiseData.filter(q => q.questionTaggingId == MEMORY && q.status == 'C').length
    const totalConceptualCorrectQuestions = myQuestionWiseData.filter(q => q.questionTaggingId == CONCEPTUAL && q.status == 'C').length
    const totalApplicationCorrectQuestions = myQuestionWiseData.filter(q => q.questionTaggingId == APPLICATION && q.status == 'C').length

    const totalMemoryWrongQuestions = myQuestionWiseData.filter(q => q.questionTaggingId == MEMORY && q.status == 'W').length
    const totalConceptualWrongQuestions = myQuestionWiseData.filter(q => q.questionTaggingId == CONCEPTUAL && q.status == 'W').length
    const totalApplicationWrongQuestions = myQuestionWiseData.filter(q => q.questionTaggingId == APPLICATION && q.status == 'W').length

    const myMemoryAccuracy = parseFloat("" + (totalMemoryCorrectQuestions / (totalMemoryCorrectQuestions +
        totalMemoryWrongQuestions)) * 100).toFixed(2)
    const myConceptualAccuracy = parseFloat("" + (totalConceptualCorrectQuestions / (totalConceptualCorrectQuestions +
        totalConceptualWrongQuestions)) * 100).toFixed(2)
    const myApplicationAccuracy = parseFloat("" + (totalApplicationCorrectQuestions / (totalApplicationCorrectQuestions +
        totalApplicationWrongQuestions)) * 100).toFixed(2)

    let overallTotalMemoryCorrectQuestions = 0
    let overallTotalMemoryWrongQuestions = 0

    let overallTotalConceptualCorrectQuestions = 0
    let overallTotalConceptualWrongQuestions = 0

    let overallTotalApplicationCorrectQuestions = 0
    let overallTotalApplicationWrongQuestions = 0

    data.forEach(d => {
        const questionWiseData = JSON.parse(d.question_wise_data)

        overallTotalMemoryCorrectQuestions = questionWiseData.filter(q => q.questionTaggingId == MEMORY && q.status == 'C').length
        overallTotalConceptualCorrectQuestions = questionWiseData.filter(q => q.questionTaggingId == CONCEPTUAL && q.status == 'C').length
        overallTotalApplicationCorrectQuestions = questionWiseData.filter(q => q.questionTaggingId == APPLICATION && q.status == 'C').length

        overallTotalMemoryWrongQuestions = questionWiseData.filter(q => q.questionTaggingId == MEMORY && q.status == 'W').length
        overallTotalConceptualWrongQuestions = questionWiseData.filter(q => q.questionTaggingId == CONCEPTUAL && q.status == 'W').length
        overallTotalApplicationWrongQuestions = questionWiseData.filter(q => q.questionTaggingId == APPLICATION && q.status == 'W').length
    })

    const overallMemoryAccuracy = parseFloat("" + (overallTotalMemoryCorrectQuestions / (overallTotalMemoryCorrectQuestions +
        overallTotalMemoryWrongQuestions)) * 100).toFixed(2)
    const overallConceptualAccuracy = parseFloat("" + (overallTotalConceptualCorrectQuestions / (overallTotalConceptualCorrectQuestions +
        overallTotalConceptualWrongQuestions)) * 100).toFixed(2)
    const overallApplicationAccuracy = parseFloat("" + (overallTotalApplicationCorrectQuestions / (overallTotalApplicationCorrectQuestions +
        overallTotalApplicationWrongQuestions)) * 100).toFixed(2)

    res.send({
        overallApplicationAccuracy,
        overallMemoryAccuracy,
        overallConceptualAccuracy,
        myMemoryAccuracy,
        myApplicationAccuracy,
        myConceptualAccuracy
    })
})

// Get Accuracy Attemt
router.get("/attempt-accuracy/:testId/:attemptNo", async (req, res) => {
    const userId = res.locals.userId
    const testId = req.params.testId
    const attemptNo = req.params.attemptNo

    con.query(`select accuracy from done_tests where user_id=? and test_id=? and  attempt_no=?`, [userId, testId, attemptNo], (err, result) => {
        if (err) {
            return res.status(500).end(err.sqlMessage)
        }
        res.send(JSON.parse(result[0].accuracy))
    })

})

//Pace Analysis
router.get("/pace-analysis/:testId/:attemptNo", (req, res) => {
    const userId = res.locals.userId
    const testId = req.params.testId
    const attemptNo = req.params.attemptNo

    con.query(`select question_wise_data,notAnswered,notVisited,markedForReview from done_tests where user_id=? and test_id=? and  attempt_no=?`, [userId, testId, attemptNo], (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        let questionWiseData = JSON.parse(result[0].question_wise_data)

        let correctQuestions = questionWiseData.filter(q => q.status == "C")

        let correctTooSlow = correctQuestions.filter(c => {
            return c.time_spend > (c.idealTime * 1.25)
        }).length

        let correctTooFast = correctQuestions.filter(c => {
            return c.time_spend < (c.idealTime * 0.75)
        }).length

        let correctPerfect = correctQuestions.filter(c => {
            return c.time_spend >= (c.idealTime * 0.75) && c.time_spend <= (c.idealTime * 1.25)
        }).length

        let wrongQuestions = questionWiseData.filter(q => q.status == "W")

        let wrongTooSlow = wrongQuestions.filter(c => {
            return c.time_spend > (c.idealTime * 1.25)
        }).length

        let wrongTooFast = wrongQuestions.filter(c => {
            return c.time_spend < (c.idealTime * 0.75)
        }).length

        let wrongPerfect = wrongQuestions.filter(c => {
            return c.time_spend >= (c.idealTime * 0.75) && c.time_spend <= (c.idealTime * 1.25)
        }).length


        res.send({
            correctTooFast: (correctTooFast / correctQuestions.length) * 100,
            correctTooSlow: (correctTooSlow / correctQuestions.length) * 100,
            correctPerfect: (correctPerfect / correctQuestions.length) * 100,
            wrongTooFast: (wrongTooFast / wrongQuestions.length) * 100,
            wrongTooSlow: (wrongTooSlow / wrongQuestions.length) * 100,
            wrongPerfect: (wrongPerfect / wrongQuestions.length) * 100,
            notVisited: result[0].notVisited,
            notAnsered: result[0].notAnsered,
            markedForReview: result[0].markedForReview
        })

    })
})

//Time Statistics
router.get("/time-statistics/:testId/:attemptNo", (req, res) => {
    const userId = res.locals.userId
    const testId = req.params.testId
    const attemptNo = req.params.attemptNo

    con.query(`select productiveTime,nonProductiveTime,unUsedTime from done_tests where user_id=? and test_id=? and  attempt_no=?`, [userId, testId, attemptNo], (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        res.send(result[0])
    })

})

function getAgility(userId, testId, attemptNo) {
    return new Promise(resolve => {
        con.query(`select question_wise_data from done_tests where user_id=? and test_id=? and attempt_no=?`, [userId, testId, attemptNo], (err, result) => {

            const questionWiseData = JSON.parse(result[0].question_wise_data)
            const attemptedQuestions = questionWiseData.filter(q => q.status != 'S')
            let actualTime = 0
            let idealTime = 0
            let agility = 0

            attemptedQuestions.forEach(a => {
                actualTime += a.time_spend
                idealTime += a.idealTime
            })

            if (actualTime < idealTime) {
                agility = -32 + 106 * (2 - (actualTime / idealTime))
            } else {
                agility = -32 + 106 * (idealTime / actualTime)
            }

            resolve(agility)
        })
    })
}

function getPrecision(userId, testId, attemptNo) {
    return new Promise(resolve => {
        con.query(`select question_wise_data from done_tests where user_id=? and test_id=? and attempt_no=?`, [userId, testId, attemptNo], (err, result) => {
            const questionWiseData = JSON.parse(result[0].question_wise_data)
            const correctQuestions = questionWiseData.filter(q => q.status == 'C').length
            const attemptedQuestions = questionWiseData.filter(q => q.status != 'S').length

            const precision = -32 + 212 * (correctQuestions / attemptedQuestions)
            resolve(precision)
        })
    })
}

function getDetermind(userId, testId, attemptNo) {
    return new Promise(resolve => {
        con.query(`select question_wise_data,time_spend from done_tests where user_id=? and test_id=? and attempt_no=?`, [userId, testId, attemptNo], async (err, result) => {
            const questionWiseData = JSON.parse(result[0].question_wise_data)

            const timeTaken = result[0].time_spend
            const test = await getTestById(testId)
            const actualTime = test.duration * 60
            const totalQuestions = questionWiseData.length
            const attemptedQuestions = questionWiseData.filter(q => q.status != 'S').length

            const determind = -32 + 106 * ((timeTaken / actualTime) + (attemptedQuestions / totalQuestions))
            resolve(determind)
        })
    })
}

function getPreseverance(userId, testId, attemptNo) {
    return new Promise(resolve => {

        con.query(`select question_wise_data from done_tests where user_id=? and test_id=? and attempt_no=?`, [userId, testId, attemptNo], async (err, result) => {
            const HARD = 1
            const questionWiseData = JSON.parse(result[0].question_wise_data)
            const attemptedQuestionsTimeTakenIsGreator = questionWiseData.filter(q => q.time_spend > q.idealTime * 1.25 && q.status != "S").length
            const questionsTimeTakenIsGreator = questionWiseData.filter(q => q.time_spend > q.idealTime * 1.25).length

            const difficultQuestionsAttempted = questionWiseData.filter(q => q.status != 'S' && q.difficultyLevelId == HARD).length
            const difficultQuestions = questionWiseData.filter(q => q.difficultyLevelId == HARD).length
            const preseverance = ((attemptedQuestionsTimeTakenIsGreator / questionsTimeTakenIsGreator) + (difficultQuestionsAttempted / difficultQuestions)) * 50
            resolve(preseverance)
        })

    })
}

//Behaviour Analysis
router.get("/behaviour-analysis/:testId/:attemptNo", async (req, res) => {
    const userId = res.locals.userId
    const testId = req.params.testId
    const attemptNo = req.params.attemptNo

    const agility = await getAgility(userId, testId, attemptNo)
    const precision = await getPrecision(userId, testId, attemptNo)
    const determind = await getDetermind(userId, testId, attemptNo)
    const preseverance = await getPreseverance(userId, testId, attemptNo)
    res.send({ agility, precision, determind, preseverance })
})

function getQuestionsDataForSolutionReport(questionsIds, res) {
    return new Promise((resolve) => {

        con.query(`select * from (select q.questionId,q.subjectId,q.questionTypeId,sb.subject,srq.question_text,srq.option_a,srq.option_b,srq.option_c,srq.option_d,srq.option_e,srq.option_f from questions q inner join erp_subjects sb on sb.subjectId=q.subjectId inner join single_response_questions srq on srq.questionId=q.questionId where q.questionId in(${questionsIds}) union select q.questionId,q.subjectId,q.questionTypeId,sb.subject,ar.question_text,ar.option_a,ar.option_b,ar.option_c,ar.option_d,ar.option_e,ar.option_f from questions q inner join erp_subjects sb on sb.subjectId=q.subjectId inner join assertion_reason_questions ar on ar.questionId=q.questionId where q.questionId in(${questionsIds}) union select q.questionId,q.subjectId,q.questionTypeId,sb.subject,cs.question_text,cs.option_a,cs.option_b,cs.option_c,cs.option_d,cs.option_e,cs.option_f from questions q inner join erp_subjects sb on sb.subjectId=q.subjectId inner join case_study_questions cs on cs.questionId=q.questionId where q.questionId in(${questionsIds}) union select q.questionId,q.subjectId,q.questionTypeId,sb.subject,mrq.question_text,mrq.option_a,mrq.option_b,mrq.option_c,mrq.option_d,mrq.option_e,mrq.option_f from questions q inner join erp_subjects sb on sb.subjectId=q.subjectId inner join multi_response_questions mrq on mrq.questionId=q.questionId where q.questionId in(${questionsIds}) union select q.questionId,q.subjectId,q.questionTypeId,sb.subject,tfq.question_text,null as option_a,null as option_b,null as option_c,null as option_d,null as option_e,null as option_f from questions q inner join erp_subjects sb on sb.subjectId=q.subjectId inner join true_false_questions tfq on tfq.questionId=q.questionId where q.questionId in(${questionsIds}) union select q.questionId,q.subjectId,q.questionTypeId,sb.subject,iq.question_text,null as option_a,null as option_b,null as option_c,null as option_d,null as option_e,null as option_f from questions q inner join erp_subjects sb on sb.subjectId=q.subjectId inner join integer_questions iq on iq.questionId=q.questionId where q.questionId in(${questionsIds}) union select q.questionId,q.subjectId,q.questionTypeId,sb.subject,mmq.question_text,mmq.column1 as option_a,mmq.column2 as option_b,null as option_c,null as option_d,null as option_e,null as option_f from questions q inner join erp_subjects sb on sb.subjectId=q.subjectId inner join match_matrix_questions mmq on mmq.questionId=q.questionId where q.questionId in(${questionsIds})) allquestions order by field(questionId,${questionsIds}) `, async (err, result) => {

            if (err) {
                res.status(500).end(err.sqlMessage)
            }

            resolve(result)
        })
    })
}

/* Get Dashboard Data */
router.get("/test-dashboard", async (req, res) => {
    let totalQuestions = await new Promise((resolve) => {
        con.query("select count(questionId) as total_questions from questions", (err, result) => {
            resolve(result[0].total_questions)
        })
    })

    let totalTests = await new Promise((resolve) => {
        con.query("select count(id) as total_tests from test ", (err, result) => {
            resolve(result[0].total_tests)
        })
    })

    let activeTests = await new Promise((resolve) => {
        con.query("select count(id) as total_active_tests from test where publish_end_datetime>now() ", (err, result) => {
            resolve(result[0].total_active_tests)
        })
    })

    res.send({ totalQuestions, totalTests, activeTests })
})

/* Get Courses Dashboard Data */
router.get("/courses-dashboard", async (req, res) => {

    let totalCourses = await new Promise((resolve) => {
        con.query("select count(courseId) as total_courses from erp_courses", (err, result) => {
            resolve(result[0].total_courses)
        })
    })

    let totalBatches = await new Promise((resolve) => {
        con.query("select count(batchId) as total_batches from erp_batches ", (err, result) => {
            resolve(result[0].total_batches)
        })
    })

    let totalSubjects = await new Promise((resolve) => {
        con.query("select count(subjectId) as total_subjects from erp_subjects ", (err, result) => {
            resolve(result[0].total_subjects)
        })
    })

    res.send({ totalBatches, totalCourses, totalSubjects })
})



//export this router to use in our index.js
module.exports = router