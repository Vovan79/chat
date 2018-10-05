var http = require('http');
var path = require('path');
var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var server = http.Server(app);
var io = require('socket.io')(server);
 
// создаем парсер для данных application/x-www-form-urlencoded
var urlencodedParser = bodyParser.urlencoded({extended: false});
 
app.use(express.static(__dirname + "/public"));
 
app.post("/register", urlencodedParser, function (request, response) {
    if(!request.body) return response.sendStatus(400);
    console.log(request.body);
    response.sendFile(__dirname + '/public/chat.html');
//  response.send(`${request.body.login} - ${request.body.password}`);
});
 
app.get("/", function(request, response){
    response.sendFile(__dirname + '/index.html');
});
 
//app.listen(3000);
server.listen(3000, function() {
	console.log("Listening port");
});