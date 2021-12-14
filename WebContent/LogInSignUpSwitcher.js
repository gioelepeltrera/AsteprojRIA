/**
 * 
 */
(function() {
	document.getElementById("loginSignupSwitch").addEventListener('click', (e) => {
		var logInForm = document.getElementById("login");
		var signUpForm = document.getElementById("signup");
		var switcher = document.getElementById("loginSignupSwitch");
		
		document.getElementById("errorMessage").textContent = "";
		if(switcher.value === "LogIn") {
			logInForm.style.display = "block";
			signUpForm.style.display = "none";
			switcher.value = "SignUp";
		} else {
			signUpForm.style.display = "block";
			logInForm.style.display = "none";
			switcher.value = "LogIn";
		}
	})
})();