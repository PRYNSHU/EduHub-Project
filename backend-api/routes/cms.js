const express = require('express')
const router = express.Router()
const con = require("../db")
const fs = require("fs")

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


async function getCMSByIdAndTable(id, table) {
    return new Promise(resolve => {
        con.query(`select * from ${table} where id=?`, [id], (err, result) => {
            resolve(result[0])
        })
    })
}

// Change CMS Status (Toggle CMS)
router.put("/change-status", (req, res) => {
    const section = req.body.section
    const status = req.body.status

    con.query(`update cms_toggle set status=? where section=?`, [status, section], (err, result) => {

        if (err) {
            return res.status(500).end(err.message)
        }

        res.send({ success: result.changedRows > 0 })

    })
})

//get CMS Status (toggle Status)
router.get("/cms-status/:section", (req, res) => {
    const section = req.params.section

    con.query(`select status from cms_toggle where section=?`, [section], (err, result) => {

        if (err) {
            return res.status(500).end(err.message)
        }

        res.send(result[0])

    })
})


//Get All Slideshows
router.get('/slideshow', (req, res) => {
    con.query(`select * from cms_slideshow order by id desc`, (err, result) => {
        res.send(result)
    })
})

//Upload New Slideshow
router.post('/slideshow', (req, res) => {

    if (!req.files) {
        return res.send({ success: false, message: "Please Choosed Image" })
    }

    let data = req.body
    let image = null
    let imagePath = null
    const folderPath = "../public_html/assets/images/hero/"

    if (req.files != null) {
        image = req.files.image
        let fileExtension = image.name.split(".").pop()
        let fileName = data.title.trim().toLowerCase().replace(/['"]+/g, '').split(" ").join("-")
        imagePath = "" + fileName + "." + fileExtension

        if (fs.existsSync(folderPath + imagePath)) {
            imagePath = getRenamedFileName(folderPath, imagePath)
        }
    }

    let slideshow = [data.title, data.description, data.buttonText, data.buttonLink, imagePath]
    slideshow = slideshow.map(s => s.trim())
    con.query(`insert into cms_slideshow (title,description,buttonText,buttonLink,imagePath) values(?) `, [slideshow], (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        if (image) {
            image.mv(folderPath + imagePath, err => {

                if (err) {
                    return res.send({ success: false, message: "Error while saving file" })
                }

            })
        }

        res.send({
            slideshow: {
                id: result.insertId,
                imagePath,
                ...data
            },
            success: true,
            message: "Slideshow Uploaded Successfully"
        })

    })

})

// Update Slideshow
router.post("/slideshow/update", async (req, res) => {

    let data = req.body

    let slideshowData = await getCMSByIdAndTable(data.id, "cms_slideshow")
    let image = null
    let imagePath = slideshowData.imagePath
    const folderPath = "../public_html/assets/images/hero/"

    if (req.files != null) {
        image = req.files.image
        let fileExtension = image.name.split(".").pop()
        let fileName = data.title.trim().toLowerCase().replace(/['"]+/g, '').split(" ").join("-")
        imagePath = "" + fileName + "." + fileExtension

        if (fs.existsSync(folderPath + slideshowData.imagePath) && slideshowData.imagePath) {
            fs.unlinkSync(folderPath + slideshowData.imagePath)
        }

        if (fs.existsSync(folderPath + imagePath)) {
            imagePath = getRenamedFileName(folderPath, imagePath)
        }
    }

    let slideshow = [data.title, data.description, data.buttonText, data.buttonLink, imagePath, data.id]

    con.query(`update cms_slideshow set title=?,description=?,buttonText=?,buttonLink=?,imagePath=? where id=? `, slideshow,
        async (err, result) => {

            if (err) {
                return res.status(500).end(err.sqlMessage)
            }

            if (image) {
                image.mv(folderPath + imagePath, err => {

                    if (err) {
                        return res.send({ success: false, message: "Error while saving file" })
                    }

                })
            }

            res.send({ success: true, message: "Slideshow Updated Successfully" })
        })
})


//Delete Slideshow
router.delete("/slideshow/:id", async (req, res) => {

    let slideshow = await getCMSByIdAndTable(req.params.id, "cms_slideshow")

    con.query(`delete from cms_slideshow where id=? `, [req.params.id], (err, result) => {

        if (err) {
            return res.send({ message: err.sqlMessage })
        }

        const folderPath = "../public_html/assets/images/hero/"

        if (fs.existsSync(folderPath + slideshow.imagePath) && slideshow.imagePath) {
            fs.unlinkSync(folderPath + slideshow.imagePath)
        }

        res.send({ success: result.affectedRows > 0 })
    })
})



//Get All Results
router.get('/results', (req, res) => {
    con.query(`select * from cms_results order by id desc`, (err, result) => {
        res.send(result)
    })
})

//Upload New Result
router.post('/result', (req, res) => {

    if (!req.files) {
        return res.send({ success: false, message: "Please Choosed Image" })
    }

    let data = req.body
    let image = null
    let imagePath = null
    const folderPath = "../public_html/uploads/results/"

    if (req.files != null) {
        image = req.files.image
        let fileExtension = image.name.split(".").pop()
        let fileName = data.name.trim().toLowerCase().replace(/['"]+/g, '').split(" ").join("-")
        imagePath = "" + fileName + "." + fileExtension

        if (fs.existsSync(folderPath + imagePath)) {
            imagePath = getRenamedFileName(folderPath, imagePath)
        }
    }

    let result = [data.name, data.classdetails, data.marks, data.category, imagePath]
    result = result.map(s => s.trim())
    con.query(`insert into cms_results (name,classdetails,marks,category,image) values(?) `, [result], (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        if (image) {
            image.mv(folderPath + imagePath, err => {

                if (err) {
                    return res.send({ success: false, message: "Error while saving file" })
                }

            })
        }

        res.send({
            result: {
                id: result.insertId,
                image: imagePath,
                ...data
            },
            success: true,
            message: "Result Uploaded Successfully"
        })

    })

})



// Update Result
router.post("/result/update", async (req, res) => {

    let data = req.body

    let resultsData = await getCMSByIdAndTable(data.id, "cms_results")
    let image = null
    let imagePath = resultsData.image
    const folderPath = "../public_html/uploads/results/"

    if (req.files != null) {
        image = req.files.image
        let fileExtension = image.name.split(".").pop()
        let fileName = data.name.trim().toLowerCase().replace(/['"]+/g, '').split(" ").join("-")
        imagePath = "" + fileName + "." + fileExtension

        if (fs.existsSync(folderPath + resultsData.image) && resultsData.image) {
            fs.unlinkSync(folderPath + resultsData.image)
        }

        if (fs.existsSync(folderPath + imagePath)) {
            imagePath = getRenamedFileName(folderPath, imagePath)
        }
    }

    let result = [data.name, data.classdetails, data.marks, data.category, imagePath, data.id]

    con.query(`update cms_results set name=?,classdetails=?,marks=?,category=?,image=? where id=? `, result,
        async (err, result) => {

            if (err) {
                return res.status(500).end(err.sqlMessage)
            }

            if (image) {
                image.mv(folderPath + imagePath, err => {

                    if (err) {
                        return res.send({ success: false, message: "Error while file saving" })
                    }

                })
            }

            res.send({ success: true, message: "Result Updated Successfully" })
        })
})


//Delete Result
router.delete("/result/:id", async (req, res) => {

    let resultData = await getCMSByIdAndTable(req.params.id, "cms_results")

    con.query(`delete from cms_results where id=? `, [req.params.id], (err, result) => {

        if (err) {
            return res.send({ message: err.sqlMessage })
        }

        const folderPath = "../public_html/uploads/results/"

        if (fs.existsSync(folderPath + resultData.image) && resultData.image) {
            fs.unlinkSync(folderPath + resultData.image)
        }

        res.send({ success: result.affectedRows > 0 })
    })
})

//Get All Statistics
router.get('/statistics', (req, res) => {
    con.query(`select * from cms_statistics order by id desc`, (err, result) => {
        res.send(result)
    })
})

//Upload New Statistics
router.post('/statistics', (req, res) => {

    if (!req.files) {
        return res.send({ success: false, message: "Please Choosed Image" })
    }

    let data = req.body
    let image = null
    let imagePath = null
    const folderPath = "../public_html/assets/images/statistics/"

    if (req.files != null) {
        image = req.files.image
        let fileExtension = image.name.split(".").pop()
        let fileName = data.title.trim().toLowerCase().replace(/['"]+/g, '').split(" ").join("-")
        imagePath = "" + fileName + "." + fileExtension

        if (fs.existsSync(folderPath + imagePath)) {
            imagePath = getRenamedFileName(folderPath, imagePath)
        }
    }

    let statistic = [data.title, data.value, imagePath]
    statistic = statistic.map(s => s.trim())
    con.query(`insert into cms_statistics (title,value,imagePath) values(?) `, [statistic], (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        if (image) {
            image.mv(folderPath + imagePath, err => {

                if (err) {
                    return res.send({ success: false, message: "Error while saving file" })
                }

            })
        }

        res.send({
            statistic: {
                id: result.insertId,
                imagePath,
                ...data
            },
            success: true,
            message: "Statistic Uploaded Successfully"
        })

    })

})



// Update Statistic
router.post("/statistics/update", async (req, res) => {

    let data = req.body

    let statisticData = await getCMSByIdAndTable(data.id, "cms_statistics")
    let image = null
    let imagePath = statisticData.imagePath
    const folderPath = "../public_html/assets/images/statistics/"

    if (req.files != null) {
        image = req.files.image
        let fileExtension = image.name.split(".").pop()
        let fileName = data.title.trim().toLowerCase().replace(/['"]+/g, '').split(" ").join("-")
        imagePath = "" + fileName + "." + fileExtension

        if (fs.existsSync(folderPath + statisticData.imagePath) && statisticData.imagePath) {
            fs.unlinkSync(folderPath + statisticData.imagePath)
        }

        if (fs.existsSync(folderPath + imagePath)) {
            imagePath = getRenamedFileName(folderPath, imagePath)
        }
    }

    let statistic = [data.title, data.value, imagePath, data.id]

    con.query(`update cms_statistics set title=?,value=?,imagePath=? where id=? `, statistic,
        async (err, result) => {

            if (err) {
                return res.status(500).end(err.sqlMessage)
            }

            if (image) {
                image.mv(folderPath + imagePath, err => {

                    if (err) {
                        return res.send({ success: false, message: "Error while file saving" })
                    }

                })
            }

            res.send({ success: true, message: "Statistic Updated Successfully" })
        })
})


//Delete Statistic
router.delete("/statistics/:id", async (req, res) => {

    let statistic = await getCMSByIdAndTable(req.params.id, "cms_statistics")

    con.query(`delete from cms_statistics where id=? `, [req.params.id], (err, result) => {

        if (err) {
            return res.send({ message: err.sqlMessage })
        }

        const folderPath = "../public_html/assets/images/statistics/"

        if (fs.existsSync(folderPath + statistic.imagePath) && statistic.imagePath) {
            fs.unlinkSync(folderPath + statistic.imagePath)
        }

        res.send({ success: result.affectedRows > 0 })
    })
})

//Get All Value Added Features
router.get('/value-added-features', (req, res) => {
    con.query(`select * from cms_value_added_features order by id desc`, (err, result) => {
        res.send(result)
    })
})

//Upload New Value Added Fetaure
router.post('/value-added-features', (req, res) => {

    if (!req.files) {
        return res.send({ success: false, message: "Please Choosed Image" })
    }

    let data = req.body
    let image = null
    let imagePath = null
    const folderPath = "../public_html/assets/images/value-added-features/"

    if (req.files != null) {
        image = req.files.image
        let fileExtension = image.name.split(".").pop()
        let fileName = data.title.trim().toLowerCase().replace(/['"]+/g, '').split(" ").join("-")
        imagePath = "" + fileName + "." + fileExtension

        if (fs.existsSync(folderPath + imagePath)) {
            imagePath = getRenamedFileName(folderPath, imagePath)
        }
    }

    let point = JSON.parse(data.points + "")
    point = point.join("~")

    let valueAddedFeature = [data.title, point, imagePath]
    
    con.query(`insert into cms_value_added_features (title,points,imagePath) values(?) `, [valueAddedFeature], (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        if (image) {
            image.mv(folderPath + imagePath, err => {

                if (err) {
                    return res.send({ success: false, message: "Error while saving file" })
                }

            })
        }

        res.send({
            valueAddedFeature: {
                id: result.insertId,
                imagePath,
                ...data
            },
            success: true,
            message: "Value Added Feature Uploaded Successfully"
        })

    })

})



// Update Value Added Feature
router.post("/value-added-features/update", async (req, res) => {

    let data = req.body

    let valueAddedData = await getCMSByIdAndTable(data.id, "cms_value_added_features")
    let image = null
    let imagePath = valueAddedData.imagePath
    const folderPath = "../public_html/assets/images/value-added-features/"

    if (req.files != null) {
        image = req.files.image
        let fileExtension = image.name.split(".").pop()
        let fileName = data.title.trim().toLowerCase().replace(/['"]+/g, '').split(" ").join("-")
        imagePath = "" + fileName + "." + fileExtension

        if (fs.existsSync(folderPath + valueAddedData.imagePath) && valueAddedData.imagePath) {
            fs.unlinkSync(folderPath + valueAddedData.imagePath)
        }

        if (fs.existsSync(folderPath + imagePath)) {
            imagePath = getRenamedFileName(folderPath, imagePath)
        }
    }
    
    let point = JSON.parse(data.points + "")
    point = point.join("~")

    let valueAdded = [data.title, point, imagePath, data.id]

    con.query(`update cms_value_added_features set title=?,points=?,imagePath=? where id=? `, valueAdded,
        async (err, result) => {

            if (err) {
                return res.status(500).end(err.sqlMessage)
            }

            if (image) {
                image.mv(folderPath + imagePath, err => {

                    if (err) {
                        return res.send({ success: false, message: "Error while file saving" })
                    }

                })
            }

            res.send({ success: true, message: "Value Added Feature Updated Successfully" })
        })
})


//Delete Value Added Feature
router.delete("/value-added-features/:id", async (req, res) => {

    let valueAdded = await getCMSByIdAndTable(req.params.id, "cms_value_added_features")

    con.query(`delete from cms_value_added_features where id=? `, [req.params.id], (err, result) => {

        if (err) {
            return res.send({ message: err.sqlMessage })
        }

        const folderPath = "../public_html/assets/images/value-added-features/"

        if (fs.existsSync(folderPath + valueAdded.imagePath) && valueAdded.imagePath) {
            fs.unlinkSync(folderPath + valueAdded.imagePath)
        }

        res.send({ success: result.affectedRows > 0 })
    })
})

//Get All About Us Statistics
router.get('/about-us-statistics', (req, res) => {
    con.query(`select * from cms_about_us_statistics order by id desc`, (err, result) => {
        res.send(result)
    })
})

//Upload New About Us Statistics
router.post('/about-us-statistics', (req, res) => {

    if (!req.files) {
        return res.send({ success: false, message: "Please Choosed Image" })
    }

    let data = req.body
    let image = null
    let imagePath = null
    const folderPath = "../public_html/assets/images/about-us-statistics/"

    if (req.files != null) {
        image = req.files.image
        let fileExtension = image.name.split(".").pop()
        let fileName = data.title.trim().toLowerCase().replace(/['"]+/g, '').split(" ").join("-")
        imagePath = "" + fileName + "." + fileExtension

        if (fs.existsSync(folderPath + imagePath)) {
            imagePath = getRenamedFileName(folderPath, imagePath)
        }
    }

    let statistic = [data.title, data.value, imagePath]
    statistic = statistic.map(s => s.trim())
    con.query(`insert into cms_about_us_statistics (title,value,imagePath) values(?) `, [statistic], (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        if (image) {
            image.mv(folderPath + imagePath, err => {

                if (err) {
                    return res.send({ success: false, message: "Error while saving file" })
                }

            })
        }

        res.send({
            statistic: {
                id: result.insertId,
                imagePath,
                ...data
            },
            success: true,
            message: "Statistic Uploaded Successfully"
        })

    })

})



// Update About Us Statistic
router.post("/about-us-statistics/update", async (req, res) => {

    let data = req.body

    let statisticData = await getCMSByIdAndTable(data.id, "cms_about_us_statistics")
    let image = null
    let imagePath = statisticData.imagePath
    const folderPath = "../public_html/assets/images/about_us_statistics/"

    if (req.files != null) {
        image = req.files.image
        let fileExtension = image.name.split(".").pop()
        let fileName = data.title.trim().toLowerCase().replace(/['"]+/g, '').split(" ").join("-")
        imagePath = "" + fileName + "." + fileExtension

        if (fs.existsSync(folderPath + statisticData.imagePath) && statisticData.imagePath) {
            fs.unlinkSync(folderPath + statisticData.imagePath)
        }

        if (fs.existsSync(folderPath + imagePath)) {
            imagePath = getRenamedFileName(folderPath, imagePath)
        }
    }

    let statistic = [data.title, data.value, imagePath, data.id]

    con.query(`update cms_about_us_statistics set title=?,value=?,imagePath=? where id=? `, statistic,
        async (err, result) => {

            if (err) {
                return res.status(500).end(err.sqlMessage)
            }

            if (image) {
                image.mv(folderPath + imagePath, err => {

                    if (err) {
                        return res.send({ success: false, message: "Error while file saving" })
                    }

                })
            }

            res.send({ success: true, message: "Statistic Updated Successfully" })
        })
})


//Delete About Us Statistic
router.delete("/about-us-statistics/:id", async (req, res) => {

    let statistic = await getCMSByIdAndTable(req.params.id, "cms_about_us_statistics")

    con.query(`delete from cms_about_us_statistics where id=? `, [req.params.id], (err, result) => {

        if (err) {
            return res.send({ message: err.sqlMessage })
        }

        const folderPath = "../public_html/assets/images/about_us_statistics/"

        if (fs.existsSync(folderPath + statistic.imagePath) && statistic.imagePath) {
            fs.unlinkSync(folderPath + statistic.imagePath)
        }

        res.send({ success: result.affectedRows > 0 })
    })
})

//Get All Browse top Courses
router.get('/browse-top-courses', (req, res) => {
    con.query(`select * from cms_browse_top_courses order by id desc`, (err, result) => {
        res.send(result)
    })
})

//Upload New Top Course
router.post('/browse-top-courses', (req, res) => {

    if (!req.files) {
        return res.send({ success: false, message: "Please Choosed Image" })
    }

    let data = req.body
    let image = null
    let imagePath = null
    const folderPath = "../public_html/assets/images/top-courses/"

    if (req.files != null) {
        image = req.files.image
        let fileExtension = image.name.split(".").pop()
        let fileName = data.title.trim().toLowerCase().replace(/['"]+/g, '').split(" ").join("-")
        imagePath = "" + fileName + "." + fileExtension

        if (fs.existsSync(folderPath + imagePath)) {
            imagePath = getRenamedFileName(folderPath, imagePath)
        }
    }

    let topCourse = [data.title, data.link, imagePath]
    topCourse = topCourse.map(s => s.trim())

    con.query(`insert into cms_browse_top_courses (title,link,imagePath) values(?) `, [topCourse], (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        if (image) {
            image.mv(folderPath + imagePath, err => {

                if (err) {
                    return res.send({ success: false, message: "Error while saving file" })
                }

            })
        }

        res.send({
            course: {
                id: result.insertId,
                imagePath,
                ...data
            },
            success: true,
            message: "Top Course Uploaded Successfully"
        })

    })

})


// Update Browse top course
router.post("/browse-top-courses/update", async (req, res) => {

    let data = req.body

    let topCourseData = await getCMSByIdAndTable(data.id, "cms_browse_top_courses")
    let image = null
    let imagePath = topCourseData.imagePath
    const folderPath = "../public_html/assets/images/top-courses/"

    if (req.files != null) {
        image = req.files.image
        let fileExtension = image.name.split(".").pop()
        let fileName = data.title.trim().toLowerCase().replace(/['"]+/g, '').split(" ").join("-")
        imagePath = "" + fileName + "." + fileExtension

        if (fs.existsSync(folderPath + topCourseData.imagePath) && topCourseData.imagePath) {
            fs.unlinkSync(folderPath + topCourseData.imagePath)
        }

        if (fs.existsSync(folderPath + imagePath)) {
            imagePath = getRenamedFileName(folderPath, imagePath)
        }
    }

    let topCourse = [data.title, data.link, imagePath, data.id]

    con.query(`update cms_browse_top_courses set title=?,link=?,imagePath=? where id=? `, topCourse,
        async (err, result) => {

            if (err) {
                return res.status(500).end(err.sqlMessage)
            }

            if (image) {
                image.mv(folderPath + imagePath, err => {

                    if (err) {
                        return res.send({ success: false, message: "Error while file saving" })
                    }

                })
            }

            res.send({ success: true, message: "Top Course Updated Successfully" })
        })
})


//Delete Top Course
router.delete("/browse-top-courses/:id", async (req, res) => {

    let topCourse = await getCMSByIdAndTable(req.params.id, "cms_browse_top_courses")

    con.query(`delete from cms_browse_top_courses where id=? `, [req.params.id], (err, result) => {

        if (err) {
            return res.send({ message: err.sqlMessage })
        }

        const folderPath = "../public_html/assets/images/top-courses/"

        if (fs.existsSync(folderPath + topCourse.imagePath) && topCourse.imagePath) {
            fs.unlinkSync(folderPath + topCourse.imagePath)
        }

        res.send({ success: result.affectedRows > 0 })
    })
})

//Get All Teachers
router.get('/teachers', (req, res) => {
    con.query(`select * from cms_our_instructors order by id desc`, (err, result) => {
        res.send(result)
    })
})

//Upload New Teacher
router.post('/teacher', (req, res) => {

    if (!req.files) {
        return res.send({ success: false, message: "Please Choosed Image" })
    }

    let data = req.body
    let image = null
    let imagePath = null
    const folderPath = "../public_html/assets/images/our-instructors/"

    if (req.files != null) {
        image = req.files.image
        let fileExtension = image.name.split(".").pop()
        let fileName = data.name.trim().toLowerCase().replace(/['"]+/g, '').split(" ").join("-")
        imagePath = "" + fileName + "." + fileExtension

        if (fs.existsSync(folderPath + imagePath)) {
            imagePath = getRenamedFileName(folderPath, imagePath)
        }
    }

    let teacher = [data.name, data.subject, imagePath]
    teacher = teacher.map(s => s.trim())
    con.query(`insert into cms_our_instructors (name,subject,imagePath) values(?) `, [teacher], (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        if (image) {
            image.mv(folderPath + imagePath, err => {

                if (err) {
                    return res.send({ success: false, message: "Error while saving file" })
                }

            })
        }

        res.send({
            teacher: {
                id: result.insertId,
                image: imagePath,
                ...data
            },
            success: true,
            message: "Instructor Uploaded Successfully"
        })

    })

})



// Update Teacher
router.post("/teacher/update", async (req, res) => {

    let data = req.body

    let teacherData = await getCMSByIdAndTable(data.id, "cms_our_instructors")
    let image = null
    let imagePath = teacherData.imagePath
    const folderPath = "../public_html/assets/images/our-instructors/"

    if (req.files != null) {
        image = req.files.image
        let fileExtension = image.name.split(".").pop()
        let fileName = data.name.trim().toLowerCase().replace(/['"]+/g, '').split(" ").join("-")
        imagePath = "" + fileName + "." + fileExtension

        if (fs.existsSync(folderPath + teacherData.imagePath) && teacherData.imagePath) {
            fs.unlinkSync(folderPath + teacherData.imagePath)
        }

        if (fs.existsSync(folderPath + imagePath)) {
            imagePath = getRenamedFileName(folderPath, imagePath)
        }
    }

    let teacher = [data.name, data.subject, imagePath, data.id]

    con.query(`update cms_our_instructors set name=?,subject=?,imagePath=? where id=? `, teacher,
        async (err, result) => {

            if (err) {
                return res.status(500).end(err.sqlMessage)
            }

            if (image) {
                image.mv(folderPath + imagePath, err => {

                    if (err) {
                        return res.send({ success: false, message: "Error while file saving" })
                    }

                })
            }

            res.send({ success: true, message: "Instructor Updated Successfully" })
        })
})


//Delete Teacher
router.delete("/teacher/:id", async (req, res) => {

    let teacher = await getCMSByIdAndTable(req.params.id, "cms_our_instructors")

    con.query(`delete from cms_our_instructors where id=? `, [req.params.id], (err, result) => {

        if (err) {
            return res.send({ message: err.sqlMessage })
        }

        const folderPath = "../public_html/assets/images/our-instructors/"

        if (fs.existsSync(folderPath + teacher.imagePath) && teacher.imagePath) {
            fs.unlinkSync(folderPath + teacher.imagePath)
        }

        res.send({ success: result.affectedRows > 0 })
    })
})

//Get All Testimonials
router.get('/testimonials', (req, res) => {
    con.query(`select * from cms_testimonials order by id desc`, (err, result) => {
        res.send(result)
    })
})

//Upload New Testimonials
router.post('/testimonial', (req, res) => {

    if (!req.files) {
        return res.send({ success: false, message: "Please Choosed Image" })
    }

    let data = req.body
    let image = null
    let imagePath = null
    const folderPath = "../public_html/assets/images/testimonials/"

    if (req.files != null) {
        image = req.files.image
        let fileExtension = image.name.split(".").pop()
        let fileName = data.name.trim().toLowerCase().replace(/['"]+/g, '').split(" ").join("-")
        imagePath = "" + fileName + "." + fileExtension

        if (fs.existsSync(folderPath + imagePath)) {
            imagePath = getRenamedFileName(folderPath, imagePath)
        }
    }

    let testimonial = [data.name, data.category, data.review, imagePath]
    testimonial = testimonial.map(s => s.trim())
    con.query(`insert into cms_testimonials (name,category,review,imagePath) values(?) `, [testimonial], (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        if (image) {
            image.mv(folderPath + imagePath, err => {

                if (err) {
                    return res.send({ success: false, message: "Error while saving file" })
                }

            })
        }

        res.send({
            testimonial: {
                id: result.insertId,
                image: imagePath,
                ...data
            },
            success: true,
            message: "Testimonial Uploaded Successfully"
        })

    })

})



// Update Testimonial
router.post("/testimonial/update", async (req, res) => {

    let data = req.body

    let testimonialData = await getCMSByIdAndTable(data.id, "cms_testimonials")
    let image = null
    let imagePath = testimonialData.imagePath
    const folderPath = "../public_html/assets/images/testimonials/"

    if (req.files != null) {
        image = req.files.image
        let fileExtension = image.name.split(".").pop()
        let fileName = data.name.trim().toLowerCase().replace(/['"]+/g, '').split(" ").join("-")
        imagePath = "" + fileName + "." + fileExtension

        if (fs.existsSync(folderPath + testimonialData.imagePath) && testimonialData.imagePath) {
            fs.unlinkSync(folderPath + testimonialData.imagePath)
        }

        if (fs.existsSync(folderPath + imagePath)) {
            imagePath = getRenamedFileName(folderPath, imagePath)
        }
    }

    let testimonial = [data.name, data.category, data.review, imagePath, data.id]

    con.query(`update cms_testimonials set name=?,category=?,review=?,imagePath=? where id=? `, testimonial,
        async (err, result) => {

            if (err) {
                return res.status(500).end(err.sqlMessage)
            }

            if (image) {
                image.mv(folderPath + imagePath, err => {

                    if (err) {
                        return res.send({ success: false, message: "Error while file saving" })
                    }

                })
            }

            res.send({ success: true, message: "Testimonial Updated Successfully" })
        })
})


//Delete Testimonial
router.delete("/testimonial/:id", async (req, res) => {

    let testimonial = await getCMSByIdAndTable(req.params.id, "cms_testimonials")

    con.query(`delete from cms_testimonials where id=? `, [req.params.id], (err, result) => {

        if (err) {
            return res.send({ message: err.sqlMessage })
        }

        const folderPath = "../public_html/assets/images/testimonials/"

        if (fs.existsSync(folderPath + testimonial.imagePath) && testimonial.imagePath) {
            fs.unlinkSync(folderPath + testimonial.imagePath)
        }

        res.send({ success: result.affectedRows > 0 })
    })
})


//Get Get Started Now
router.get('/get-started-now', (req, res) => {
    con.query(`select * from cms_get_started_now`, (err, result) => {
        res.send(result[0])
    })
})

// Update Get Started Now
router.post("/get-started-now", async (req, res) => {

    let data = req.body

    let getStartedData = await getCMSByIdAndTable(data.id, "cms_get_started_now")
    let image = null
    let imagePath = getStartedData.imagePath
    const folderPath = "../public_html/assets/images/get-started/"

    if (req.files != null) {
        image = req.files.image
        let fileExtension = image.name.split(".").pop()
        let fileName = data.title.trim().toLowerCase().replace(/['"]+/g, '').split(" ").join("-")
        imagePath = "" + fileName + "." + fileExtension

        if (fs.existsSync(folderPath + getStartedData.imagePath) && getStartedData.imagePath) {
            fs.unlinkSync(folderPath + getStartedData.imagePath)
        }

        if (fs.existsSync(folderPath + imagePath)) {
            imagePath = getRenamedFileName(folderPath, imagePath)
        }
    }

    let getStarted = [data.title, data.description, data.buttonText, data.buttonLink, imagePath, data.id]

    con.query(`update cms_get_started_now set title=?,description=?,buttonText=?,buttonLink=?,imagePath=? where id=? `, getStarted,
        async (err, result) => {

            if (err) {
                return res.status(500).end(err.sqlMessage)
            }

            if (image) {
                image.mv(folderPath + imagePath, err => {

                    if (err) {
                        return res.send({ success: false, message: "Error while file saving" })
                    }

                })
            }

            res.send({ success: true, message: "Get Started Updated Successfully" })
        })
})


//Get About us
router.get('/about-us', (req, res) => {
    con.query(`select * from cms_about_us`, (err, result) => {
        res.send(result[0])
    })
})

// Update About us
router.post("/about-us", async (req, res) => {

    let data = req.body

    let aboutUsData = await getCMSByIdAndTable(data.id, "cms_about_us")
    let image = null
    let imagePath = aboutUsData.imagePath
    const folderPath = "../public_html/assets/images/about-us/"

    if (req.files != null) {
        image = req.files.image
        let fileExtension = image.name.split(".").pop()
        let fileName = data.title.trim().toLowerCase().replace(/['"]+/g, '').split(" ").join("-")
        imagePath = "" + fileName + "." + fileExtension

        if (fs.existsSync(folderPath + aboutUsData.imagePath) && aboutUsData.imagePath) {
            fs.unlinkSync(folderPath + aboutUsData.imagePath)
        }

        if (fs.existsSync(folderPath + imagePath)) {
            imagePath = getRenamedFileName(folderPath, imagePath)
        }
    }

    let aboutUs = [data.title, data.description, data.buttonText, data.buttonLink, imagePath, data.id]

    con.query(`update cms_about_us set title=?,description=?,buttonText=?,buttonLink=?,imagePath=? where id=? `, aboutUs,
        async (err, result) => {

            if (err) {
                return res.status(500).end(err.sqlMessage)
            }

            if (image) {
                image.mv(folderPath + imagePath, err => {

                    if (err) {
                        return res.send({ success: false, message: "Error while file saving" })
                    }

                })
            }

            res.send({ success: true, message: "About Us Updated Successfully" })
        })
})

module.exports = router