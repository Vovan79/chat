const http = require('http');
const url = require('url');
const path = require('path');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const server = http.Server(app);
const jwt = require('jsonwebtoken');
const io = require('socket.io')(server);
const socketioJwt = require('socketio-jwt');
const urlencodedParser = bodyParser.urlencoded({extended: false});

const jwtsecret = 'mysecretkey';
let MongoClient, db, collection;
let activeUsers = [];
let activeSockets = [];
let messagesTime = [];
let colors = ["#3366ff", "#002080", "#000000", "#cc33ff", "#730099", "#009900", "#004d00", "#996633", "#604020", "#ff6633", "#992600", "#661a00", "#993366", "#602040", "#cc9900"];

/*app.use('/chat.html', function(request, response, next){
   console.log('Request to chat.html recieved URL: ' + request.originalUrl);
   if(request.originalUrl == '/chat.html') {
        response.sendFile('/home/vova/Work/chat/public/index.html');
        return;
   }
   next();
});*/

app.use(express.static('public'));

//Load the start page by default
app.get('/', function(request, response){
    response.sendFile(__dirname + '/public/index.html');
});
//Load the start page by a /chat route
app.get('/chat', function(request, response){
   console.log('Request to chat recieved'); 
   response.sendFile(__dirname + '/public/index.html'); 
});

app.get('/chat.html', function(request, response){
   console.log('Request to chat recieved'); 
   response.sendFile(__dirname + '/public/index.html'); 
});

//Recieve a post-request from a client 
app.post('/register', urlencodedParser, function (request, response) {
    if(!request.body) {
      return response.sendStatus(400);
    }
    
    let user = {login: request.body.login, password: request.body.password};
    console.log(user);
    
    for(let i = 0; i < activeUsers.length; i++) {
        if(user['login'] == activeUsers[i]['name']) {
            console.log("Этот пользователь уже подключен");
            response.json({userPresence: true, message: "Этот пользователь уже подключен"});
            return false;
        }
    }
    
    //Connect to the datadase
    mongoClient = require('mongodb').MongoClient;
    mongoClient.connect('mongodb://localhost:27017/', function(err, client) {
        if(err) {
            return console.log(err);
        }
        
        db = client.db('usersdb');
        collection = db.collection('users');
        console.log("connection to database success");

        let promise = new Promise(function(resolve, reject) {
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
                error => createUser(user)
            );

        //Create a new user    
        function createUser(user) {
            let newUser = {
                login: user['login'],
                password: user['password'],
                type: 'common'
            } 
            collection.insertOne(newUser, function(err, result) {
                if(err) {
                    return console.log(err);
                }
                else {
                    console.log("Пользователь создан");
                }
                //client.close();
            });
            createToken(newUser['login'], newUser['password'], newUser['type']);
        }

        //Check a password of an user
        function checkPassword(user) {
            collection.find({login: user['login']}).toArray(function(err, results) {
                if(results[0]['password'] !== user['password']) {
                    console.log("Password incorrect");
                    response.json({correctPassword: false, message: "Пароль неверный"});
                }
                else {
                    //console.log("Пользователь добавлен в активные");
                    createToken(results[0]['login'], results[0]['password'], results[0]['type']); 
                }
            });
        }

        //Create the token
        function createToken(name, password, type) {
            const payload = {
                name: name,
                password: password,
                type: type
            }
            const token = jwt.sign(payload, jwtsecret);
            console.log("Создание токена " + JSON.stringify(payload));
            response.json({message: "Получение токена", token: token});
        }
    });      
});

//Start socket connections
io.on('connection', function(socket){
	
    //Authorization of a new socket
    socket.on('auth', function(token) {
        console.log("Сокет вернул токен: " + token);
        jwt.verify(token, jwtsecret, function(err, decoded) {
            if(err) {
                console.log("Верификация по токену неуспешна");
                return false;
            }
            else {
                for(let i = 0; i < activeUsers.length; i++) {
                    if(decoded.name == activeUsers[i]['name']) {
                        console.log("Этот пользователь уже подключен");
                        socket.emit('auth bad');
                        return false;
                    }
                }
                let user = {
                    name: decoded.name, 
                    password: decoded.password,
                    type: decoded.type
                }
                console.log("Connected name: " + user.name + ", password: " + user.password + ", type: " + user.type);
                try {
                    collection.find({login: user.name, password: user.password, type: user.type}).toArray(function(err, results) {
                        if(err) {
                            console.log(err);
                            socket.emit('auth bad');
                        }
                        if(results.length == 0) {
                            console.log("Аутентификация не пройдена");
                            socket.emit('auth bad');
                        }
                        else {
                            console.log("Аутентификация пройдена");
                            console.log("************************************************************");                        
                            socket.data = {name: user.name, type: user.type, color: randomColor(), blocked: false};     //User info to the activeUsers array
                            activeUsers.push({name: socket.data['name'], color: socket.data['color'], blocked: socket.data['blocked']});
                            activeSockets.push(socket);
                            io.emit('new user', activeUsers);
                            socket.emit('set title', user.name);
                            let clients = Object.keys(io.sockets.connected);
                            for(let i = 0; i < clients.length; i++) {
                                console.log("Key of a socket: " + clients[i] + " of the user: '" + activeSockets[i].data['name'] + "'");
                            }           
                        }
                    });    
                }
                catch(err) {
                    console.log("The user is not authorized.");
                }
            }
        }) 
    });

    //Block an user by admin
    socket.on('userBlock clicked', function(name) {
        if(socket.data['type'] === 'admin') {
            console.log("Admin clicked userBlock " + name);
            for(let i = 0; i < activeSockets.length; i++) {
                if(activeSockets[i].data['name'] == name && activeSockets[i].data['type'] != 'admin') {
                    if(activeSockets[i].data['blocked'] == true) {
                        activeSockets[i].data['blocked'] = false;
                        activeUsers[i]['blocked'] = false;
                        io.emit('new user', activeUsers);
                    }
                    else {
                        activeSockets[i].data['blocked'] = true;
                        activeUsers[i]['blocked'] = true;
                        io.emit('new user', activeUsers);    
                    }
                }
            }            
        }
        else {
            return;
        }
    });

    //Delete an user by admin
    socket.on('userBlock dblclicked', function(name) {
        if(socket.data['type'] === 'admin') {
            console.log("Admin clicked userBlock " + name);
            for(let i = 0; i < activeSockets.length; i++) {
                if(activeSockets[i].data['name'] == name && activeSockets[i].data['type'] != 'admin') {
                    activeSockets.splice(i, 1);
                    activeUsers.splice(i, 1);
                    console.log("User '" + name + "' is deleted");
                    io.emit('new user', activeUsers);
                    let clients = Object.keys(io.sockets.connected);
                    let key = clients[i];
                    delete io.sockets.connected[key];
                }
            }
        }
        else {
            return;
        }
    });

    //Print messages in the chat field
    socket.on('chat message', function(msg){
        if(!socket.data) {
            return false;
        }
        if(socket.data['blocked'] === true) {
            return false;
        }

        let realSocket = false;
        for(let i = 0; i < activeSockets.length; i++) {
            if(socket.data['name'] == activeSockets[i].data['name']) {
                realSocket = true;
                break;
            }
        }
        if(!realSocket) {
            return false;
        }
        
        let currentTime = Date.now();
        //console.log("Current time: " + currentTime);
        for(let i = 0; i < messagesTime.length; i++) {
            if(messagesTime[i]['name'] == socket.data['name']) {
                if(currentTime - messagesTime[i]['time'] < 3000) {
                    console.log("Delta: " + (currentTime - messagesTime[i]['time']));
                    return;
                }
                else {
                    messagesTime[i]['time'] = currentTime;
                    io.emit('chat message', {name: socket.data['name'], msg: msg.substr(0, 5), color: socket.data['color']});
                    return; 
                }
            }    
        }
        let msgNameTime = {
            name: socket.data['name'],
            time: currentTime
        }
        messagesTime.push(msgNameTime);
        io.emit('chat message', {name: socket.data['name'], msg: msg.substr(0, 5), color: socket.data['color']});
        console.log('message: ' + msg);
    });
    
    //Disconnect of a socket  	
    socket.on('disconnect', function() {
        if(!socket.data) {
            console.log("The user is not authorized.");
            return false;
        }
        for(let i = 0; i < activeSockets.length; i++) {
            if(activeSockets[i].data['name'] == socket.data['name']) {
                activeSockets.splice(i, 1);
                activeUsers.splice(i, 1);
                console.log(socket.data['name'] + " disconnected");
                io.emit('new user', activeUsers);
            }
            else {
                return;
            }
        }
        let clients = Object.keys(io.sockets.connected);
        for(let i = 0; i < clients.length; i++) {
            console.log(clients[i]);
        }    
    });
});

server.listen(3000, function() {
	console.log("Listening port");
});

//Choose a color for an user
function randomColor() {
	let num = Math.floor(Math.random()*15);
	return colors[num];
}