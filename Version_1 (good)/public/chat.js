var socket = io();

function $(a) {
	return document.getElementById(a);
}

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

socket.on('chat message', function(data) {
	var newLi = document.createElement('li');
	newLi.innerHTML = data["name"] + ": " + data["msg"];
	newLi.style.color = data["color"];
	$('messages').appendChild(newLi);  				
});	