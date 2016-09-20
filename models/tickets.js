var mysql = require('mysql');
var async = require('async');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'db_ticket'
});


function parseDate(y,d,m){
	if(d/10 < 1){ d = '0' + d; }
	if(m/10 < 1){ m = '0' + m; }
	return y + "-" + m + "-" + d;
}

function post_comment(params, callback){
	var query = connection.query('INSERT INTO comments SET ?', params, function(err, result) {
	  get_comment(result.insertId,['id','ticketId','created_at','updated_at','score','message'],callback)
	});
}

function get_comment(id,column,callback){
	var comment = {};
	var str = "SELECT ?? from comments where id =" + id;
	var query = connection.query(str,[column])
	.on('result', function(row,index){
		comment.comment = row;
	})
	.on('end', function(){
		callback(comment);
	});
}

function get_comments(id,column,callback){
	var comment = {};
	var comments = [];
	var str = "SELECT ?? from comments INNER JOIN tickets ON comments.ticketId = tickets.id where ticketId =" + id;
	var query = connection.query(str,[column])
	.on('result', function(row,index){
		comments.push(row);
	})
	.on('end', function(){
		comment.comment = comments;
		callback(comment);
	});
}

function get_ticket_comment(r,column,callback){
	var sum=0, count=0;
	var str = "SELECT ?? from comments where ticketId =" + r.ticket.id;
	var sr = {};
	var comment = [];
	var query = connection.query(str,[column])
	.on('result', function(row,index){
		comment.push(row);
		sum += row.score;
		count++;
	})
	.on('end', function(){
		sr.average_score = sum/count || "";
		sr.comments = comment;
		r.ticket.satisfaction_rating = sr;
		callback(r);
	});
}

function get_tickets_comment(r,column,cb){
	async.each(r.ticket, function(item, callback){
	    addComments(item,column,function(data){
	    	callback();
	    });
	},function(err){
		cb(r);
	});
}

function addComments(item,column,cb){
	var sum=0, count=0;
	var sr = {};
	var comment = [];
	var str = "SELECT ?? from comments where ticketId =" + item.id;
	var query = connection.query(str,[column])
	.on('result', function(row,index){
		comment.push(row);
		sum += row.score;
		count++;
	})
	.on('end', function(){
		sr.average_score = sum/count || "";
		sr.comments = comment;
		item.satisfaction_rating = sr;
		cb(item);
	});
}

function select_ticket(id,column,cb){
	var t = {};
	var count = 0;
	var str = "SELECT ?? FROM tickets where id =" + id;
	var query = connection.query(str,[column[0]])
	.on('result',function(row, index){
		connection.pause();
		t.ticket = row;
		get_ticket_comment(t,column[1],cb);
    	connection.resume();
	})
	.on('end', function(){
		if(t.ticket===null||t.ticket===undefined){
			cb({"error":"no result found"});
		}
	});
}

function select_tickets(query, column, cb){
	var t = {};
	t.ticket = [];
	if(Object.keys(query).length !== 0){
		switch(Object.keys(query)[0]){
			case 'status':
			case 'email':
			case 'priority':
				var str = "SELECT ?? FROM tickets where " + Object.keys(query)[0] + " = '" + query[Object.keys(query)[0]] + "'";
				break;
			case 'satisfaction_rating':
				var range = query[Object.keys(query)[0]].split(" ");
				column[0].push('score');
				if(range.length > 1){
					var str = "SELECT avg(score) as average_score, ?? FROM tickets LEFT JOIN comments ON tickets.id = comments.ticketId having avg(score) >= " + range[0] + " AND avg(score) <= " + range[1];
				}else{
					var str = "SELECT avg(score) as average_score, ?? FROM tickets LEFT JOIN comments ON tickets.id = comments.ticketId having avg(score) = " + range[0];
				}
				console.log(str)
				break;
			case 'created_at':
			case 'updated_at':
				var dates = query[Object.keys(query)[0]].split(" ");
				var dt = new Date(dates[0]);
				var today = parseDate(dt.getFullYear(),dt.getDate(),dt.getMonth()+1);
				if(dates[1]!=null||dates[1]!=undefined){
					var dt = new Date(dates[1]);
					dt.setDate(dt.getDate() + 1);
					tomorrow = parseDate(dt.getFullYear(),dt.getDate(),dt.getMonth()+1);
				}else{
					dt.setDate(dt.getDate() + 1);
					var tomorrow = parseDate(dt.getFullYear(),dt.getDate(),dt.getMonth()+1);
				}
				
				var str = "SELECT ?? FROM tickets where " + Object.keys(query)[0] + " >= '" + today + "' AND " + Object.keys(query)[0] + " < '" + tomorrow + "'";
				console.log(str)
			break;		
		}
	}else{
		var str = "SELECT ?? FROM tickets";
	}
	var query = connection.query(str,[column[0]])
	.on('result',function(row, index){
		connection.pause();
		delete row.average_score;
		t.ticket.push(row);
    	connection.resume();
	})
	.on('end', function(){
		if(t.ticket.length<=0){
			cb({"error":"no result found"});
		}else{
			get_tickets_comment(t,column[1],cb);
		}
	});
}

module.exports = {
	loginUser : function(params,cb) {
		connection.connect();
		var str = "SELECT username, password, user_role from users where username = '" + params.username + "' and  password = '"+ params.password +"'";
		connection.query(str, function(err, rows, fields) {
		if (err) throw err;
			cb(rows);
		});//
		connection.end();
	},
	createUser : function(params, cb){
		connection.connect();
		var str = "SELECT * from users where username = '" + params.username + "' and  password = '"+ params.password +"'";
		connection.query(str, function(err, rows, fields) {
		if (err) throw err;
			if(rows.length > 0){ 
				cb({"error":"already exist"}) 
				return;
			}
		});

		var query = connection.query('INSERT INTO users SET ?', params, function(err, result) {
		  cb({"success":"user created"});
		});
		connection.end();	
	},
	createTicket : function(params, cb){
		var id = 1;
		connection.connect();
		/*var query = connection.query('INSERT INTO tickets SET ?', params, function(err, result) {
		});*/
		var col = [];
		col.push(["id","type","email","subject","created_at","updated_at","description","priority","status"]);
		col.push(['comment','score']);
		select_ticket(id,col,cb);
		//connection.end();	
	},
	getTicket : function(id, cb){
		var col = [];
		col.push(["id","type","email","subject","created_at","updated_at","description","priority","status"]);
		col.push(['id','ticketId','created_at','updated_at','score','message']);
		select_ticket(id,col,cb);
	},
	updateTicket : function(id, params, cb){
		var query = connection.query('UPDATE tickets SET updated_at = now(), status = ? , description = ? where id = ?', [params.status,params.description,id], function(err, result) {
		 	var col = [];
			col.push(["id","type","email","subject","created_at","updated_at","description","priority","status"]);
			col.push(['id','ticketId','created_at','updated_at','score','message']);
			select_ticket(id,col,cb);
		});
	},
	deleteTicket : function(id, cb){
		var query = connection.query('DELETE FROM tickets where id = ?', [id], function(err, result) {
		 	if(result.affectedRows > 0){
		 		var query2 = connection.query('DELETE FROM comments where ticketId = ?', [id], function(err, result) {
		 			cb({success:true})
		 		})
		 	}
		 	else{
		 		cb({success:false})
		 	}
		});
	},
	getTicketList : function(q,cb){
		var col = [];
		col.push(["tickets.id","type","email","subject","tickets.created_at","tickets.updated_at","description","priority","status"]);
		col.push(['id','ticketId','created_at','updated_at','score','message']);
		select_tickets(q, col, cb);
	},
	getComment : function(id,cb){
		get_comment(id,['id','ticketId','created_at','updated_at','score','message'],cb);
	},
	getListComment : function(id, cb){
		get_comments(id,['comments.id','comments.ticketId','comments.created_at','comments.updated_at','score','message'],cb)
	},
	postComment : function(body, cb){
		post_comment(body,cb);
	},
	updateComment : function(id, body, cb){
		var query = connection.query('UPDATE comments SET updated_at = now(), score = ? , message = ? where id = ?', [body.score,body.message,id], function(err, result) {
		 	get_comment(id,['id','ticketId','created_at','updated_at','score','message'],cb);
		});
	},
	deleteComment : function(id, cb){
		var query = connection.query('DELETE FROM comments where id = ?', [id], function(err, result) {
		 	if(result.affectedRows > 0){
		 		cb({success:true})
		 	}
		 	else{
		 		cb({success:false})
		 	}
		});		
	}
}