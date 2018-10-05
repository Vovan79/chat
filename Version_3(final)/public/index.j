$ = (a) => document.getElementById(a);

$('login').oninput = () => {
	let login = $('login').value;
	if(checkLogin(login) === true) 
		$('password').removeAttribute("disabled");
}

$('password').oninput = () => {
	let password = $('password').value;
	if(checkPassword(password) === true) 
		$('sendButton').removeAttribute("disabled");
};

$('loginform').onsubmit = (e) => {
	e.preventDefault();
	let login = $('login').value;
	let password = $('password').value;
	
	//Create a http-request to the server
	let xhr = new XMLHttpRequest();
	let body = 'login=' + encodeURIComponent(login) + '&password=' + encodeURIComponent(password);
	xhr.open("POST", '/register', true);
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.onreadystatechange = function() {
		if (xhr.readyState != 4) return;
		if (xhr.status != 200) {
    		alert(xhr.status + ': ' + xhr.statusText);
  		} 
  		else {
  			let response = JSON.parse(xhr.response);
  			if(response['userPresence'] === true) {
  				alert(response['message']);
  				$('login').value = "";
  				$('password').value = "";
  				$('login').focus();
  				$('password').setAttribute("disabled", true);
  				$('sendButton').setAttribute("disabled", true);
  				return;
  			}
  			if(response['correctPassword'] === false) {
  				alert(response['message']);
  				$('password').value = "";
  				$('password').focus();
  				$('sendButton').setAttribute("disabled", true);
  				return;
  			}
			let serverTokenResponse = JSON.parse(xhr.response);
			let token = serverTokenResponse['token'];
			localStorage.setItem('token', token);
			window.open('chat.html', '_self');
  		}
	}
	xhr.send(body);
}

checkLogin = (name) => {
	const regexp = /[\[\\\^\$\.\|\&\*\+\(\)]/;
	if(regexp.test(name)) {
		console.log("Присутствуют спецсимволы");
		alert("Нельзя использовать спецсимволы");
		$('password').setAttribute("disabled", true);
		return false;
	}
	if(name.length < 3) {
		$('password').setAttribute("disabled", true);
		return false;
	}
	return true;
}

checkPassword = (value) => {
	if(value.length < 3) {
		$('sendButton').setAttribute("disabled", true);
		return false;	
	}
	return true;
}