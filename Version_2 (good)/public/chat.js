function $(a) {
	return document.getElementById(a);
}

let activeUsers = [];
let token = localStorage.getItem('token');
localStorage.setItem('token', '');
let socket = io();
socket.emit('auth', token);		//Authorization by the socket with the token
token = "";

//Set thetitle of the page
socket.on('set title', function(name) {
	let title = document.querySelector('title');
	title.innerText = "myChat - " +  name;	
});

//Set a default page if the auth was bad
socket.on('auth bad', function() {
	window.open('index.html', '_self');
})

//Create userBlocks in the userField
socket.on('new user', function(data) {
	//localStorage.setItem('token', '');
	//token = "";
	let userBlocks = $('userField').childNodes;
	let len = userBlocks.length;
	for(let i = 0; i < len; i++) {
		$('userField').removeChild(userBlocks[len - 1 - i]);	
	}
	console.log(data.length);
	for(let i = 0; i < data.length; i++) {
			let userBlock = document.createElement('div');
			userBlock.setAttribute('id', data[i]['name']);
			if(data[i]['blocked'] == true) {
				userBlock.classList.add('blocked');
			}
			userBlock.innerText = data[i]['name'];
			userBlock.style.background = data[i]['color'];
			userBlock.onclick = function() {
				console.log("User block name: " + data[i]['name']);
				socket.emit('userBlock clicked', data[i]['name']);
			}
			userBlock.ondblclick = function() {
				console.log("User block name: " + data[i]['name']);
				socket.emit('userBlock dblclicked', data[i]['name']);
			}
			$('userField').appendChild(userBlock);
		}
	activeUsers = data;
});

$('m').onkeydown = function(e) {
	let str = this.value;
	if(str.length > 9 && e.keyCode != 8 && e.keyCode != 13) {
		return false;	
	} 
}

$('chatform').onsubmit = function(){
	socket.emit('chat message', $('m').value);
	$('m').value = '';
	$('m').setAttribute("disabled", true);
	setTimeout(function() {
		$('m').removeAttribute("disabled");
		$('m').focus();
	},1000);
	return false;
}

socket.on('chat message', function(data) {
	let newLi = document.createElement('li');
	newLi.innerHTML = data['name'] + ": " + data['msg'];
	newLi.style.color = data['color'];
	$('messages').appendChild(newLi);
	let scroll = $('msgField').scrollHeight - $('msgField').clientHeight;
	if(scroll > 0) {
		$('msgField').scrollBy(0, scroll);
	}
});

/*socket.on('set editable', function() {
	setEditable();
});*/

/*socket.on('user blocked', function(name) {
	var userBlocks = document.querySelectorAll('.activeUsers');
	for(var i = 0; i < userBlocks.length; i++) {
		if(userBlocks[i].getAttribute('id') == name) {
			userBlocks[i].classList.add('blocked');
		}
	}
});*/

/*socket.on('upgrade user blocks', function(data) {
	activeUsers = data;
	for(var i = 0; i < activeUsers.length; i++) {
		if(activeUsers[i]['blocked'] == true) {
			$(activeUsers[i]['name']).classList.add('blocked');
			if(socket['name'] == activeUsers[i]['name']) {
				$('m').setAttribute("disabled", true);
			}
		}
		else {
			$(activeUsers[i]['name']).classList.remove('blocked');
			if(socket['name'] == activeUsers[i]['name']) {
				$('m').removeAttribute("disabled");
			}
		}
	}
});*/

/*function showActiveUsers(users) {
	let userBlocks = $('userField').childNodes;
	for(let i = 0; i < userBlocks.length; i++) {
		$('userField').removeChild(userBlocks[i]);	
	}
	console.log(users.length);
	for(var i = 0; i < users.length; i++) {
			var userBlock = document.createElement('div');
			userBlock.setAttribute("id", users[i]["name"]);
			userBlock.setAttribute("data-type", users[i]["type"]);
			userBlock.classList.add('activeUsers');
			if(users[i]["blocked"] == true) {
				userBlock.classList.add('blocked');
			}
			userBlock.innerText = users[i]["name"];
			userBlock.style.background = users[i]["color"];
			$('userField').appendChild(userBlock);
		}
		activeUsers = users;


	if(activeUsers.length == 0) {
		for(var i = 0; i < users.length; i++) {
			var userBlock = document.createElement('div');
			userBlock.setAttribute("id", users[i]["name"]);
			userBlock.setAttribute("data-type", users[i]["type"]);
			userBlock.classList.add('activeUsers');
			if(users[i]["blocked"] == true) {
				userBlock.classList.add('blocked');
			}
			userBlock.innerText = users[i]["name"];
			userBlock.style.background = users[i]["color"];
			$('userField').appendChild(userBlock);
		}
		activeUsers = users;
	}
	else {
		var userBlock = document.createElement('div');
		userBlock.setAttribute("id", users[users.length - 1]["name"]);
		userBlock.setAttribute("data-type", users[users.length - 1]["type"]);
		userBlock.classList.add('activeUsers');
		userBlock.innerText = users[users.length - 1]["name"];
		userBlock.style.background = users[users.length - 1]["color"];
		$('userField').appendChild(userBlock); 	
	}
}*/

/*function setEditable() {
	var userBlocks = document.querySelectorAll('.activeUsers');
	console.log("activeUsers: " + userBlocks.length);
	for(var i = 0; i < userBlocks.length; i++) {
		console.log("Type of active user: " + userBlocks[i].getAttribute('data-type'));
		if(userBlocks[i].getAttribute('data-type') == "common") {
			userBlocks[i].classList.add('editable');
			userBlocks[i].onclick = function() {
				socket.emit('user blocked', this.getAttribute('id'));
			}
			userBlocks[i].ondblclick = function() {
				console.log('Deleting user ' + this.getAttribute('id'));
				socket.emit('user deleted', this.getAttribute('id'));
			}
		}
	}
}*/