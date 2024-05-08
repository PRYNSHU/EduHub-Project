const TestType = {
    Examination: 1,
    PRACTICE: 2,
    InLectures: 3,
    BBP: 4,
    InChapters:5
}

const MarkingScheme = {
    OldScheme: 1,
    NewJEE2021: 2
}

const questionType = {
    SINGLE_RESPONSE: 1,
    MULTI_RESPONSE: 2,
    TRUE_FALSE: 3,
    INTEGER: 4,
    MATCH_MATRIX: 5,
    ASSERTION_REASON: 6,
    CASE_STUDY: 7
}

module.exports = { TestType, MarkingScheme,questionType}