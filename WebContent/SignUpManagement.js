/**
 * signUp management
 */

(function() {
	document.getElementById("signUpButton").addEventListener('click', (e) => {
		var form = e.target.closest("form");
		if (form.checkValidity()) {
			makeCall("POST", 'SignUp', form,
			function(req){
				if(req.readyState == XMLHttpRequest.DONE) {
					var message = req.responseText;
					switch (req.status) {
						case 200:
							sessionStorage.setItem('username', message);
							window.location.href = "AsteProjHome.html";
							break;
						case 400: // bad request
							document.getElementById("errorMessage").textContent = message;
							break;
						case 401: // bad request
							document.getElementById("errorMessage").textContent = message;
							break;
						case 500: // server error
							document.getElementById("errorMessage").textContent = message;
							break;
					}
				}
			});
		} else {
			form.reportValidity();
		}
	});
})();