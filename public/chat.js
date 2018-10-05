$ = (a) => document.getElementById(a);

let activeUsers = [];
let token = localStorage.getItem('token');
localStorage.setItem('token', '');
let socket = io();
socket.emit('auth', token);		//Authorization by the socket with the token
token = "";

//Set thetitle of the page
socket.on('set title', (name) => {
	let title = document.querySelector('title');
	title.innerText = "myChat - " +  name;	
});

//Set a default page if the auth was bad
socket.on('auth bad', () => {
	window.open('index.html', '_self');
});

//Create userBlocks in the userField
socket.on('new user', (data) => {
	let userBlocks = $('userField').childNodes;
	let len = userBlocks.length;
	for(let i = 0; i < len; i++) {
		$('userField').removeChild(userBlocks[len - 1 - i]);	
	}
	for(let i = 0; i < data.length; i++) {
			let userBlock = document.createElement('div');
			userBlock.setAttribute('id', data[i]['name']);
			if(data[i]['blocked'] == true) {
				userBlock.classList.add('blocked');
			}
			userBlock.innerText = data[i]['name'];
			userBlock.style.background = data[i]['color'];
			userBlock.onclick = () => {
				console.log("User block name: " + data[i]['name']);
				socket.emit('userBlock clicked', data[i]['name']);
			}
			userBlock.ondblclick = () => {
				console.log("User block name: " + data[i]['name']);
				socket.emit('userBlock dblclicked', data[i]['name']);
			}
			$('userField').appendChild(userBlock);
		}
	activeUsers = data;
});

$('m').onkeydown = (e) => {
	let str = this.value;
	if(str.length > 9 && e.keyCode != 8 && e.keyCode != 13) {
		return false;	
	} 
}

$('chatform').onsubmit = () => {
	socket.emit('chat message', $('m').value);
	$('m').value = '';
	$('m').setAttribute("disabled", true);
	setTimeout(() => {
		$('m').removeAttribute("disabled");
		$('m').focus();
	}, 1000);
	return false;
}

socket.on('chat message', (data) => {
	let newLi = document.createElement('li');
	newLi.innerHTML = data['name'] + ": " + data['msg'];
	newLi.style.color = data['color'];
	$('messages').appendChild(newLi);
	let scroll = $('msgField').scrollHeight - $('msgField').clientHeight;
	if(scroll > 0) {
		$('msgField').scrollBy(0, scroll);
	}
});