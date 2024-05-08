const express = require('express')
const router = express.Router()
const con = require("../db")
const {getUserActiveSession} = require("../user-functions")

//Get All Noticeboards
router.get('/', async (req, res) => {
    const sessionId = await getUserActiveSession(res.locals.userId)
    con.query(`select n.noticeboardId,n.content noticeboardContent,date_format(n.datetime,'%d-%b-%y %h:%i:%s %p') date,group_concat('<div class=noticeboard_batches>',b.batch,'</div>' separator '' ) batches from erp_noticeboard n inner join erp_noticeboard_batches nb on nb.noticeboardId = n.noticeboardId left join erp_batches b on find_in_set(b.batchId,nb.batchIds) where n.sessionId=${sessionId} group by n.noticeboardId order by n.noticeboardId desc`, (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        res.send(result)
    })
})

//get Single noticeboard
router.get('/:noticeboardId', (req, res) => {
    let noticeboardId = req.params.noticeboardId
    con.query(`select n.content noticeboardContent,concat('[',nb.batchIds,']') batchIds from erp_noticeboard n inner join erp_noticeboard_batches nb on nb.noticeboardId = n.noticeboardId where n.noticeboardId = ? `, [noticeboardId], (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        res.send(result[0])
    })
})

//Create Noticeboard
router.post('/', async (req, res) => {
    const content = req.body.noticeboardContent
    const batchIds = req.body.batchIds
    const uploadBy = res.locals.userId
    const sessionId = await getUserActiveSession(uploadBy)

    con.query(`insert into erp_noticeboard(content,uploadby,sessionId) values (?)`, [[content, uploadBy,sessionId]], (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
       
        const noticeboardId = result.insertId
        const sql = `insert into erp_noticeboard_batches(noticeboardId,batchIds) values (${noticeboardId},'${batchIds + ''}')`

        con.query(sql, (error, rs) => {
            if (error)
                return res.status(500).end(error.sqlMessage)
            res.send({ message: "Noticeboard created successully" })
        })

    })
})

// Update noticeboard
router.put("/", (req, res) => {
    let noticeboard = req.body
    con.query(`update erp_noticeboard set content=? where noticeboardId=?`, [noticeboard.noticeboardContent, noticeboard.noticeboardId], (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
    })

    con.query(`update erp_noticeboard_batches set batchids = ? where noticeboardId = ? `, [noticeboard.batchIds + "", noticeboard.noticeboardId], (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        res.send({ message: 'Noticeboard updated successfully' })
    })
})

// Delete noticeboard
router.delete('/:noticeboardId', (req, res) => {
    con.query(`delete from erp_noticeboard where noticeboardId = ? `, [req.params.noticeboardId], (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        res.send({ success: result.affectedRows > 0 })
    })
})

// Delete multiple noticeboards
router.delete('/multiple/:noticeboardIds', (req, res) => {
    let noticeboardIds = req.params.noticeboardIds.split(',')
    con.query(`delete from erp_noticeboard where noticeboardId in (?) `, [noticeboardIds], (err, result) => {
        if (err)
            return res.status(500).end(err.sqlMessage)
        res.send({ success: result.affectedRows > 0 })
    })
})

module.exports = router