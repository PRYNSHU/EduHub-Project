const con = require("../db");
async function getQuestions(chapterId, userId = null, type) {

    let append = ''
    if (type == 'questions') {
        append = ` and q.report is null and (q.questionTaggingId is null or q.topicId is null)`
    }
    else if (type == 'marked') {
        append = ` and q.markedBy='${userId}'`
    }
    else if (type == 'reported') {
        append = ` and q.reportedBy='${userId}'`
    }

    let singleResponseSQL = `select q.questionId,q.topicId,q.questionTypeId,q.questionTaggingId,q.report,q.difficultyLevelId,srq.question_text,srq.option_a,srq.option_b,srq.option_c,srq.option_d,ucase(substring(srq.correct,8,1)) correct,e.content,p.paragraph,qt.name as questionType from questions q inner join single_response_questions srq on srq.questionId=q.questionId left join explanation e on e.questionId=q.questionId left join paragraphId_questionId pq on pq.questionId=q.questionId left join paragraphs p on p.paragraphId=pq.paragraphId inner join questiontypes qt on qt.questionTypeId=q.questionTypeId where q.chapterId=? ${append} `

    let singleResponseQuestions = await new Promise((resolve) => {
        con.query(singleResponseSQL, [chapterId], (err, result) => resolve(result))
    })

    let assertionReasonSQL = `select q.questionId,q.topicId,q.questionTypeId,q.questionTaggingId,q.report,q.difficultyLevelId,arq.question_text,arq.option_a,arq.option_b,arq.option_c,arq.option_d,ucase(substring(arq.correct,8,1)) correct,e.content,p.paragraph,qt.name as questionType from questions q inner join assertion_reason_questions arq on arq.questionId=q.questionId left join explanation e on e.questionId=q.questionId left join paragraphId_questionId pq on pq.questionId=q.questionId left join paragraphs p on p.paragraphId=pq.paragraphId inner join questiontypes qt on qt.questionTypeId=q.questionTypeId where q.chapterId=? ${append}`

    let assertionReasonQuestions = await new Promise((resolve) => {
        con.query(assertionReasonSQL, [chapterId], (err, result) => {
            resolve(result)
        })
    })

    let caseStudySQL = `select q.questionId,q.topicId,q.questionTypeId,q.questionTaggingId,q.report,q.difficultyLevelId,csq.question_text,csq.option_a,csq.option_b,csq.option_c,csq.option_d,ucase(substring(csq.correct,8,1)) correct,e.content,p.paragraph,qt.name questionType from questions q inner join case_study_questions csq on csq.questionId=q.questionId left join explanation e on e.questionId=q.questionId left join paragraphId_questionId pq on pq.questionId=q.questionId left join paragraphs p on p.paragraphId=pq.paragraphId inner join questiontypes qt on qt.questionTypeId=q.questionTypeId where q.chapterId=? ${append}`

    let caseStudyQuestions = await new Promise((resolve) => {
        con.query(caseStudySQL, [chapterId], (err, result) => {
            resolve(result)
        })
    })

    let multiResponseSQL = `select q.questionId,q.topicId,q.questionTypeId,q.questionTaggingId,q.report,q.difficultyLevelId,mrq.question_text,mrq.option_a,mrq.option_b,mrq.option_c,mrq.option_d,mrq.correct,e.content,p.paragraph,qt.name questionType from questions q inner join multi_response_questions mrq on mrq.questionId=q.questionId left join explanation e on e.questionId=q.questionId left join paragraphId_questionId pq on pq.questionId=q.questionId left join paragraphs p on p.paragraphId=pq.paragraphId inner join questiontypes qt on qt.questionTypeId=q.questionTypeId where q.chapterId=? ${append}`

    let multiResponseQuestions = await new Promise((resolve) => {
        con.query(multiResponseSQL, [chapterId], (err, result) => {
            resolve(result)
        })
    })

    let trueFalseSQL = `select q.questionId,q.topicId,q.questionTypeId,q.questionTaggingId,q.report,q.difficultyLevelId,tf.question_text,tf.correct,e.content,p.paragraph,qt.name questionType from questions q inner join true_false_questions tf on tf.questionId=q.questionId left join explanation e on e.questionId=q.questionId left join paragraphId_questionId pq on pq.questionId=q.questionId left join paragraphs p on p.paragraphId=pq.paragraphId inner join questiontypes qt on qt.questionTypeId=q.questionTypeId where q.chapterId=? ${append}`

    let trueFalseQuestions = await new Promise((resolve) => {
        con.query(trueFalseSQL, [chapterId], (err, result) => {
            resolve(result)
        })
    })

    let integerSQL = `select q.questionId,q.topicId,q.questionTypeId,q.questionTaggingId,q.report,q.difficultyLevelId,i.question_text,i.correct,e.content,p.paragraph,qt.name questionType from questions q inner join integer_questions i on i.questionId=q.questionId left join explanation e on e.questionId=q.questionId left join paragraphId_questionId pq on pq.questionId=q.questionId left join paragraphs p on p.paragraphId=pq.paragraphId inner join questiontypes qt on qt.questionTypeId=q.questionTypeId  where q.chapterId=? ${append}`

    let integerQuestions = await new Promise((resolve) => {
        con.query(integerSQL, [chapterId], (err, result) => {
            resolve(result)
        })
    })

    let matchMatrixSQL = `select q.questionId,q.topicId,q.questionTypeId,q.questionTaggingId,q.report,q.difficultyLevelId,mx.question_text,mx.column1,mx.column2,mx.answer_key,e.content,p.paragraph,qt.name questionType from questions q inner join match_matrix_questions mx on mx.questionId=q.questionId left join explanation e on e.questionId=q.questionId left join paragraphId_questionId pq on pq.questionId=q.questionId left join paragraphs p on p.paragraphId=pq.paragraphId inner join questiontypes qt on qt.questionTypeId=q.questionTypeId where q.chapterId=? ${append}`

    let matchMatrixQuestions = await new Promise((resolve) => {
        con.query(matchMatrixSQL, [chapterId], (err, result) => {

            result.forEach(r => {
                r.column1 = JSON.parse(r.column1)
                r.column2 = JSON.parse(r.column2)
                r.answer_key = JSON.parse(r.answer_key)

                let column1 = []
                let column2 = []

                Object.keys(r.column1).forEach(key => {
                    column1.push({
                        option: r.column1[key],
                        corrects: [
                            { option: false },
                            { option: false },
                            { option: false },
                            { option: false }
                        ]
                    })
                })

                Object.keys(r.column2).forEach(key => {
                    column2.push({ option: r.column2[key] })
                })

                Object.keys(r.answer_key).forEach((key, index) => {
                    let options = r.answer_key[key]

                    options.forEach(o => {
                        let ind = o.charCodeAt(0) - 80;
                        column1[index].corrects[ind].option = true
                    })

                })

                r.column1 = column1
                r.column2 = column2
                delete r.answer_key
            })

            resolve(result)
        })
    })

    return [
        singleResponseQuestions,
        multiResponseQuestions,
        trueFalseQuestions,
        integerQuestions,
        matchMatrixQuestions,
        assertionReasonQuestions,
        caseStudyQuestions
    ]

}

module.exports = { getQuestions }