const express = require('express');
const router = express.Router();
const con = require("../db");


router.get("/", async (req, res) => {
  let { bioId, dateTime } = getBioIdAndDateTime(req.query);
  console.log(bioId+" "+dateTime);
  let userId = await getUserIdByBioId(bioId);
  con.query(`insert into erp_attendance(userid,datetime) values(?,?) `, [userId, dateTime])
  res.send({ message: "Ok" })
})

function getUserIdByBioId(bioId) {
  return new Promise((resolve) => {
    con.query(`select id from login where bioid = ${bioId} `, (err, result) => {
      resolve(result[0].id)
    })
  })
}

function getBioIdAndDateTime(obj) {
  const data = obj.msg.split(",")
  const bioId = +data[0].split("-")[1]
  const datetime = data[2].split("- ")[1]

  const date = datetime.split(" ")[0]
  const time = datetime.split(" ")[1]

  const day = date.split("/")[0]
  const month = date.split("/")[1]
  const year = date.split("/")[2]

  const newDateTime = [year, month, day].join("-") + " " + time
  return { bioId, dateTime: newDateTime }
}

module.exports = router