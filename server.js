var app = require('./app');
var http = require('http');

var ipaddress = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;

app.set('port', port);

var server = http.createServer(app);

server.listen(port,ipaddress, function () {
  console.log('listening on port ' + port);
});