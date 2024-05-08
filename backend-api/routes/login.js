const express = require('express')
const router = express.Router()
const con = require("../db")
const jwt = require('jsonwebtoken')
const { sendEmail } = require("../user-functions.js")
var md5 = require('md5');
const RequestIp = require('@supercharge/request-ip')

//check Connectivity
router.get("/connectivity", (req, res) => {
	res.send({ status: true })
})

async function getRoleByUserId(userId) {
	return new Promise((resolve) => {
		con.query(`select * from user_roles where roleId = (select roleId from erp_users where userId=?)`, [userId], (err, result) => {
			resolve(result[0].roleName)			
		})
	})
}

// User Login Handler
router.post('/', (req, res) => {
	con.query(`select id from login where username=? and password=? and role != 'student' `, [req.body.username, req.body.password],  async (err, result) => {
		if (result.length > 0) {

			const role = await getRoleByUserId(result[0].id) 
		
			let token = jwt.sign({
				userId: result[0].id,
				role: "admin"
			}, "pinnacle_key")
			res.send({
				success: true,
				userId: result[0].id,
				token,
				role,
				message: "Authentication Successful"
			})
		} else
			res.send({ success: false, message: "Authentication Failed" })
	});
});

function isMobileExists(mobile) {
	return new Promise((resolve, reject) => {
		con.query(`select studentId from erp_students where phone=?`, [mobile], (err, result) => {
			err ? reject(err.message) : resolve(result.length > 0)
		})
	})
}

function generateOTP() {
	var digits = '0123456789';
	let OTP = '';
	for (let i = 0; i < 4; i++) {
		OTP += digits[Math.floor(Math.random() * 10)];
	}
	return OTP;
}

function getStudentIdByMobileNumber(mobile) {
	return new Promise((resolve, reject) => {
		con.query(`select studentId from erp_students where phone=?`, [mobile], (err, result) => {
			err ? reject(err.message) : resolve(result[0].studentId)
		})
	})
}

// Check If Last OPT was sent 30 Seconds Ago
function canResendOTP(mobile, ip) {
	return new Promise((resolve, reject) => {
		con.query(`SELECT UNIX_TIMESTAMP(now())-UNIX_TIMESTAMP(date_sub(expiryTime, INTERVAL 5 Minute)) >=30 as canSendOTP FROM verify_otp where ip=? order by id desc limit 1`, [ip, mobile], (err, result) => {
			resolve(result.length == 0 || result[0].canSendOTP)
		})
	})
}

//verify-mobile-and-send-otp
router.get("/verify-mobile-and-send-otp/:mobile", async (req, res) => {
	const mobile = req.params.mobile
	const mobileRegex = /^[0-9]{10}$/;

	if (!mobileRegex.test(String(mobile).toLowerCase())) {
		return res.send({ success: false, message: "Mobile format is Invalid" })
	}

	try {

		if (!(await isMobileExists(mobile))) {
			return res.send({ success: false, message: `Mobile No. "${mobile}" does not exist in Database` })
		}

		const OTP = generateOTP()

		let expiryTime = new Date(+new Date() + 300000)
		expiryTime = new Date(expiryTime + " UTC").toISOString().slice(0, 19).replace("T", " ")

		const ip = RequestIp.getClientIp(req)

		if (!(await canResendOTP(mobile, ip))) {
			return res.send({ success: false, message: "You can Resend OTP after 30 Seconds" })
		}

		let data = [
			ip,
			mobile,
			OTP,
			expiryTime
		]

		con.query(`insert into verify_otp(ip,mobile,otp,expiryTime) values(?)`, [data], async (err, result) => {

			if (err) {
				return res.status(500).end(err.message)
			}

			const name = await new Promise((resolve) => {
				con.query(`select name from erp_students where phone=?`, [mobile], (err, result) => {
					resolve(result[0].name)
				})
			})

			res.send({ success: true, name, message: `OTP has been sent to Mobile No. "${mobile}" ` })
		})

	} catch (e) {
		res.status(500).end(e)
	}
})

//verify-otp-and-login

router.get("/verify-otp-and-login/:mobile/:otp", (req, res) => {
	const otp = req.params.otp
	const mobile = req.params.mobile

	con.query(`select * from verify_otp where mobile=? and otp=? order by id desc limit 1`, [mobile, otp], async (err, result) => {

		if (err) {
			return res.status(500).end(err.message)
		}

		if (result.length == 0) {
			return res.send({ success: false, message: "OTP is wrong" })
		}

		let expiryTime = new Date(result[0].expiryTime)
		let now = new Date()

		if (now > expiryTime) {
			return res.send({ success: false, message: "OTP is expired" })
		}

		const studentId = await getStudentIdByMobileNumber(mobile)

		let token = jwt.sign({
			userId: studentId,
			role: "candidate"
		}, "pinnacle_key", {
			expiresIn: '24h'
		})

		con.query(`delete from verify_otp where mobile=? `, [mobile])

		res.send({
			success: true,
			token,
			userId: studentId,
			message: "Authentication Successful"
		})

	})

})

//Candidate Login
router.get('/candidate-login/:id/:password', (req, res) => {

	con.query(`select * from login where username=? and password=? and role='student'`, [req.params.id, req.params.password], function (err, result) {

		if (err) {
			return res.status(500).end(err.message)
		}

		if (result.length > 0) {

			let token = jwt.sign({
				userId: result[0].id,
				role: "candidate"
			}, "pinnacle_key", {
				expiresIn: '24h'
			})

			res.send({
				success: true,
				userId: result[0].id,
				token,
				message: "Authentication Successful"
			})
		} else
			res.send({
				success: false,
				message: "Authentication Failed"
			})
	});
});


router.delete("/logout", (req, res) => {
	res.send({ message: "Logout Successfully" })
})

//Change Password
router.put("/:userId/password", async (req, res) => {
	const userId = req.params.userId
	const data = req.body
	const currentPassword = data.currentPassword
	const newPassword = data.newPassword
	const confirmPassword = data.confirmPassword

	const existingPassword = await new Promise(resolve => {
		con.query(`select password from login where id=${userId}`, (err, result) => {
			resolve(result[0].password)
		})
	})

	if (existingPassword != currentPassword) {
		return res.send({ status: false, message: 'Current password was wrong' })
	}

	if (newPassword != confirmPassword) {
		return res.send({ status: false, message: "New password and confirm passwords are not Identical" })
	}

	con.query(`update login set password=? where id=?`, [newPassword, userId], (err, result) => {
		if (err)
			return res.status(500).end(err.sqlMessage)
		res.send({ status: result.changedRows > 0, message: "Password changed successfully" })
	})
})

// For Adding and Replacing Permissions
router.get("/permissions", (req, res) => {
	//default_role_permissions
	con.query("select * from erp_users", (err, result) => {
		result.forEach(r => {
			let permissions = JSON.parse(r.permissions)
			permissions = permissions.slice(0, permissions.length - 1)
			//console.log(newJSON)
			let newJSON = JSON.stringify(permissions);
			con.query(`update erp_users set permissions='${newJSON}' where userId=${r.userId} `)
		})
	})
	res.send("Updating")
})

router.post("/send-reset-link", async (req, res) => {
	const email = req.body.email
	const emailRegex = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

	if (!emailRegex.test(String(email).toLowerCase())) {
		return res.send({ success: false, message: "Email format is invalid" })
	}


	con.query(`select studentId from erp_students where email=?`, [email], (err, result) => {

		if (err) {
			return res.status(500).end(err.message)
		}

		if (result.length == 0) {
			return res.send({ success: false, message: "Email does not exist" })
		}

		const token = md5(email + new Date().getTime())
		const link = `<a href="http://localhost:4200/reset-password/?token=${token}">Reset Link</a>`
		let expiryDate = new Date(+new Date() + 86400 * 1000)
		expiryDate = new Date(expiryDate + " UTC").toISOString().slice(0, 19).replace("T", " ")
		con.query(`insert into reset_passwords(email,token,expiry_date) values(?) `, [[email, token, expiryDate]], async (err, result) => {

			if (err) {
				return res.status(500).end(err.message)
			}

			const message = `Hi, You can reset your password at the following link.<br> ${link} `

			try {
				await sendEmail("n190121e@eduotics.com", email, "Reset Password", message)
			} catch (e) {
				return res.status(500).end("Error while sending Email")
			}

			res.send({ success: true, message: "Password reset link sent successfully" })
		})

	})
})

router.put("/reset-password", (req, res) => {
	const newPassword = req.body.newPassword
	const rePassword = req.body.rePassword
	const token = req.body.token

	if (newPassword != rePassword) {
		return res.send({ success: false, message: "Passwords are not Identical" })
	}

	con.query(`select * from reset_passwords where token='${token}' order by id desc limit 1 `, (err, result) => {

		if (err) {
			return res.status(500).end(err.message)
		}

		if (result.length == 0) {
			return res.send({ success: false, message: "Token is wrong" })
		}

		let expiryDate = new Date(result[0].expiry_date)
		let now = new Date()

		if (now > expiryDate) {
			return res.send({ success: false, message: "Token is expired" })
		}

		const email = result[0].email;

		con.query(`update login set password = ? where id = (select studentId from erp_students where email=? )`, [newPassword, email], (err, result) => {

			if (err) {
				return res.status(500).end(err.message)
			}

			con.query(`delete from reset_passwords where token='${token}'`)

			res.send({ success: result.changedRows > 0, message: "Password reset successfully" })

		})
	})
})



//export this router to use in our index.js
module.exports = router;