var http = require('http');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var server = http.Server(app);
var jwt = require('jsonwebtoken');
var io = require('socket.io')(server);
var urlencodedParser = bodyParser.urlencoded({extended: false});

var secret = 'mysecretkey';
var activeUsers = [];
var sockets = [];
var colors = ["#3366ff", "#002080", "#000000", "#cc33ff", "#730099", "#009900", "#004d00", "#996633", "#604020", "#ff6633", "#992600", "#661a00", "#993366", "#602040", "#cc9900"];
 
app.use(express.static(__dirname + "/public"));

//Load the start page
app.get("/", function(request, response){
    response.sendFile(__dirname + '/index.html');
});

//Recieve a post-request from a client 
app.post("/register", urlencodedParser, function (request, response) {
    if(!request.body) 
      return response.sendStatus(400);
    
    var user = {login: request.body.login, password: request.body.password};
    console.log(user);
    for(var i = 0; i < activeUsers.length; i++) {
        if(user["login"] == activeUsers[i]["login"]) {
            console.log("Этот пользователь уже подключен");
            response.send("Этот пользователь уже подключен");
            return false;
        }
    }
    
    //Connect to the datadase
    var mongoClient = require('mongodb').MongoClient;
    mongoClient.connect("mongodb://localhost:27017/", function(err, client) {
        if(err) {return console.log(err);}
        console.log("connection to database success");

        var db = client.db("usersdb");
        var collection = db.collection("users");
        var promise = new Promise(function(resolve, reject) {
                collection.find({login: user['login']}).toArray(function(err, results) {
                    if(err) {
                        console.log(err);
                    }
                    if(results.length == 0) {
                        reject(console.log("Пользователь не существует"));
                    }
                    else {
                        resolve(console.log("Пользователь существует"));
                    }
                });
            }); 

        promise
            .then(
                result => checkPassword(user),
                error => {
                    createUser(user);
                    console.log("Пользователь создан");
                    response.send("login: " + user["login"]);
                }
            );

        function createUser(user) { 
            collection.insertOne(user, function(err, result) {
                if(err) {return console.log(err);}
            client.close();
            });
        }
        function checkPassword(user) {
            collection.find({login: user["login"]}).toArray(function(err, results) {
                if(results[0]["password"] !== user["password"]) {
                    console.log("Password incorrect");
                    response.send("Пароль неверный");
                }
                else {
                    //activeUsers.push(user);
                    console.log("Пользователь добавлен в активные"); 
                    /*var options = {
                        data: {login: user["login"]}
                    } */  
                    //response.sendFile(__dirname + '/public/chat.html');
                    response.send("login:" + user["login"]);
                }
            });
        }
    });      
});

io.on('connection', function(socket){
	console.log('a new user connected');
  	
    socket.on('disconnect', function() {
        var name = this.data["name"];
        console.log('user ' + name + ' disconnected');
        for(var i = 0; i < activeUsers.length; i++) {
            if(activeUsers[i]["name"] == name)
                activeUsers.splice(i, 1);
        }
        io.emit('user disconn', [activeUsers, name]);
    })

    socket.on('register socket', function(name) {
        console.log("Зарегестрирован сокет " + name);
        socket.data = {name: name, color: randomColor()};
        activeUsers.push(socket.data);
        io.emit('new user', activeUsers);
    })

  	socket.on('chat message', function(msg){
    	io.emit('chat message', {name: socket.data["name"], msg: msg, color: socket.data["color"]});
    	console.log('message: ' + msg);
  	});
});

server.listen(3000, function() {
	console.log("Listening port");
});

function randomColor() {
	var num = Math.floor(Math.random()*15);
	return colors[num];
}