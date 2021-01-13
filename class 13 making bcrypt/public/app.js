

const url = 'http://localhost:5000';




function signup() {
    var userName = document.getElementById('name').value
    var userEmail = document.getElementById('email').value.toLowerCase()
    var userPhone = document.getElementById('phone').value
    var userPassword = document.getElementById('password').value

    // console.log(userEmail)

    var userData = {
        userName: userName,
        userEmail: userEmail,
        userPhone: userPhone,
        userPassword: userPassword
    }
    // console.log(userData)


    document.getElementById("name").value = ""
    document.getElementById("email").value = ""
    document.getElementById("phone").value = ""
    document.getElementById("password").value = ""

    const Http = new XMLHttpRequest();
    // const url = "http://localhost:3000/signup";
    Http.open("POST", url + "/signup");
    Http.setRequestHeader("Content-Type", "application/json");

    Http.send(JSON.stringify(userData));

    Http.onreadystatechange = (e) => {
        if (Http.readyState === 4) {

            const jsonResponse = JSON.parse(Http.responseText)

            if (jsonResponse.status === 200) {
                alert(jsonResponse.message);
                window.location.href="login.html";
            } else {
                console.log(jsonResponse.status);
                alert(jsonResponse.message);
            }
        }
    }
    return false;

}


function login() {
    var loginEmail = document.getElementById('loginEmail').value
    var loginPassword = document.getElementById('loginPassword').value

    console.log(loginEmail, loginPassword)


    const Http = new XMLHttpRequest();
    // const url = "http://localhost:3000/login"
    Http.open("POST", url + "/login")
    Http.setRequestHeader("Content-Type", "application/json");
    Http.send(JSON.stringify({
        email: loginEmail,
        password: loginPassword
    }));


    Http.onreadystatechange = (e) => {
        if (Http.readyState === 4) {

            // console.log(Http.responseText);
            const jsonResponse = JSON.parse(Http.responseText)
            if (jsonResponse.status === 200) {
                alert(jsonResponse.token);
                console.log(jsonResponse.token)
                localStorage.setItem("token", jsonResponse.token)
                window.location.href="home.html";
            } else {
                alert(jsonResponse.message);
            }
        }
    }

    return false;

}



