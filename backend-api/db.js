var mysql = require('mysql');
var con = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "",
	database: "e_learning_database",
	multipleStatements: true
});

con.connect(function (err) {
	if (err) throw err;
});

module.exports = con;