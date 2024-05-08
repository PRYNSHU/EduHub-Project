const express = require('express')
const router = express.Router()
const con = require("../db")
const getUserActiveSession = require("../user-functions")

//Add New Book
router.post("/book", (req, res) => {
    const data = req.body

    const bookData = Object.values(data)
    bookData.push(0)

    con.query(`insert into library_books(bookId,name,class,subject,author,publisher,edition,remarks,isIssued) values(?)`, [bookData], (err, result) => {

        if (err) {
            return res.status(500).end(err.message)
        }

        res.send({ message: "Book added successfully", success: true })

    })
})

//Update Book
router.put("/book", (req, res) => {
    const data = req.body

    const bookData = [
        data.bookId,
        data.name,
        data.class,
        data.subject,
        data.author,
        data.publisher,
        data.edition,
        data.remarks,
        data.id
    ]

    con.query(`update library_books set bookId=?,name=?,class=?,subject=?,author=?,publisher=?,edition=?,remarks=? where id=?`, bookData, (err, result) => {

        if (err) {
            return res.status(500).end(err.message)
        }

        res.send({ message: "Book updated successfully", success: result.changedRows > 0 })
    })
})


//Search books
router.post("/books/search", (req, res) => {
    const bookData = req.body

    let append = ""
    let whereAdded = false

    if (bookData.subject) {
        append += ` where subject='${bookData.subject}'`
        whereAdded = true
    }

    if (bookData.class) {

        if (whereAdded) {
            append += ` and class='${bookData.class}'`
        } else {
            append += ` where class='${bookData.class}'`
            whereAdded = true
        }

    }

    if (bookData.bookId) {

        if (whereAdded) {
            append += ` and bookId='${bookData.bookId}'`
        } else {
            append += ` where bookId='${bookData.bookId}'`
            whereAdded = true
        }

    }


    if (bookData.bookName) {

        if (whereAdded) {
            append += ` and name like '%${bookData.bookName}%'`
        } else {
            append += ` where name like '%${bookData.bookName}%'`
            whereAdded = true
        }

    }


    if (bookData.author) {

        if (whereAdded) {
            append += ` and author='${bookData.author}'`
        } else {
            append += ` where author='${bookData.author}'`
            whereAdded = true
        }

    }
    console.log(append)

    con.query(`select * from library_books ${append}`, (err, result) => {

        if (err) {
            return res.status(500).end(err.message)
        }

        res.send(result)
    })
})

//Delete Book
router.delete("/book/:id", (req, res) => {
    const id = req.params.id

    con.query(`delete from library_books where id=?`, [id], (err, result) => {

        if (err) {
            return res.status(500).end(err.message)
        }

        res.send({ success: result.affectedRows > 0 })
    })
})

// Issue book
router.post("/issue-book", (req, res) => {

    const data = req.body

    con.query(`insert into library_issued_books(bookId,studentId) values(?)`, [[data.bookId, data.studentId]], (err, result) => {

        if (err) {
            return res.status(500).end(err.message)
        }

        changeBookStatus(data.bookId, 1)

        res.send({ success: true, message: "Book issued successfully" })

    })

})

function changeBookStatus(bookId, status) {
    con.query(`update library_books set isIssued = ${status} where bookId='${bookId}' `)
}

// return-book-details
router.get("/return-book-details/:bookId", async (req, res) => {
    const bookId = req.params.bookId

    const isBookAvailable = await new Promise(resolve => {
        con.query("select bookId from library_books where bookId=?", [bookId], (err, result) => {
            resolve(result.length > 0)
        })
    })

    if (!isBookAvailable) {
        return res.send({ success: false, message: "This bookId is not in the database" })
    }
    
    try {
        await new Promise((resolve, reject) => {
            con.query(`select id from library_issued_books where bookId=? and returnDate IS NULL`, [bookId], (err, result) => {

                if (result.length == 0) {
                    return reject("This book is not issued")
                }

                resolve(result[0].id)
            })
        })

    } catch (err) {
        return res.send({ success: false, message: err })
    }

    const bookDetails = await new Promise(resolve => {
        con.query(`select lb.*,date_format(lib.issueDate,'%d-%b-%Y') as issueDate,lib.studentId from library_books lb inner join library_issued_books lib on lb.bookId=lib.bookId where lb.bookId=? and lib.returnDate IS NULL `, [bookId], (err, result) => {
            resolve(result[0])
        })
    })

    const studentId = bookDetails.studentId
    const studentDetails = await new Promise(resolve => {
        con.query(`select es.name,es.rollNo,ec.course,eb.batch from erp_students es inner join erp_students_cbs escbs on escbs.studentId=es.studentId inner join erp_courses ec on ec.courseId=escbs.courseId inner join erp_batches eb on eb.batchId=escbs.batchId where es.studentId=?`, [studentId], (err, result) => {
            resolve(result[0])
        })
    })

    res.send({ success: true, studentDetails, bookDetails })
})

//return book
router.put("/return-book", (req, res) => {
    const bookId = req.body.bookId

    con.query(`update library_issued_books set returnDate=date(now()) where bookId=? and returnDate IS NULL`, [bookId], (err, result) => {

        if (err) {
            return res.status(500).end(err.sqlMessage)
        }

        changeBookStatus(bookId, 0)

        res.send({ message: "Book returned successfully", success: result.changedRows > 0 })

    })

})

module.exports = router