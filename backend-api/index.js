const express = require('express')
const app = express();
const port = 3000;

const jwt = require('jsonwebtoken');

/**Cookie Parser */
const cookieParser = require('cookie-parser');
app.use(cookieParser())

/*File Upload */
const fileUpload = require('express-fileupload');
app.use(fileUpload())

const bodyParser = require('body-parser')
app.use(bodyParser.json({
   limit: '150mb',
   extended: true,
   parameterLimit: 2100
}))

// support json encoded bodies
app.use(bodyParser.urlencoded({
   limit: '150mb',
   extended: true,
   parameterLimit: 2100
})) // support encoded bodies

/* CORS */
var cors = require('cors')
app.use(cors({ origin: "*"}))

const biometric = require("./routes/biometric.js")
app.use("/biometric", biometric);

const login = require("./routes/login.js")
app.use("/login", login)

const uploadVSTO = require('./routes/admin/uploadvsto.js')
app.use("/uploadvsto", uploadVSTO)

const getCMS = require('./routes/get-cms.js')
app.use("/get-cms", getCMS)



const newRegistration = require('./routes/new-registration.js')
app.use("/new-registration",newRegistration)

app.get("/verify-token/:role", (req, res) => {
   const role = req.params.role
   const requestToken = req.query.token
   jwt.verify(requestToken, "pinnacle_key", (err, result) => {

      if (err) {
         res.send({ status: false })
      } else {
         res.send({ status: result.role == role })
      }
   })
})

/*JWT token Verify Middleware */
app.use((req, res, next) => {
   let requestToken = req.query.token
   jwt.verify(requestToken, "pinnacle_key", (err, result) => {

     if(req.path.includes("for-eduotics")){
        return next()
     }

      if (err) {
         res.status(500).end("Invalid Token")
      } else {
         res.locals.userId = result.userId
         next()
      }

   })
})

app.get("/get-token-for-user-by-admin/:id/", (req, res) => {
   const requestToken = req.query.token
   jwt.verify(requestToken, "pinnacle_key", (err, result) => {

      if (result.role != "admin") {
         res.status(403).end("Only Admin Can Access");
      } else {
         const token = jwt.sign({
            userId: req.params.id,
            role: "candidate"
         }, "pinnacle_key", {
            expiresIn: '10m'
         })
         res.send({ status: true, token })
      }
   })
})

const fullCourse = require('./routes/full-course.js')
app.use('/full-courses',fullCourse)

const taggers = require('./routes/taggers.js')
app.use('/taggers',taggers)

const courses = require('./routes/admin/courses.js');
app.use("/courses", courses);

const subjects = require('./routes/admin/subjects.js');
app.use("/subjects", subjects);

const test = require('./routes/admin/test.js');
app.use("/test", test);

const candidate = require('./routes/candidate.js');
app.use("/candidate", candidate.router);

const users = require('./routes/users/users.js');
app.use("/users", users);

const noticeboard = require('./routes/noticeboard.js');
app.use("/noticeboard", noticeboard);

const onlineLectures = require('./routes/online-lectures.js');
app.use("/online-lectures", onlineLectures);

const utilities = require('./routes/utilities.js');
app.use("/utilities", utilities);

const reports = require('./routes/reports.js');
app.use('/reports', reports);

const reception = require('./routes/reception.js');
app.use('/reception', reception);

const offlineExams = require('./routes/offline-exams.js');
app.use('/offline-exams', offlineExams);

const assignments = require('./routes/assignments.js');
app.use('/assignments', assignments);

const permissions = require('./routes/permissions.js');
app.use('/permissions', permissions);

const schedule = require('./routes/schedule.js');
app.use('/schedule', schedule);

const fees = require("./routes/fees.js")
app.use("/fees", fees)

const leaves = require("./routes/leaves.js")
app.use("/leaves", leaves)

const cms = require("./routes/cms.js")
app.use("/cms", cms)

const studentAttendance = require("./routes/student-attendance.js")
app.use("/student-attendance", studentAttendance)

const library = require("./routes/library.js")
app.use("/library", library)

const contact = require("./routes/contact-inquiries.js")
app.use("/contact-inquiries", contact)

app.all('*', function (req, res) {
   res.status(404).send("Invalid URL Requested &ldquo;" + req.url + "&rdquo;");
});

app.listen(port, 'localhost', () => console.log(`Example app listening at http://localhost:${port}`))