const express = require('express')
const router = express.Router()
const con = require("../db")
const getUserActiveSession = require("../user-functions")


// Get Contact Inquires
router.get("/", (req, res) => {
    con.query(`select *,date_format(datetime,'%d-%b-%Y %h:%i:%s %p') datetime from contact_queries order by isSeen asc,id desc`, (err, result) => {

        if (err) {
            return res.status(500).end(err.message)
        }

        res.send(result)
    });
})

// Get Unseen Count
router.get("/unseen-count", (req, res) => {
    con.query(`select count(id) as cnt from contact_queries where isSeen=0`, (err, result) => {

        if (err) {
            return res.status(500).end(err.message)
        }

        res.send({count:result[0].cnt});
    })
})

router.put("/", (req, res) => {
    const id = req.body.id
    con.query(`update contact_queries set isSeen=1 where id=?`, [id], (err, result) => {

        if (err) {
            return res.status(500).end(err.message)
        }

        res.send({ success: result.changedRows > 0 })
    })
})

module.exports = router