var express = require('express');
var router = express.Router();
var con = require("../db");
const fs = require("fs")
const rimraf = require("rimraf");


function getCourseIdByStudentId(studentId) {
    return new Promise(resolve => {
        con.query(`select courseId from student_course where studentId=?`, [studentId], (err, result) => {
            resolve(result[0].courseId)
        })
    })
}

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

//Formats filename or folder name  
function getFormattedName(name) {
    return name.trim().toLowerCase().replace(/['"]+/g, '').replace(/\//g, ' ').split(" ").join("-")
}

// Dashboard statistics chart of subjects
router.get("/dashboard-statistics-chart", async (req, res) => {
    let userId = res.locals.userId
    let courseId = await getCourseIdByStudentId(userId)

    let doneTests = await new Promise((resolve) => {
        con.query(`SELECT ecs.courseId,ecs.subject,count(dt.test_id) testsDone FROM erp_courses_subjects ecs inner join erp_subjects_chapters esc on esc.subjectId=ecs.subjectId and ecs.courseId=? left JOIN erp_chapters_tests ect on ect.chapterId=esc.chapterId left join done_tests dt on dt.test_id=ect.testId and dt.user_id=? group by ecs.subjectId`, [courseId, userId], (err, result) => {
            resolve(result)
        })
    })

    let totalTests = await new Promise((resolve) => {
        con.query(`SELECT ecs.courseId,ecs.subject,count(ect.testCode) testCount FROM erp_courses_subjects ecs inner join erp_subjects_chapters esc on esc.subjectId=ecs.subjectId and ecs.courseId=? left JOIN erp_chapters_tests ect on ect.chapterId=esc.chapterId group by ecs.subjectId`, [courseId], (err, result) => {
            resolve(result)
        })
    })

    let watchedVideos = await new Promise(resolve => {
        con.query(`SELECT ecs.subject,count(ect.topicId) videosWatched FROM erp_courses_subjects ecs inner join erp_subjects_chapters esc on esc.subjectId=ecs.subjectId and ecs.courseId=? left JOIN erp_chapters_topics ect on ect.chapterId=esc.chapterId and find_in_set(?,ect.watchedBy) group by ecs.subjectId`, [courseId,userId], (err, result) => {            
            resolve(result)
        })
    })

    let totalVideos = await new Promise(resolve => {
        con.query(`SELECT ecs.subject,count(ect.topicId) videosCount FROM erp_courses_subjects ecs inner join erp_subjects_chapters esc on esc.subjectId=ecs.subjectId and ecs.courseId=? left JOIN erp_chapters_topics ect on ect.chapterId=esc.chapterId  group by ecs.subjectId`, [courseId], (err, result) => {
            resolve(result)
        })
    })

    let finalResult = {}

    totalTests.forEach(item => {
        let doneTest = doneTests.find(dt => dt.subject == item.subject);
        let totalVideo = totalVideos.find(tv => tv.subject == item.subject);
        let watchedVideo = watchedVideos.find(wv => wv.subject == item.subject);

        let percentage = +(((doneTest.testsDone + watchedVideo.videosWatched) / (item.testCount + totalVideo.videosCount) * 100).toFixed(2));

        if (isNaN(percentage)) {
            percentage = 0
        }

        finalResult[item.subject.toLowerCase()] = percentage
    })

    res.send(finalResult)

})


//get Full-courses
router.get("/", (req, res) => {
    con.query(`select *,concat(substring(folderPath,16),image) image from erp_courses`, (err, result) => {
        if (err) {
            return res.status(500).end(err.message)
        }
        res.send(result)
    })
})

//get Full-courses For Eduotics.com
router.get("/for-eduotics", (req, res) => {
    con.query(`select *,concat(substring(folderPath,30,37),image) image from erp_courses`, (err, result) => {
        if (err) {
            return res.status(500).end(err.message)
        }
        res.send(result)
    })
})


// Mark Video as Watched on Next CLick;
router.put("/mark-video-watched", async (req, res) => {
    let videoId = req.body.videoId
    let userId = res.locals.userId 

    let watchedBy = await new Promise((resolve) => {
        con.query(`select watchedBy from erp_chapters_topics where videoId=?`, [videoId], (err, result) => {
            resolve(result[0].watchedBy)
        })
    })

    if (!watchedBy) {
        watchedBy = userId
    }
    else {
        if (watchedBy.split(",").map(m => +m).includes(userId) == false)
            watchedBy += "," + userId
    }

    con.query(`update erp_chapters_topics set watchedBy=? where videoId=?`, [watchedBy, videoId], (err, result) => {
        if (err) {
            return res.status(500).end(err.message)
        }
        res.send({ success: result.changedRows > 0 })
    })
})

//get Full-course By Id
router.get("/course/:courseId", (req, res) => {
    con.query(`select * from erp_courses where courseId=?`, [req.params.courseId], (err, result) => {
        if (err) {
            return res.status(500).end(err.message)
        }
        res.send(result[0])
    })
})

// Join Course From Panel
router.post("/join-course", (req, res) => {
    let courseId = req.body.courseId
    let userId = res.locals.userId
    con.query(`insert into erp_students_cbs(studentId,courseId,batchId,active) values(?)`, [[userId, courseId, courseId, 0]], (err, result) => {
        if (err) {
            return res.status(500).end(err.sqlMessage);
        }
        res.send({ success: result.affectedRows > 0, message: "Course joined successfully" })
    })
})

//Create Full Course
router.post("/", (req, res) => {

    let data = req.body
    const folderName = getFormattedName(data.title)

    let includeIcon = []
    let includeIconPath = []

    let courseImage = null
    let courseImagePath = null

    const folderPath = "../public_html/eduotics-users/assets/images/courses/" + folderName + "/"
    createFoldersForCourse(folderName)

    if (req.files != null) {

        if (req.files.courseImage) {
            courseImage = req.files.courseImage
            let fileExtension = courseImage.name.split(".").pop()
            let fileName = getFormattedName(req.body.title)
            let imagePath = "" + fileName + "." + fileExtension

            if (fs.existsSync(folderPath + imagePath)) {
                imagePath = getRenamedFileName(folderPath, imagePath)
            }

            courseImagePath = imagePath
        }


        if (req.files["includeIcon[]"].constructor.name == "Object") {
            includeIcon.push(req.files["includeIcon[]"])
            let fileExtension = req.files["includeIcon[]"].name.split(".").pop()
            let fileName = getFormattedName(req.body["includeTitle[]"])

            let imagePath = "" + fileName + "." + fileExtension

            if (fs.existsSync(folderPath + imagePath)) {
                imagePath = getRenamedFileName(folderPath, imagePath)
            }

            includeIconPath.push(imagePath)
        }

        else {
            req.files["includeIcon[]"].forEach((icon, index) => {
                includeIcon.push(icon)
                let fileExtension = icon.name.split(".").pop()
                let fileName = getFormattedName(req.body["includeTitle[]"][index])

                let imagePath = "" + fileName + "." + fileExtension

                if (fs.existsSync(folderPath + imagePath)) {
                    imagePath = getRenamedFileName(folderPath, imagePath)
                }

                includeIconPath.push(imagePath)
            })
        }
    }

    let includesObj = []

    includeIconPath.forEach((path, index) => {

        let includeTitle = req.body["includeTitle[]"];

        if (includeTitle.constructor.name == "String") {

            includesObj.push({
                includeTitle: req.body["includeTitle[]"],
                includeIconPath: path
            })

            return
        }

        includesObj.push({
            includeTitle: req.body["includeTitle[]"][index],
            includeIconPath: path
        })

    })



    const courseData = [
        data.title == "null" ? null : data.title,
        data.price,
        data.lessonsCount == "null" ? null : data.lessonsCount,
        data.duration == "null" ? null : data.duration,
        data.studentsEnrolled == "null" ? null : data.studentsEnrolled,
        JSON.stringify(includesObj),
        data.courseHighlights,
        data.overview == "null" ? null : data.overview,
        data.content == "null" ? null : data.content,
        data.syllabus == "null" ? null : data.syllabus,
        courseImagePath,
        folderPath,
    ]

    con.query(`insert into erp_courses(course,price,lessonsCount,duration,studentsEnrolled,courseIncludes,courseHighlights,courseOverview,courseContent,courseSyllabus,image,folderPath) values(?)`, [courseData], (err, result) => {

        if (err) {
            return res.status(500).end(err.message)
        }

        includeIcon.forEach((icon, index) => {
            icon.mv(folderPath + "icons/" + includeIconPath[index], err => {

                if (err) {
                    return res.send({ success: false, message: "Error while saving file" })
                }

            })
        })

        if (courseImage) {
            courseImage.mv(folderPath + courseImagePath, err => {
                if (err) {
                    return res.send({ success: false, message: "Error while saving Course Image" })
                }
            })
        }

        res.send({ success: true, message: "Course Added Successfully" })
    })
})


function createFoldersForCourse(courseName) {
    let coursesFolder = '../public_html/eduotics-users/assets/images/courses/' + courseName

    try {

        if (!fs.existsSync(coursesFolder)) {
            fs.mkdirSync(coursesFolder)
            fs.mkdirSync(coursesFolder + "/subjects")
            fs.mkdirSync(coursesFolder + "/icons")
        }

    } catch (err) {
        console.error(err)
    }
}


function getCourseById(courseId) {
    return new Promise((resolve) => {
        con.query(`select * from erp_courses where courseId=?`, [courseId], (err, result) => {
            resolve(result[0])
        })
    })
}

function getChapterById(chapterId) {
    return new Promise((resolve) => {
        con.query(`select * from erp_subjects_chapters where chapterId=?`, [chapterId], (err, result) => {
            resolve(result[0])
        })
    })
}

function getTopicById(topicId) {
    return new Promise((resolve) => {
        con.query(`select * from erp_chapters_topics where topicId=? order by orderNo asc`, [topicId], (err, result) => {
            resolve(result[0])
        })
    })
}

//Delete Full Course
router.delete("/:courseId", async (req, res) => {
    const courseId = req.params.courseId

    let course = await getCourseById(courseId)
    let includeIconPath = JSON.parse(course.courseIncludes)

    const folderPath = "../public_html/eduotics-users/assets/images/courses/icons/"

    includeIconPath.forEach(i => {
        if (fs.existsSync(folderPath + i.includeIconPath)) {
            fs.unlinkSync(folderPath + i.includeIconPath)
        }
    })

    // Delete Course Image
    if (fs.existsSync(folderPath + course.image)) {
        fs.unlinkSync(folderPath + course.image)
    }

    const courseFolderName = getFormattedName(course.course)
    const deleteFolderPath = "../public_html/eduotics-users/assets/images/courses/" + courseFolderName

    if (fs.existsSync(deleteFolderPath)) {
        rimraf(deleteFolderPath, () => null)
    }

    con.query(`delete from erp_courses where courseId=?`, [courseId], (err, result) => {

        if (err) {
            return res.status(500).end(err.message)
        }

        res.send({ success: result.affectedRows > 0 })
    })

})

//Edit Full Course
router.post("/update", async (req, res) => {
    let data = req.body
    let courseId = data.courseId
    let courseDB = await getCourseById(courseId)

    let courseImage = null
    let courseImagePath = courseDB.image

    let includeIcon = []
    let includeIconPath = []

    let includeIconPathData = JSON.parse(courseDB.courseIncludes)

    includeIconPathData.forEach(i => {
        includeIconPath.push(i.includeIconPath)
    })


    const folderPath = "../public_html/assets/images/courses/icons/"

    if (data.removedIncludes) {

        let removedIncludes = []

        if (data.removedIncludes.constructor.name == "String") {
            removedIncludes[0] = data.removedIncludes
        }
        else {
            removedIncludes = data.removedIncludes
        }

        removedIncludes.forEach(r => {

            let item = includeIconPath.find(i => i.includeIconPath == r)
            includeIconPath.splice(includeIconPath.indexOf(item), 1)

            if (fs.existsSync(folderPath + r)) {
                fs.unlinkSync(folderPath + r)
            }
        })

    }

    if (req.files && req.files.courseImage) {

        if (fs.existsSync(folderPath + courseDB.image)) {
            fs.unlinkSync(folderPath + courseDB.image)
        }
    }

    if (req.files != null) {


        if (req.files.courseImage) {
            courseImage = req.files.courseImage
            let fileExtension = courseImage.name.split(".").pop()
            let fileName = getFormattedName(req.body.course)
            let imagePath = "" + fileName + "." + fileExtension

            if (fs.existsSync(folderPath + imagePath)) {
                imagePath = getRenamedFileName(folderPath, imagePath)
            }

            courseImagePath = imagePath
        }

        if (req.files["includeIcon[]"]) {

            if (req.files["includeIcon[]"].constructor.name == "Object") {
                let index = +req.body.includeIconIndex

                includeIcon.push(req.files["includeIcon[]"])
                let fileExtension = req.files["includeIcon[]"].name.split(".").pop()

                let fileName = "";

                if (req.body["includeTitle[]"].constructor.name == "String") {
                    fileName = getFormattedName(req.body["includeTitle[]"])
                }
                else {
                    fileName = getFormattedName(req.body["includeTitle[]"][index])
                }

                let imagePath = "" + fileName + "." + fileExtension

                if (fs.existsSync(folderPath + includeIconPath[index])) {
                    fs.unlinkSync(folderPath + includeIconPath[index])
                }

                if (fs.existsSync(folderPath + imagePath)) {
                    imagePath = getRenamedFileName(folderPath, imagePath)
                }

                if (index <= includeIconPath.length - 1) {
                    includeIconPath[index] = imagePath
                } else {
                    includeIconPath.push(imagePath)
                }

            }

            else {
                let indexChoosed = req.body.includeIconIndex
                req.files["includeIcon[]"].forEach((icon, index) => {

                    includeIcon.push(icon)
                    let fileExtension = icon.name.split(".").pop()
                    let fileName = getFormattedName(req.body["includeTitle[]"][+indexChoosed[index]])

                    let imagePath = "" + fileName + "." + fileExtension

                    if (fs.existsSync(folderPath + includeIconPath[+indexChoosed[index]])) {
                        fs.unlinkSync(folderPath + includeIconPath[+indexChoosed[index]])
                    }

                    if (fs.existsSync(folderPath + imagePath)) {
                        imagePath = getRenamedFileName(folderPath, imagePath)
                    }

                    if (+indexChoosed[index] <= includeIconPath.length - 1) {
                        includeIconPath[+indexChoosed[index]] = imagePath
                    } else {
                        includeIconPath.push(imagePath)
                    }

                })
            }
        }
    }

    let includesObj = []

    includeIconPath.forEach((path, index) => {

        let includeTitle = req.body["includeTitle[]"];

        if (includeTitle.constructor.name == "String") {

            includesObj.push({
                includeTitle: req.body["includeTitle[]"],
                includeIconPath: path
            })

            return
        }

        includesObj.push({
            includeTitle: req.body["includeTitle[]"][index],
            includeIconPath: path
        })

    })

    const courseData = [
        data.course == "null" ? null : data.course,
        data.price,
        data.lessonsCount == "null" ? null : data.lessonsCount,
        data.duration == "null" ? null : data.duration,
        data.studentsEnrolled == "null" ? null : data.studentsEnrolled,
        JSON.stringify(includesObj),
        data.courseHighlights,
        data.overview == "null" ? null : data.overview,
        data.content == "null" ? null : data.content,
        data.syllabus == "null" ? null : data.syllabus,
        courseImagePath,
        courseId
    ]

    con.query(`update erp_courses set course=?,price=?,lessonsCount=?,duration=?,studentsEnrolled=?,courseIncludes=?,courseHighlights=?,courseOverview=?,courseContent=?,courseSyllabus=?,image=? where courseId=?`, courseData, (err, result) => {

        if (err) {
            return res.status(500).end(err.message)
        }

        includeIcon.forEach((icon, index) => {
            let indexChoosed = +req.body.includeIconIndex[index]
            icon.mv(folderPath + includeIconPath[indexChoosed], err => {

                if (err) {
                    return res.send({ success: false, message: "Error while saving file" })
                }

            })
        })

        if (courseImage) {
            courseImage.mv(folderPath + courseImagePath, err => {
                if (err) {
                    console.log(err)
                    return res.send({ success: false, message: "Error while saving Course Image" })
                }
            })
        }

        let currentFolderName = getFormattedName(courseDB.course)
        let newFolderName = getFormattedName(data.course)

        renameFolderForCourse(currentFolderName, newFolderName)
        renameFolderNamesForCourseInDB(currentFolderName, newFolderName)
        res.send({ success: true, message: "Course Updated Successfully" })
    })
})

function renameFolderNamesForCourseInDB(currentFolderName, newFolderName) {
    let sql = `update erp_courses set folderPath=replace(folderPath,'${currentFolderName}','${newFolderName}');
               update erp_courses_subjects set folderPath=replace(folderPath,'${currentFolderName}','${newFolderName}');
               update erp_subjects_chapters set folderPath=replace(folderPath,'${currentFolderName}','${newFolderName}');`
    con.query(sql)
}


function renameFolderForCourse(currentPath, newPath) {
    let folder = "../public_html/eduotics-users/assets/images/courses/"
    if (fs.existsSync(folder + currentPath)) {
        fs.renameSync(folder + currentPath, folder + newPath, err => {
            console.log(err)
        })
    }
}

//Create/Upload Subject Under Full Course
router.post("/subject", async (req, res) => {

    let data = req.body
    let courseDB = await getCourseById(data.courseId)
    let courseFolderName = getFormattedName(courseDB.course)
    const subjectFolderName = getFormattedName(data.subject)

    let subjectImage = null
    let subjectImagePath = null

    const folderPath = "../public_html/eduotics-users/assets/images/courses/" + courseFolderName + "/subjects/" + subjectFolderName + "/"

    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath)
    }

    if (req.files != null) {

        if (req.files.subjectImage) {
            subjectImage = req.files.subjectImage
            let fileExtension = subjectImage.name.split(".").pop()
            let fileName = getFormattedName(req.body.subject)
            let imagePath = "" + fileName + "." + fileExtension

            if (fs.existsSync(folderPath + imagePath)) {
                imagePath = getRenamedFileName(folderPath, imagePath)
            }

            subjectImagePath = imagePath
        }
    }

    let subjectData = [
        data.courseId,
        data.subject,
        subjectImagePath,
        folderPath,
    ]

    con.query(`insert into erp_courses_subjects(courseId,subject,image,folderPath) values(?)`, [subjectData], (err, result) => {

        if (err) {
            return res.status(500).end(err.message)
        }

        if (subjectImage) {
            subjectImage.mv(folderPath + subjectImagePath, err => {
                if (err) {
                    console.log(err)
                }
            })
        }

        res.send({ success: true, message: "Subject Added Successfully" })

    });
})

//Update Subject 
router.post("/subject/update", async (req, res) => {
    let data = req.body
    let subjectDB = await getSubjectById(data.subjectId)
    let courseDB = await getCourseById(data.courseId)
    let courseFolderName = getFormattedName(courseDB.course)
    let subjectFolderName = getFormattedName(subjectDB.subject)
    const folderPath = "../public_html/eduotics-users/assets/images/courses/" + courseFolderName + "/subjects/" + subjectFolderName + "/"

    if (req.files && req.files.subjectImage) {
        if (fs.existsSync(folderPath + subjectDB.image)) {
            fs.unlinkSync(folderPath + subjectDB.image)
        }
    }

    const newSubjectFolderName = getFormattedName(data.subject)
    const newFolderPath = "../public_html/eduotics-users/assets/images/courses/" + courseFolderName + "/subjects/" + newSubjectFolderName + "/"

    if (fs.existsSync(folderPath)) {
        fs.renameSync(folderPath, newFolderPath, err => {
            console.log(err)
        })
    }

    let subjectImage = null
    let subjectImagePath = subjectDB.image

    if (req.files != null) {

        if (req.files.subjectImage) {
            subjectImage = req.files.subjectImage
            let fileExtension = subjectImage.name.split(".").pop()
            let fileName = getFormattedName(data.subject)
            let imagePath = "" + fileName + "." + fileExtension

            if (fs.existsSync(newFolderPath + imagePath)) {
                imagePath = getRenamedFileName(newFolderPath, imagePath)
            }

            subjectImagePath = imagePath
        }
    }

    con.query(`update erp_courses_subjects set subject=?,image=?,folderPath=? where subjectId=? `, [data.subject, subjectImagePath, newFolderPath, data.subjectId], (err, result) => {

        if (err) {
            return res.status(500).end(err.message)
        }

        if (subjectImage) {
            subjectImage.mv(newFolderPath + subjectImagePath, err => {
                if (err) {
                    console.log(err)
                }
            })
        }

        replaceFolderNameForSubjectInDB(subjectFolderName, newSubjectFolderName)

        res.send({ success: true, message: "Subject Updated Successfully" })
    });

})

function replaceFolderNameForSubjectInDB(currentFolderName, newFolderName) {
    let sql = `update erp_subjects_chapters set folderPath=replace(folderPath,'${currentFolderName}','${newFolderName}')`
    con.query(sql)
}

//Get SUbjects
router.get("/subjects", (req, res) => {
    con.query(`select ecs.subjectId,ecs.subject,ecs.courseId,concat(substring(ecs.folderPath,16),ecs.image) image ,ec.course from erp_courses_subjects ecs inner join erp_courses ec on ecs.courseId=ec.courseId`, (err, result) => {
        if (err) {
            return res.status(500).end(err.message)
        }

        res.send(result)
    })
})

function getSubjectById(subjectId) {
    return new Promise((resolve, reject) => {
        con.query(`select * from erp_courses_subjects where subjectId=?`, [subjectId], (err, result) => {
            resolve(result[0])
        })
    })
}

//Get Single Subject Detials
router.get("/subjects/:subjectId", (req, res) => {
    let subjectId = req.params.subjectId
    con.query(`select subjectId,subject,courseId,image,substr(folderPath,16) folderPath from erp_courses_subjects where subjectId=?`, [subjectId], (err, result) => {
        res.send(result[0])
    })
})

//Delete Subject
router.delete("/subject/:subjectId", async (req, res) => {
    let subjectId = req.params.subjectId
    let subjectDB = await getSubjectById(subjectId)
    if (fs.existsSync(subjectDB.folderPath)) {
        rimraf(subjectDB.folderPath, () => { })
    }

    con.query(`delete from erp_courses_subjects where subjectId = ?`, [subjectId], (err, result) => {
        if (err) {
            return res.status(500).end(err.message)
        }
        res.send({ success: result.affectedRows > 0, message: "Subject Deleted Successfully" })
    })
})

//Add Chapter in Subjects
router.post("/subject/:subjectId/chapter", async (req, res) => {
    const subjectId = req.params.subjectId
    const chapter = req.body.chapter

    const subjectDB = await new Promise(resolve => {
        con.query(`select folderPath from erp_courses_subjects where subjectId=? `, [subjectId], (err, result) => {
            resolve(result[0])
        })
    })

    const folderPath = subjectDB.folderPath + getFormattedName(chapter)

    con.query(`insert into erp_subjects_chapters(subjectId,chapter,folderPath) values(?) `, [[subjectId, chapter, folderPath + "/"]], (err, result) => {

        if (err) {
            return res.status(500).end(err.message)
        }

        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath)
        }

        res.send({ success: true, message: "Chapter Added Successfully" })
    })
})

//Update chapter
router.post("/chapter", async (req, res) => {
    let data = req.body

    const chapterDB = await new Promise(resolve => {
        con.query(`select folderPath,chapter from erp_subjects_chapters where chapterId=?`, [data.chapterId], (err, result) => {
            resolve(result[0])
        })
    })

    let newFolderName = getFormattedName(data.chapter)
    let oldFolderName = getFormattedName(chapterDB.chapter)
    let newFolderPath = chapterDB.folderPath.replace(oldFolderName, newFolderName)

    if (fs.existsSync(chapterDB.folderPath)) {
        fs.renameSync(chapterDB.folderPath, newFolderPath, err => {
            console.log(err)
        })
    }

    con.query(`update erp_subjects_chapters set chapter=?,folderPath=? where chapterId=?`, [data.chapter, newFolderPath, data.chapterId], (err, result) => {

        if (err) {
            return res.status(500).end(err.message)
        }

        res.send({ success: true, message: "Chapter Updated Successfully" })
    })
})

// get chapters by subjectId
router.get("/subject/:subjectId/chapters", (req, res) => {
    const subjectId = req.params.subjectId
    con.query(`select * from erp_subjects_chapters where subjectId=? order by orderNo asc`, [subjectId], (err, result) => {
        err ? res.status(500).end(err.message) : res.send(result)
    })
})

//Delete Chapter
router.delete("/chapter/:chapterId", async (req, res) => {

    const chapterDB = await new Promise(resolve => {
        con.query(`select folderPath from erp_subjects_chapters where chapterId=?`, [req.params.chapterId], (err, result) => {
            resolve(result[0])
        })
    })

    con.query(`delete from erp_subjects_chapters where chapterId=? `, [req.params.chapterId], (err, result) => {

        if (err) {
            return res.status(500).end(err.message)
        }

        if (fs.existsSync(chapterDB.folderPath)) {
            rimraf(chapterDB.folderPath, () => null)
        }

        res.send({ success: result.affectedRows > 0 })
    })
})

//Add Topic Under Chapter
router.post("/topic", async (req, res) => {

    let data = req.body
    let chapterDB = await getChapterById(data.chapterId)

    let topicImage = null
    let topicImagePath = null

    const folderPath = chapterDB.folderPath

    if (req.files != null) {

        if (req.files.topicImage) {
            topicImage = req.files.topicImage
            let fileExtension = topicImage.name.split(".").pop()
            let fileName = getFormattedName(req.body.topic)
            let imagePath = "" + fileName + "." + fileExtension

            if (fs.existsSync(folderPath + imagePath)) {
                imagePath = getRenamedFileName(folderPath, imagePath)
            }

            topicImagePath = imagePath
        }
    }
    const chapterData = [
        data.chapterId,
        data.topic,
        data.testCode,
        data.videoId,
        data.platform,
        topicImagePath
    ]
    con.query(`insert into erp_chapters_topics(chapterId,topic,testCode,videoId,platform,image) values(?)`, [chapterData], (err, result) => {
        if (err) {
            return res.status(500).end(err.message)
        }

        if (topicImage) {
            topicImage.mv(folderPath + topicImagePath, err => {
                if (err) {
                    console.log(err)
                }
            })
        }

        res.send({ success: true, message: "Topic Added Successfully" })

    })

})

//Get Topics by chapterId
router.get("/chapter/:chapterId/topics", async (req, res) => {
    const chapterId = req.params.chapterId
    con.query(`select ect.topicId,ect.testCode,ect.videoId,ect.platform,ect.topic,concat(substring(esc.folderPath,16),ect.image) as image from erp_chapters_topics ect inner join erp_subjects_chapters esc on ect.chapterId=esc.chapterId where ect.chapterId=? order by ect.orderNo asc`, [chapterId], (err, result) => {
        if (err) {
            return res.status(500).end(err.message)
        }
        res.send(result)
    })
})

//Update topic
router.post("/topic/update", async (req, res) => {
    let data = req.body
    const topicDB = await getTopicById(data.topicId)
    const chapterDB = await getChapterById(topicDB.chapterId)

    if (req.files && req.files.topicImage) {
        if (fs.existsSync(chapterDB.folderPath + topicDB.image)) {
            fs.unlinkSync(chapterDB.folderPath + topicDB.image)
        }
    }

    let topicImage = null
    let topicImagePath = topicDB.image

    if (req.files != null) {

        if (req.files.topicImage) {
            topicImage = req.files.topicImage
            let fileExtension = topicImage.name.split(".").pop()
            let fileName = getFormattedName(data.topic)
            let imagePath = "" + fileName + "." + fileExtension

            if (fs.existsSync(chapterDB.folderPath + imagePath)) {
                imagePath = getRenamedFileName(chapterDB.folderPath, imagePath)
            }

            topicImagePath = imagePath
        }
    }
    const updateData = [
        data.topic,
        data.testCode,
        data.videoId,
        data.platform,
        topicImagePath,
        data.topicId
    ]
    con.query(`update erp_chapters_topics set topic=?,testCode=?,videoId=?,platform=?,image=? where topicId=?`, updateData, (err, result) => {

        if (err) {
            return res.status(500).end(err.message)
        }

        if (topicImage) {
            topicImage.mv(chapterDB.folderPath + topicImagePath, err => {
                if (err) {
                    console.log(err)
                }
            })
        }

        res.send({ success: result.changedRows > 0, message: "Topic Updated Successfully" })

    })
})

//delete Topic
router.delete("/topic/:topicId", async (req, res) => {
    const topicId = req.params.topicId
    const topicDB = await getTopicById(topicId)
    const chapterDB = await getChapterById(topicDB.chapterId)

    if (fs.existsSync(chapterDB.folderPath + topicDB.image)) {
        fs.unlinkSync(chapterDB.folderPath + topicDB.image)
    }

    con.query(`delete from erp_chapters_topics where topicId=?`, [topicId], (err, result) => {
        if (err) {
            return res.status(500).end(err.message)
        }
        res.send({ success: result.affectedRows > 0 })
    })

})

function getChaptersBySubjectId(subjectId) {
    return new Promise(resolve => {
        con.query(`select * from erp_subjects_chapters where subjectId=? order by orderNo asc`, [subjectId], (err, result) => {
            resolve(result)
        })
    })
}

function isPassedTopicTest(userId, testId) {
    return new Promise((resolve, reject) => {
        con.query(`select marks_obtained,total_marks from done_tests where user_id=? and test_id=? order by id desc limit 1`, [userId, testId], (err, result) => {

            if (err) {
                return reject(err.message)
            }

            if (result.length > 0) {
                const marks = result[0].marks_obtained
                const total = result[0].total_marks
                const percentage = (marks / total) * 100

                return resolve(percentage >= 75)
            }
            resolve(false)
        })
    })
}

function isTopicTestFinished(userId, testId) {
    return new Promise((resolve, reject) => {
        con.query(`select ifnull((SELECT ifnull(json_length(json_extract(t.questions,'$'))=json_length(json_extract(dt.test_data,'$.answerData')),0) isDone FROM test t left join done_tests dt on dt.test_id=t.id where t.id=? and dt.user_id=?),0) isDone`, [testId, userId], (err, result) => {
            resolve(result[0].isDone)
        })
    })
}

function getAllTopics(userId) {
    return new Promise(resolve => {
        con.query(`SELECT ect.topicId,ect.chapterId,ect.topic,ect.testCode,concat(substring(esc.folderPath,16),ect.image) image
         FROM erp_chapters_topics ect inner join erp_subjects_chapters esc on ect.chapterId=esc.chapterId order by ect.orderNo asc`, async (err, result) => {


            for (let i = 0; i < result.length; i++) {
                let topicTestResult = await isTopicTestFinished(userId, result[i].testCode)
                result[i].topicResult = topicTestResult
            }

            resolve(result)
        })
    })
}

//Get Chapters Along With Topics
router.get("/subject/:subjectId/chapters-topics", async (req, res) => {
    const subjectId = req.params.subjectId
    const chapters = await getChaptersBySubjectId(subjectId)
    const topics = await getAllTopics(res.locals.userId)

    if (chapters.constructor.name == "Array") {
        chapters.forEach(chapter => {
            const chapterTopics = topics.filter(t => t.chapterId == chapter.chapterId)
            chapterTopics.push({
                chapterId: chapter.chapterId,
                topic: 'Practice',
                type: 'practice',
                image: 'eduotics-users/assets/images/subjects-home/practice.svg'
            })
            chapterTopics.push({
                chapterId: chapter.chapterId,
                topic: 'Test',
                type: 'test',
                image: 'eduotics-users/assets/images/subjects-home/test.svg'
            })
            chapter.topics = chapterTopics
        })
    }

    else {
        chapters = []
    }

    res.send(chapters)
})


//Get Subject,Chapter and Topic Details in One
router.get("/subject/:subjectId/chapter/:chapterId/topic/:topicId", async (req, res) => {
    const subjectId = req.params.subjectId
    const chapterId = req.params.chapterId
    const topicId = req.params.topicId

    const subject = await new Promise(resolve => {
        con.query(`select subjectId,subject,courseId,substring(folderPath,16) folderPath,image from erp_courses_subjects where subjectId=? `, [subjectId], (err, result) => {
            resolve(result[0])
        })
    })
    const chapter = await new Promise(resolve => {
        con.query(`SELECT chapterId,subjectId,chapter,substring(folderPath,16) folderPath FROM erp_subjects_chapters
         where chapterId=?`, [chapterId], (err, result) => {
            resolve(result[0])
        })
    })
    const topic = await getTopicById(topicId)
    res.send({ subject, chapter, topic })
})

//Get Subject and Chapter in One
router.get("/subject/:subjectId/chapter/:chapterId", async (req, res) => {
    const subjectId = req.params.subjectId
    const chapterId = req.params.chapterId
    const subject = await getSubjectById(subjectId)
    const chapter = await new Promise(resolve => {
        con.query(`SELECT chapterId,subjectId,chapter,substring(folderPath,16) folderPath FROM erp_subjects_chapters
         where chapterId=?`, [chapterId], (err, result) => {
            resolve(result[0])
        })
    })

    res.send({ subject, chapter })
})

//Get Chapter By Id
router.get("/chapter/:chapterId", async (req, res) => {
    let chapter = await getChapterById(req.params.chapterId)
    res.send(chapter)
})

//Get Chapter Practice Tests status
router.get("/chapter/:chapterId/practice-tests-status", (req, res) => {
    const chapterId = req.params.chapterId
    const userId = res.locals.userId
    con.query(`SELECT * FROM erp_subjects_chapters where chapterId=?`, [chapterId], async (err, result) => {
        if (err) {
            return res.status(500).end(err.message)
        }

        let testCode_Status = {
            level1: { testCode: result[0].practiceLevel1TestCode, status: await isPassedTopicTest(userId, result[0].practiceLevel1TestCode) },
            level2: { testCode: result[0].practiceLevel2TestCode, status: await isPassedTopicTest(userId, result[0].practiceLevel2TestCode) },
            level3: { testCode: result[0].practiceLevel3TestCode, status: await isPassedTopicTest(userId, result[0].practiceLevel3TestCode) },
            level4: { testCode: result[0].practiceLevel4TestCode, status: await isPassedTopicTest(userId, result[0].practiceLevel4TestCode) },
        }
        // testCode_Status.level1.status = false
        //  testCode_Status.level2.status = true
        //  testCode_Status.level3.status = true
        //  testCode_Status.level4.status = true

        res.send(testCode_Status)
    })
})

//Get First Topic By chapterId
router.get("/chapter/:chapterId/first-topic", (req, res) => {
    const chapterId = req.params.chapterId
    con.query(`SELECT * FROM erp_chapters_topics WHERE chapterId=? order by topicId asc limit 1`, [chapterId], (err, result) => {
        if (err) {
            return res.status(500).end(err.message)
        }

        res.send(result[0])
    })
})

//Sort Chapters
router.put("/sort-chapters", (req, res) => {
    let chapters = req.body.chapters

    if (chapters.constructor.name == "Array") {
        chapters.forEach((chapter, index) => {
            con.query(`update erp_subjects_chapters set orderNo=${index} where chapterId=${chapter.chapterId}`)
        })
    }

    res.send({ success: true, message: "Sorting Chapters" })
})

//Sort Chapters
router.put("/sort-topics", (req, res) => {
    let topics = req.body.topics

    if (topics.constructor.name == "Array") {
        topics.forEach((topic, index) => {
            con.query(`update erp_chapters_topics set orderNo=${index} where topicId=${topic.topicId}`)
        })
    }

    res.send({ success: true, message: "Sorting Topics" })
})

//Get Test Types
router.get("/test-types", (req, res) => {
    con.query(`select * from erp_chapters_tests_types`, (err, result) => {
        if (err) {
            return res.status(500).end(err.message)
        }
        res.send(result)
    })
})

// Add Test Under Chapters
router.post(`/chapter/:chapterId/test`, (req, res) => {
    const chapterId = req.params.chapterId
    const testData = req.body
    const insertData = [
        chapterId,
        testData.testName,
        testData.testTypeId,
        testData.testCode
    ]
    con.query(`insert into erp_chapters_tests(chapterId,testName,testTypeId,testCode) values(?)`, [insertData], (err, result) => {
        if (err) {
            return res.status(500).end(err.message)
        }
        res.send({ success: true, message: "Test added successfully" })
    })
})

// Set Practice test in Chapter
router.put(`/chapter/:chapterId/set-practice-test`, async (req, res) => {
    const chapterId = req.params.chapterId
    let sql = "update erp_subjects_chapters set practiceLevel1TestCode=?,practiceLevel2TestCode=?,practiceLevel3TestCode=?,practiceLevel4TestCode=? where chapterId=? ";

    const data = [
        req.body.practiceLevel1TestCode,
        req.body.practiceLevel2TestCode,
        req.body.practiceLevel3TestCode,
        req.body.practiceLevel4TestCode,
        chapterId
    ]

    con.query(sql, data, (err, result) => {
        if (err) {
            return res.status(500).end(err.message)
        }
        res.send({ success: true, message: "Practice Test Set successfully" })
    })
})


//Get Tests in Chapter
router.get('/chapter/:chapterId/tests', (req, res) => {
    const chapterId = req.params.chapterId
    const userId = res.locals.userId
    con.query(`select ect.*,ectt.testType,dt.id as isDone from erp_chapters_tests ect left join erp_chapters_tests_types ectt on ectt.testTypeId=ect.testTypeId left join done_tests dt on dt.test_id=ect.testCode and dt.user_id=? and dt.status=1 where ect.chapterId=?`, [userId, chapterId], (err, result) => {
        if (err) {
            return res.status(500).end(err.message)
        }
        res.send(result)
    })
})

//update Test
router.put('/test', (req, res) => {
    const test = req.body
    const updateData = [
        test.testName,
        test.testCode,
        test.testTypeId,
        test.testId
    ]
    con.query(`update erp_chapters_tests set testName=?,testCode=?,testTypeId=? where testId=?`, updateData, (err, result) => {
        if (err) {
            return res.status(500).end(err.message)
        }
        res.send({ success: result.changedRows > 0, message: "Test updated Successfully" })
    })
})

//Delete Test
router.delete("/test/:testId", (req, res) => {
    const testId = req.params.testId
    con.query(`delete from erp_chapters_tests where testId=?`, [testId], (err, result) => {
        if (err) {
            return res.status(500).end(err.message)
        }
        res.send({ success: result.affectedRows > 0 })
    })
})

// Get Test By Id
router.get("/test/:testId", (req, res) => {
    const testId = req.params.testId
    con.query(`select * from erp_chapters_tests where testId=?`, [testId], (err, result) => {
        if (err) {
            return res.status(500).end(err.message)
        }
        res.send(result[0])
    })
})

// Get Subject Wise Data
router.get("/test/:testId/subject-wise-data", (req, res) => {
    const userId = res.locals.userId
    const testId = req.params.testId
    con.query(`select subject_wise_data from done_tests where user_id=? and test_id=?`, [userId, testId], (err, result) => {
        if (err) {
            return res.status(500).end(err.message)
        }

        res.send(JSON.parse(result[0].subject_wise_data))
    })
})

// Get Question Wise Data
router.get("/test/:testId/question-wise-data", (req, res) => {
    const userId = res.locals.userId
    const testId = req.params.testId
    con.query(`select question_wise_data from done_tests where user_id=? and test_id=?`, [userId, testId], (err, result) => {

        if (err) {
            return res.status(500).end(err.message)
        }

        res.send(JSON.parse(result[0].question_wise_data))
    })
})

//Get Skills Strength
router.get("/test/:testId/skills-strength", async (req, res) => {
    const userId = res.locals.userId
    const testId = req.params.testId
    const questionWiseData = await new Promise((resolve) => {
        con.query(`select question_wise_data from done_tests where user_id=? and test_id=?`, [userId, testId], (err, result) => {
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

async function getTestIdsByChapterId(chapterId) {
    return new Promise((resolve, reject) => {
        con.query(`SELECT json_array(practiceLevel1TestCode,practiceLevel2TestCode,practiceLevel3TestCode,practiceLevel4TestCode) as testIds FROM erp_subjects_chapters where chapterId=?`, [chapterId], (err, result) => {
            err ? reject(err) : resolve(JSON.parse(result[0].testIds))
        })
    })
}

//Get Skills Strength of Multiple tests
router.get("/chapters/:chapterId/skills-strength-multiple", async (req, res) => {
    const userId = res.locals.userId

    const MEMORY = 1
    const CONCEPTUAL = 2
    const APPLICATION = 3

    let totalMemoryQuestions = 0;
    let totalConceptualQuestions = 0;
    let totalApplicationQuestions = 0;

    let totalMemoryCorrectQuestions = 0;
    let totalConceptualCorrectQuestions = 0;
    let totalApplicationCorrectQuestions = 0;

    let testIds = await getTestIdsByChapterId(req.params.chapterId)

    con.query(`select question_wise_data from done_tests where user_id=? and test_id in(?) and status=1 and id in (select max(id) from done_tests where test_id in(?) group by test_id )`, [userId, testIds, testIds], (err, result) => {

        for (let i = 0; i < result.length; i++) {
            let questionWiseData = JSON.parse(result[i].question_wise_data)

            totalMemoryQuestions += questionWiseData.filter(q => q.questionTaggingId == MEMORY).length
            totalConceptualQuestions += questionWiseData.filter(q => q.questionTaggingId == CONCEPTUAL).length
            totalApplicationQuestions += questionWiseData.filter(q => q.questionTaggingId == APPLICATION).length

            totalMemoryCorrectQuestions += questionWiseData.filter(q => q.questionTaggingId == MEMORY && q.status == 'C').length
            totalConceptualCorrectQuestions += questionWiseData.filter(q => q.questionTaggingId == CONCEPTUAL && q.status == 'C').length
            totalApplicationCorrectQuestions += questionWiseData.filter(q => q.questionTaggingId == APPLICATION && q.status == 'C').length
        }

        const memoryPercentage = +((totalMemoryCorrectQuestions / totalMemoryQuestions) * 100).toFixed(2)
        const conceptualPercentage = +((totalConceptualCorrectQuestions / totalConceptualQuestions) * 100).toFixed(2)
        const applicationPercentage = +((totalApplicationCorrectQuestions / totalApplicationQuestions) * 100).toFixed(2)

        res.send({ memoryPercentage, conceptualPercentage, applicationPercentage })
    })
})


/* Get Performance Analysys multiple */
router.get("/chapters/:chapterId/performance-analysis-multiple", async (req, res) => {
    const userId = res.locals.userId
    const chapterId = req.params.chapterId
    const testIds = await getTestIdsByChapterId(chapterId)

    const EASY = 1
    const MEDIUM = 2
    const HARD = 3


    let totalEasyQuestions = 0;
    let totalMediumQuestions = 0;
    let totalHardQuestions = 0;

    let totalEasyCorrectQuestions = 0;
    let totalEasyWrongQuestions = 0;
    let totalEasyUnAnsweredQuestions = 0;

    let totalMediumCorrectQuestions = 0;
    let totalMediumWrongQuestions = 0;
    let totalMediumUnAnsweredQuestions = 0;

    let totalHardCorrectQuestions = 0;
    let totalHardWrongQuestions = 0;
    let totalHardUnAnsweredQuestions = 0;

    con.query(`SELECT question_wise_data FROM done_tests where user_id=? and test_id in (?) and id in (select max(id) from done_tests where test_id in (?) group by test_id)
        `, [userId, testIds, testIds], (err, result) => {


        for (let i = 0; i < result.length; i++) {
            let questionWiseData = JSON.parse(result[i].question_wise_data)
            if (questionWiseData == null) {
                continue;
            }

            totalEasyQuestions += questionWiseData.filter(q => q.difficultyLevelId == EASY).length
            totalMediumQuestions += questionWiseData.filter(q => q.difficultyLevelId == MEDIUM).length
            totalHardQuestions += questionWiseData.filter(q => q.difficultyLevelId == HARD).length

            totalEasyCorrectQuestions += questionWiseData.filter(q => q.difficultyLevelId == EASY && q.status == 'C').length
            totalEasyWrongQuestions += questionWiseData.filter(q => q.difficultyLevelId == EASY && q.status == 'W').length
            totalEasyUnAnsweredQuestions += questionWiseData.filter(q => q.difficultyLevelId == EASY && q.status == 'S').length

            totalMediumCorrectQuestions += questionWiseData.filter(q => q.difficultyLevelId == MEDIUM && q.status == 'C').length
            totalMediumWrongQuestions += questionWiseData.filter(q => q.difficultyLevelId == MEDIUM && q.status == 'W').length
            totalMediumUnAnsweredQuestions += questionWiseData.filter(q => q.difficultyLevelId == MEDIUM && q.status == 'S').length

            totalHardCorrectQuestions += questionWiseData.filter(q => q.difficultyLevelId == HARD && q.status == 'C').length
            totalHardWrongQuestions += questionWiseData.filter(q => q.difficultyLevelId == HARD && q.status == 'W').length
            totalHardUnAnsweredQuestions += questionWiseData.filter(q => q.difficultyLevelId == HARD && q.status == 'S').length
        }

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

})

//Get Performance Analysike Easy Medium Hard
router.get("/test/:testId/performance-analysis", async (req, res) => {
    const userId = res.locals.userId
    const testId = req.params.testId
    const questionWiseData = await new Promise((resolve) => {
        con.query(`select question_wise_data from done_tests where user_id=? and test_id=?`, [userId, testId], (err, result) => {
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

// Get Correct Questions and Time and Avg Time
router.get("/test/:testId/questions-time-avg-time", async (req, res) => {
    const testId = req.params.testId

    const totalDuration = await new Promise((resolve) => {
        con.query(`select duration*60 as duration from test where id=?`, [testId], (err, result) => {
            resolve(result[0].duration)
        })
    })

    con.query(`select * from done_tests where test_id=?`, [testId], (err, result) => {

        if (err) {
            return res.status(500).end(err.message)
        }

        const questionWiseData = JSON.parse(result[0].question_wise_data)

        const correctQuestions = questionWiseData.filter(q => q.status == 'C').length
        const totalQuestions = questionWiseData.length
        const correctQuestionsPercentage = +((correctQuestions / totalQuestions) * 100).toFixed(2)

        const timePercentage = +((result[0].time_spend / totalDuration) * 100).toFixed(2)
        const avgTime = result[0].time_spend / questionWiseData.length

        res.send({ correctQuestionsPercentage, timePercentage, avgTime })

    })
})

// Get Correct Questions and Time and Avg Time of Multiple tests
router.get("/chapters/:chapterId/questions-time-avg-time-multiple", async (req, res) => {
    const chapterId = req.params.chapterId

    let testIds = await getTestIdsByChapterId(chapterId)

    con.query(`select time_spend,test_id,question_wise_data from done_tests where test_id in(?) and status=1 and id in (select max(id) from done_tests where test_id in (?) group by test_id )`, [testIds, testIds], async (err, result) => {

        if (err) {
            return res.status(500).end(err.message)
        }

        let correctQuestions = 0;
        let totalQuestions = 0;
        let timeSpend = 0
        let totalDuration = 0

        for (let i = 0; i < result.length; i++) {

            totalDuration += await new Promise((resolve) => {
                con.query(`select duration*60 as duration from test where id=?`, [result[i].test_id], (err, result) => {
                    resolve(result[0].duration)
                })
            })

            questionWiseData = JSON.parse(result[i].question_wise_data)

            correctQuestions += questionWiseData.filter(q => q.status == 'C').length
            totalQuestions += questionWiseData.length
            timeSpend += +result[i].time_spend

        }

        let correctQuestionsPercentage = +((correctQuestions / totalQuestions) * 100).toFixed(2)
        let timePercentage = +((timeSpend / totalDuration) * 100).toFixed(2)
        let avgTime = +(timeSpend / totalQuestions).toFixed(2)

        res.send({ correctQuestionsPercentage, timePercentage, avgTime })

    })
})



// Report Issue
router.post("/report-issue", (req, res) => {
    const data = req.body
    const questionId = data.questionId
    const issueTypeId = data.issueTypeId
    const content = data.content
    const userId = res.locals.userId
    const insertData = [
        questionId,
        content,
        userId,
        issueTypeId
    ]
    con.query(`insert into issues(questionId,content,userId,issueTypeId) values(?)`, [insertData], (err, result) => {
        if (err) {
            return res.status(500).end(err.message)
        }
        res.send({ success: result.affectedRows > 0 })
    })
})


//Get Reported ISSues
router.get("/reported-issues", (req, res) => {
    con.query(`SELECT i.issueId,i.content,i.reply,i.questionId,date_format(datetime,'%d-%b-%y') as date,it.issueType,es.name FROM issues i inner join issue_types it on it.issueTypeId=i.issueTypeId inner join erp_students es on es.studentId=i.userId order by i.issueId desc`, (err, result) => {
        if (err) {
            return res.status(500).end(err.message)
        }
        res.send(result)
    })
})

// Reply To Issue
router.post("/reply-to-issue", (req, res) => {
    const data = req.body
    const reply = data.reply
    const issueId = data.issueId

    con.query(`update issues set reply=? where issueId=?`, [reply, issueId], (err, result) => {

        if (err) {
            return res.status(500).end(err.message)
        }

        res.send({ success: true })

    })
})

//export this router to use in our index.js
module.exports = router;