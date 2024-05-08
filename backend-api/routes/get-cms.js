const express = require('express')
const router = express.Router()
const con = require("../db")
const fs = require("fs")

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

// Save Contact Inquiry
router.post("/save-contact-inquiry",(req,res)=>{

    const data = req.body

    let values = [
        data.name,
        data.email,
        data.message
    ]

    con.query(`insert into contact_queries (name,email,message) values(?)`,[values],(err,result)=>{

        if(err){
            return res.status(500).message
        }

        res.send({success:true,message:"Message sent successfully"})

    })

})

//get All CMS Toggles
router.get("/cms-status", (req, res) => {

    con.query(`select section,status from cms_toggle`, (err, result) => {

        if (err) {
            return res.status(500).end(err.message)
        }

        res.send(result)
    })
})

//Get All Slideshows
router.get('/slideshow', (req, res) => {
    con.query(`select * from cms_slideshow order by id desc`, (err, result) => {
        res.send(result)
    })
})

//Get All Results
router.get('/results', (req, res) => {
    con.query(`select * from cms_results order by id desc`, (err, result) => {
        res.send(result)
    })
})

//Get All Statistics
router.get('/statistics', (req, res) => {
    con.query(`select * from cms_statistics order by id desc`, (err, result) => {
        res.send(result)
    })
})

//Get All Value Added Features
router.get('/value-added-features', (req, res) => {
    con.query(`select * from cms_value_added_features order by id desc`, (err, result) => {
        res.send(result)
    })
})


//Get All About Us Statistics
router.get('/about-us-statistics', (req, res) => {
    con.query(`select * from cms_about_us_statistics order by id desc`, (err, result) => {
        res.send(result)
    })
})

//Get All Browse top Courses
router.get('/browse-top-courses', (req, res) => {
    con.query(`select * from cms_browse_top_courses order by id desc`, (err, result) => {
        res.send(result)
    })
})

//Get All Teachers
router.get('/teachers', (req, res) => {
    con.query(`select * from cms_our_instructors order by id desc`, (err, result) => {
        res.send(result)
    })
})

//Get All Testimonials
router.get('/testimonials', (req, res) => {
    con.query(`select * from cms_testimonials order by id desc`, (err, result) => {
        res.send(result)
    })
})

//Get Get Started Now
router.get('/get-started-now', (req, res) => {
    con.query(`select * from cms_get_started_now`, (err, result) => {
        res.send(result[0])
    })
})

//Get About us
router.get('/about-us', (req, res) => {
    con.query(`select * from cms_about_us`, (err, result) => {
        res.send(result[0])
    })
})

module.exports = router