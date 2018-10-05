function $(a) {
	return document.getElementById(a);
}

$('login').oninput = function() {
	var login = this.value;
	console.log(login);
	if(checkLogin(login) === true) 
		$('password').removeAttribute("disabled");
};

$('password').oninput = function() {
	var password = this.value;
	if(checkPassword(password) === true) 
		$('sendButton').removeAttribute("disabled");
};

$('loginform').onsubmit = function(e) {
	e.preventDefault();
	var login = $('login').value;
	var password = $('password').value;
	
	//Create a http-request to the server
	var xhr = new XMLHttpRequest();
	var body = 'login=' + encodeURIComponent(login) + '&password=' + encodeURIComponent(password);
	xhr.open("POST", '/register', true);
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.onreadystatechange = function() {
		if (xhr.readyState != 4) return;
		if (xhr.status != 200) {
    		alert(xhr.status + ': ' + xhr.statusText);
  		} 
  		else {
  			if(xhr.responseText === "Пароль неверный") {
  				alert("Пароль неверный");
  				$('password').value = "";
  				$('password').focus();
  				$('sendButton').setAttribute("disabled", true);
  				return;
  			}
  			if(xhr.responseText === "Этот пользователь уже подключен") {
  				alert("Этот пользователь уже подключен");
  				$('login').value = "";
  				$('password').value = "";
  				$('login').focus();
  				$('password').setAttribute("disabled", true);
  				$('sendButton').setAttribute("disabled", true);
  				return;
  			}
  			if(xhr.responseText.indexOf('login') != -1) {
  				//window.location = "chat.html";
  				console.log(xhr.responseText.slice(6));
  				startChat(xhr.responseText.slice(6));
  				return;
  			}
  		}
	}
	xhr.send(body);
	console.log(body);
}

function checkLogin(name) {
	var regexp = /[\[\\\^\$\.\|\&\*\+\(\)]/;
	if(regexp.test(name)) {
		console.log("Присутствуют спецсимволы");
		$('password').setAttribute("disabled", true);
		return false;
	}
	if(name.length < 3) {
		console.log("Имя слишком короткое");
		$('password').setAttribute("disabled", true);
		return false;
	}
	return true;
}

function checkPassword(value) {
	if(value.length < 3) {
		$('sendButton').setAttribute("disabled", true);
		return false;	
	}
	return true;
}

//===========================================================================================

function startChat(name) {
	$('loginform').remove();
	$('chatsection').style.display = "block";
	$('m').focus();

	var activeUsers = [];
	var name = name;
	var socket = io();
	socket.emit('register socket', name);

	$('chatform').onsubmit = function(){
		socket.emit('chat message', $('m').value);
		$('m').value = '';
		$('m').setAttribute("disabled", true);
		setTimeout(function() {
			$('m').removeAttribute("disabled");
			$('m').focus();
		},3000);
		return false;
	}
	$('m').onkeydown = function(e) {
		var str = this.value;
		if(str.length > 10 && e.keyCode != 8 && e.keyCode != 13) {
			return false;	
		} 
	}
	
	console.log("DIV " + $('msgField').clientHeight);
	console.log("DIVScroll " + $('msgField').scrollHeight);
	
	socket.on('chat message', function(data) {
		var newLi = document.createElement('li');
		newLi.innerHTML = data["name"] + ": " + data["msg"];
		newLi.style.color = data["color"];
		$('messages').appendChild(newLi);
		var scroll = $('msgField').scrollHeight - $('msgField').clientHeight;
		if(scroll > 0) {
			$('msgField').scrollBy(0, scroll);
		}
		console.log("DIV " + $('msgField').clientHeight);
		console.log("DIVScroll " + $('msgField').scrollHeight);
		console.log(scroll);
	});	

	socket.on('new user', function(data) {
		showActiveUsers(data);
	});

	socket.on('user disconn', function(data) {
		activeUsers = data[0];
		var name = data[1];
		$('ID'+name).remove();
	})

	function showActiveUsers(users) {
		if(activeUsers.length == 0) {
			for(var i = 0; i < users.length; i++) {
				var userBlock = document.createElement('div');
				userBlock.setAttribute("id", "ID"+users[i]["name"]);
				userBlock.classList.add('activeUsers');
				userBlock.innerText = users[i]["name"];
				userBlock.style.background = users[i]["color"];
				$('userField').appendChild(userBlock);
			}
			activeUsers = users;
			console.log(activeUsers);
			console.log(activeUsers.length);					
		}
		else {
			console.log(activeUsers);
			console.log(activeUsers.length);
			var userBlock = document.createElement('div');
			userBlock.setAttribute("id", "ID"+users[users.length - 1]["name"]);
			userBlock.classList.add('activeUsers');
			userBlock.innerText = users[users.length - 1]["name"];
			userBlock.style.background = users[users.length - 1]["color"];
			$('userField').appendChild(userBlock); 	
		}
	}
}