var express = require('express');
var cors = require('cors');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var path = require("path");
var bcrypt = require("bcrypt-inzi");
var jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser');
const { connect } = require('http2');

var SERVER_SECRET = process.env.SECRET || "3456";

const PORT = process.env.PORT || 5000;


// let dbURI = "mongodb+srv://zubairabc:zubairabc@cluster0.9qvbs.mongodb.net/testdatabase";
// let dbURI = 'mongodb://localhost:27017/abc-database';
let dbURI = "mongodb+srv://zubairabc:zubairabc@cluster0.j83vk.mongodb.net/testdatabase?retryWrites=true&w=majority"

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })

///////////************** Mongodb connected or disconnected Events ***********/////////////

mongoose.connection.on('connected', function () {
    console.log("Mongoose is connected")

})

mongoose.connection.on('disconnectes', function () {
    console.log("mongoose is disconnected")
    process.exit(1)
})


mongoose.connection.on('error', function (err) {
    console.log('mongoose connecion is in error: ', err)
    process.exit(1)

})

mongoose.connection.on('SIGNIT', function () {
    console.log('app is turminating')
    mongoose.connection.close(function () {
        console.log('mongoose default connection is closed')
        process(0)
    })


})


///////////************** Mongodb connected or disconnected Events ***********/////////////


var userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    phone: String,

    createdOn: { type: Date, 'default': Date.now }


})

var userModle = mongoose.model("users", userSchema)

var app = express()
app.use(cors({
    origin: '*',
    credentials: true
}))
app.use(morgan('dev'))
app.use(bodyParser.json())
app.use(cookieParser())
app.use("/", express.static(path.resolve(path.join(__dirname, "public"))));

app.post('/signup', (req, res, next) => {

    if (!req.body.userName
        || !req.body.userEmail
        || !req.body.userPhone
        || !req.body.userPassword) {
        res.status(403).send(`
        please send complete information
        e.g:
        {
            "name": "xyz",
            "email": "xyz@gmail.com",
            "password": "1234",
            "phone": "01312314",
        }`);
        return
    };



    userModle.findOne({ email: req.body.userEmail }, function (err, data) {



        if (err) {
            console.log(err)
        } else if (!data) {

            bcrypt.stringToHash(req.body.userPassword).then(function (HashPassword) {
                var newUaser = new userModle({
                    "name": req.body.userName,
                    "email": req.body.userEmail,
                    "password": HashPassword,
                    "phone": req.body.userPhone,
                });

                newUaser.save((err, data) => {
                    if (!err) {
                        res.status(200).send({
                            message: "User created"
                        })
                    } else {
                        console.log(err)
                        res.status(403).send({
                            message: "user already exist"
                        })
                    };

                });

            })


        } else {

            res.status(403).send({
                message: "User already exist"
            })
        }
    })


});


app.post("/login", (req, res, next) => {
    var userEmail = req.body.email;
    var userPassword = req.body.password;
    // console.log(userEmail)
    // console.log(userPassword)

    if (!userEmail || !userPassword) {

        res.status(403).send(`
            please send email and passwod in json body.
            e.g:
            {
                "email": "malikasinger@gmail.com",
                "password": "abc",
            }`)
        return;
    }

    userModle.findOne({ email: userEmail },
        function (err, loginRequestUser) {

            if (err) {
                res.status(500).send({
                    message: 'an errer occured'
                })
                console.log(err)
            } else if (loginRequestUser) {

                console.log(loginRequestUser)

                bcrypt.varifyHash(userPassword, loginRequestUser.password).then(match => {

                    if (match) {

                        var token = jwt.sign({
                            name: loginRequestUser.name,
                            email: loginRequestUser.email,
                            phone: loginRequestUser.phone,
                            id: loginRequestUser.id,
                            ip: req.connection.remoteAddress

                        }, SERVER_SECRET);

                        res.cookie('jToken', token, {
                            maxAge: 86_400_000,
                            httpOnly: true
                        });

                        res.status(200).send({
                            message: "login success",

                            loginRequestUser: {
                                name: loginRequestUser.name,
                                email: loginRequestUser.email,
                                phone: loginRequestUser.phone
                            }
                        });

                    } else {
                        console.log('not matched')
                        res.status(404).send({
                            message: "Incorrect password"
                        })
                    }
                }).catch(e => {
                    console.log("errer : ", e)
                })

            } else {
                res.send({
                    message: "User not found",
                    status: 403
                })
            }

        })

})

app.use(function (req, res, next) {
    console.log('cookie', req.cookies)

    if (!req.cookies.jToken) {
        res.status(401).send("include http-only credentials with every request")
        return;
    }

    jwt.verify(req.cookies.jToken, SERVER_SECRET, function (err, decodedData) {
        if (!err) {
            const issueDate = decodedData.iat * 1000
            const nowDate = new Date().getTime()
            const diff = nowDate - issueDate

            if (diff > 30000) {
                res.status(401).send('Token Expired')

            } else {
                var token = jwt.sign({
                    id: decodedData.id,
                    name: decodedData.name,
                    email: decodedData.email
                }, SERVER_SECRET)
                res.cookie('jToken', token, {
                    maxAge: 86_400_000,
                    httpOnly: true
                })
                req.body.jToken = decodedData
                next()
            }
        } else {
            res.status(401).send('invalid Token')
        }

    });

})



app.get('/Profile', (req, res, next) => {

    console.log(req.body)


    userModle.findById(req.body.jToken.id, "name email phone gender cratedOn",
        function (err, data) {
            console.log(data)
            if (!err) {
                res.send({
                    profile: data
                })
            } else {
                res.status(404).send({
                    message: "server err"
                })
            }

        })

})



app.post("/logout",(req, res, next) =>{

    res.cookie('jToken', "", {
        maxAge: 86_400_000,
        httpOnly: true
    });

    res.send("logout success");
})


app.listen(PORT, () => {
    console.log("surver is running on : ", PORT)
});







