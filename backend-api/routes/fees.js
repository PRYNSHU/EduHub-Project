const express = require('express')
const router = express.Router()
const con = require("../db")

function getFeesById(feesId) {
    return new Promise(resolve => {
        con.query(`select f.feesId,f.parentName,f.studentName,f.amount,f.city,f.courseId,c.course courseName,f.paymentMode,f.chequeNo,f.bankName,date_format(f.depositDate,'%d-%b-%Y %h:%i:%s %p') depositDate,f.status,f.onAccountOf from erp_fees_entries f left join erp_courses c on c.courseId=f.courseId where f.feesId=?`, [feesId], (err, result) => {
            resolve(result[0])
        })
    })
}

//Get Fees Entry By Id
router.get("/:feesId", async (req, res) => {
    res.send(await getFeesById(req.params.feesId))
})

//Add New Fees Entry
router.post("/", (req, res) => {
    let feesEntry = req.body
    let feesData = [feesEntry.parentName, feesEntry.studentName, feesEntry.amount, feesEntry.city, feesEntry.courseId, feesEntry.paymentMode, feesEntry.chequeNo, feesEntry.bankName, feesEntry.depositDate,feesEntry.onAccountOf]
    con.query(`insert into erp_fees_entries (parentName,studentName,amount,city,courseId,paymentMode,chequeNo,bankName,depositDate,onAccountOf) values(?)`, [feesData], async (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        let newEntry = await getFeesById(result.insertId)
        res.send({ feesEntry: newEntry, message: "Fees Entry Added Successfully" })
    })
})

// Get All Fees Entries
router.get("/", (req, res) => {
    con.query(`select f.feesId,f.parentName,f.studentName,f.amount,f.city,f.courseId,c.course courseName,f.paymentMode,f.chequeNo,f.bankName,date_format(f.depositDate,'%d-%b-%Y %h:%i:%s %p') depositDate,f.status,f.onAccountOf from erp_fees_entries f left join erp_courses c on c.courseId=f.courseId order by f.feesId desc`, (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        res.send(result)
    })
})

//Update Fees Status
router.put("/", (req, res) => {
    con.query(`update erp_fees_entries set status=? where feesId=?`, [req.body.status, req.body.feesId], (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        res.send({ success: result.changedRows > 0 })
    })
})

//Update Fees Entry
router.put("/update", (req, res) => {
    let data = req.body
    let feesData = [data.parentName, data.studentName, data.amount, data.city, data.courseId, data.paymentMode, data.chequeNo, data.bankName, data.depositDate,data.onAccountOf, data.feesId]
    con.query(`update erp_fees_entries set parentName=?,studentName=?,amount=?,city=?,courseId=?,paymentMode=?,chequeNo=?,bankName=?,depositDate=?,onAccountOf=? where feesId=?`, feesData, (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        res.send({ success: result.changedRows > 0, message: "Fees Entry Updated Successfully" })
    })
})

//Delete Fees Entry
router.delete("/:feesId", (req, res) => {
    con.query(`delete from erp_fees_entries where feesId=? `, [req.params.feesId], (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        return res.send({ success: result.affectedRows > 0 })
    })
})
module.exports = router