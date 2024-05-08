const express = require('express')
const router = express.Router()
const con = require("../db")

//Request New Leave
router.post("/", (req, res) => {
    const leave = req.body
    const leaveContent = leave.leaveContent
    const fromDate = leave.fromDate
    const toDate = leave.toDate
    const reason = leave.reason
    const userId = res.locals.userId
    const insertData = [leaveContent, fromDate, toDate, reason, userId]

    con.query(`insert into leaves(leaveContent,fromDate,toDate,reason,requestedBy) values(?)`, [insertData], (err, result) => {
        if (err) return res.status(500).end(err.sqlMessage)
        res.send({ success: true, message: "Leave requested successfully" })
    })
})

// Get Users Leaves
router.get("/", (req, res) => {
    con.query(`select l.leaveId,l.response,l.leaveContent,date_format(l.fromDate,'%d-%b-%Y') fromDate,date_format(l.toDate,'%d-%b-%Y') toDate,date_format(l.timestamp,'%d-%b-%Y') timestamp,l.reason,ls.status,eu.name from leaves l inner join leaves_status ls on ls.id=l.statusId left join erp_users eu on eu.userId=l.requestedBy order by l.statusId asc, l.leaveId desc`, (err, result) => {
        if (err) return res.status(500).end(err.sqlMessage)
        res.send(result)
    })
})

// Get Pending Leaves Cound
router.get("/pending-leaves-count",(req,res)=>{
    con.query(`select count(leaveId) as cnt from leaves where statusId=1`,(err,result)=>{
        
        if(err){
            return res.status(500).end(err.sqlMessage)
        }

        res.send({count:result[0].cnt})
    })
})

// Get My Leaves
router.get("/my", (req, res) => {
    const userId = res.locals.userId
    con.query(`select l.leaveId,l.response,l.leaveContent,date_format(l.fromDate,'%d-%b-%Y') fromDate,date_format(l.toDate,'%d-%b-%Y') toDate,date_format(l.timestamp,'%d-%b-%Y') timestamp,l.reason,ls.status from leaves l inner join leaves_status ls on ls.id=l.statusId where l.requestedBy=? order by l.leaveId desc`, [userId], (err, result) => {
        if (err) return res.status(500).end(err.sqlMessage)
        res.send(result)
    })
})

// Accept Reject Leave Status
router.put("/", (req, res) => {
    const leaveId = req.body.leaveId
    const statusId = req.body.status
    const response = req.body.response
    con.query(`update leaves set statusId=?,response=? where leaveId=?`, [statusId, response, leaveId], (err, result) => {
        if (err) return res.status(500).end(err.sqlMessage)
        res.send({ success: true, message: "Leave Status Changed Successfully" })
    })
})

// Update Leave
router.put("/update-leave", (req, res) => {
    const data = req.body
    const updateData = [
        data.leaveContent,
        data.reason,
        data.fromDate,
        data.toDate,
        data.leaveId
    ]

    con.query(`update leaves set leaveContent=?,reason=?,fromDate=?,toDate=? where leaveId=?`, updateData, (err, result) => {

        if (err) {
            return res.status(500).end(err.message)
        }

        res.send({ success: true, message: "Leave updated successfully" })
    })
})

// Delete Leave
router.delete("/:leaveId", (req, res) => {
    const leaveId = req.params.leaveId

    con.query(`delete from leaves where leaveId=? and response IS NULL`, [leaveId], (err, result) => {

        if (err) {
            return res.status(500).end(err.message)
        }

        res.send({ success: result.affectedRows > 0, message: "Leave deleted successfully" })

    })

})

module.exports = router