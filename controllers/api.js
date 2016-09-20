var express = require('express');
var ticket = require('../models/tickets');
var router = express.Router();

/* GET users listing. */
router.post('/login', function(req, res, next) {
	//res.setHeader('Access-Control-Allow-Origin','*')
	ticket.loginUser(req.body, function(data){
		res.json(data[0]);
	})
})
.post('/create', function(req, res, next) {
	ticket.createUser(req.body, function(data){
		if(data!=null||data!=undefined){
			res.status(201).json(data);
		}else{
			res.status(500).json({"error" : "already exist"});
		}
	})
})
.post('/', function(req, res, next){
	ticket.createTicket(req.body, function(data){
		res.json(data);
		res.end();
	})	
})
.post('/:id/update', function(req, res, next){
	ticket.updateTicket(req.params.id, req.body, function(data){
		res.json(data);
		res.end();
	})
})
.post('/:id/delete', function(req, res, next){
	ticket.deleteTicket(req.params.id, function(data){
		res.json(data);
		res.end();
	})
})
.get('/:id', function(req, res, next){
	if(req.params.id!='list'){
		ticket.getTicket(req.params.id, function(data){
			res.json(data);
			res.end();
		})
	}else{
		next();
	}
})
.get('/list', function(req, res, next) {
	ticket.getTicketList(req.query,function(data){
		res.json(data);
		res.end();
	})
})
.post('/comment', function(req, res, next){
	console.log(req.params)
	ticket.postComment(req.body, function(data){
		res.json(data);
		res.end();
	});
})
.get('/comment/:id', function(req, res, next){
	ticket.getComment(req.params.id, function(data){
		res.json(data);
		res.end();
	});
})
.post('/comment/:id/update', function(req, res, next){
	ticket.updateComment(req.params.id, req.body,function(data){
		res.json(data);
		res.end();
	});
})
.post('/comment/:id/delete', function(req, res, next){
	ticket.deleteComment(req.params.id,function(data){
		res.json(data);
		res.end();
	});
})
.get('/:id/comment', function(req, res, next){
	ticket.getListComment(req.params.id, function(data){
		res.json(data);
		res.end();
	});
})

module.exports = router;
