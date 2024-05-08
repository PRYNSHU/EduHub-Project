const con = require("./db")
const nodemailer = require('nodemailer');

function getUserActiveSession(userId) {
	return new Promise(resolve => {
		con.query(`select sessionId from session_active where userId=${userId}`, (err, result) => {

			if (err) {
				console.log(err)
			}

			resolve(result[0] ? result[0].sessionId : null)
		})
	})
}

function sendEmail(from, to, subject, message) {
	return new Promise((resolve, reject) => {
		const transporter = nodemailer.createTransport({
			host: 'lo10.pwh-r1.com',
			port: 587,
			secure: false,
			auth: {
				user: '_mainaccount@eduotics.com',
				pass: '4ppyYcXM_B2ICQ'
			}
		});

		const mailOptions = {
			from,
			to,
			subject,
			html: message
		};

		transporter.sendMail(mailOptions, function (error, info) {
			if (error) {
				reject(error)
			} else {
				resolve(info)
			}
		});
	})
}

module.exports = { getUserActiveSession, sendEmail }