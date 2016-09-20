var mysql = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'studentapi'
});


module.exports.students = {
	getAll : function(cb){
		connection.connect();
		connection.query('SELECT * from students', function(err, rows, fields) {
		if (err) throw err;
			cb(rows);
		});
		connection.end();
		
	}
}