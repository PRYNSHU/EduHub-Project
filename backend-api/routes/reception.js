const express = require('express')
const router = express.Router()
const con = require("../db")

//get reception inquiry sources
router.get("/inquiry-sources", (req, res) => {
    con.query(`select * from inquiry_sources`, (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        res.send(result)
    })
})

//get reception inquiry statuses
router.get("/inquiry-status", (req, res) => {
    con.query(`select * from inquiry_status`, (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        res.send(result)
    })
})

//Create new admission Inquiry
router.post("/inquiry", (req, res) => {
    let data = req.body
    data.email = data.email ? data.email : null
    let inquiryData = [
        data.name, data.email, data.phone, data.inquiryDate, data.academicYear, data.courseId, data.inquirySourceId, data.assignedTo, data.childName, data.childNo, data.address, data.note
    ]
    con.query(`insert into rec_admission_inquiries(name,email,phone,inquiryDate,academicYear,courseId,inquirySourceId,assignedTo,childName,childNo,address,note) values(?)`, [inquiryData], (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        res.send({ admissionInquiryId: result.insertId, message: 'Inquiry Saved Successfully' })
    })
})

// Get Admission Inquiries
router.get("/inquiries", async (req, res) => {

    let followUpEntries = await new Promise(resolve => {
        con.query(`select admissionInquiryId,date_format(followDate,'%d-%b-%Y') followDate,date_format(nextDate,'%d-%b-%Y') nextDate,response from rec_admission_inquiries_dates order by id desc`, (err, result) => {
            resolve(result)
        })
    })

    let sql = "select i.admissionInquiryId,i.name,i.email,i.phone,date_format(i.inquiryDate,'%d-%b-%Y') inquiryDate,session_table.session as academicYearName,i.academicYear,ec.course,i.courseId,i_sources.inquirySource,i.inquirySourceId,i.inquiryStatusId,eu.name assignedToName,i.assignedTo,i.childName,i.childNo,i.address,i.note,i_status.inquiryStatus from rec_admission_inquiries i left join session_table on session_table.id=i.academicYear left join erp_courses ec on ec.courseId=i.courseId left join inquiry_sources i_sources on i_sources.inquirySourceId=i.inquirySourceId left join inquiry_status i_status on i_status.inquiryStatusId=i.inquiryStatusId left join erp_users eu on eu.userId=i.assignedTo order by i.admissionInquiryId desc"
    con.query(sql, (err, inquiries) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        inquiries.forEach((inquiry) => {
            let followUps = followUpEntries.filter(f => f.admissionInquiryId == inquiry.admissionInquiryId)
            inquiry["followUpEntries"] = followUps
        })

        res.send(inquiries)
    })
})

// Get Admission Inquiry By Inquiry Id
router.get("/inquiry/:inquiryId", async (req, res) => {

    const inquiryId = req.params.inquiryId

    let followUpEntries = await new Promise(resolve => {
        con.query(`select admissionInquiryId,date_format(followDate,'%d-%b-%Y') followDate,date_format(nextDate,'%d-%b-%Y') nextDate,response from rec_admission_inquiries_dates where admissionInquiryId=? order by id desc`, [inquiryId], (err, result) => {
            resolve(result)
        })
    })

    let sql = "select i.admissionInquiryId,i.name,i.email,i.phone,date_format(i.inquiryDate,'%d-%b-%Y') inquiryDate,session_table.session as academicYearName,i.academicYear,ec.course,i.courseId,i_sources.inquirySource,i.inquirySourceId,i.inquiryStatusId,eu.name assignedToName,i.assignedTo,i.childName,i.childNo,i.address,i.note,i_status.inquiryStatus from rec_admission_inquiries i left join session_table on session_table.id=i.academicYear left join erp_courses ec on ec.courseId=i.courseId left join inquiry_sources i_sources on i_sources.inquirySourceId=i.inquirySourceId left join inquiry_status i_status on i_status.inquiryStatusId=i.inquiryStatusId left join erp_users eu on eu.userId=i.assignedTo where i.admissionInquiryId=? order by i.admissionInquiryId desc"
    con.query(sql,[inquiryId], (err, inquiries) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        inquiries.forEach((inquiry) => {
            let followUps = followUpEntries.filter(f => f.admissionInquiryId == inquiry.admissionInquiryId)
            inquiry["followUpEntries"] = followUps
        })

        res.send(inquiries[0])
    })
})

// Add Follow Up Date
router.post("/follow-up", (req, res) => {
    let data = req.body
    let followData = [data.admissionInquiryId, data.followUpDate, data.nextFollowUpDate, data.response]
    let sql = "insert into rec_admission_inquiries_dates(admissionInquiryId,followDate,nextDate,response) values(?)"
    con.query(sql, [followData], (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        res.send({ message: "Follow-Up Saved Successully" })
    })
})

//Change Inquiry Status
router.put("/inquiry/status", (req, res) => {
    let admissionInquiryId = req.body.admissionInquiryId
    let status = req.body.status
    con.query(`update rec_admission_inquiries set inquiryStatusId=? where admissionInquiryId=? `, [status, admissionInquiryId], (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        res.send({ success: result.changedRows > 0 })
    })
})

//Update Inquiry
router.put("/inquiry", (req, res) => {

    let data = req.body

    let updateData = [
        data.name, data.email, data.phone, data.inquiryDate, data.academicYear, data.courseId, data.inquirySourceId, data.assignedTo, data.childName, data.childNo, data.address, data.note, data.admissionInquiryId
    ]

    let sql = `update rec_admission_inquiries set name=?,email=?,phone=?,inquiryDate=?,academicYear=?,courseId=?,inquirySourceId=?,assignedTo=?,childName=?,childNo=?,address=?,note=? where admissionInquiryId=?`
    con.query(sql, updateData, (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        res.send({ message: "Inquiry Updated Succesfully" });
    })
})

//Delete Inquiry
router.delete("/inquiry/:inquiryId", (req, res) => {
    con.query(`delete from rec_admission_inquiries where admissionInquiryId = ? `, [req.params.inquiryId], (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        res.send({ success: result.affectedRows > 0 })
    })
})

module.exports = router