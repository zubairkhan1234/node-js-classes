var express = require('express');
var bcrypt = require("bcrypt-inzi");
var jwt = require('jsonwebtoken');

var SERVER_SECRET = process.env.SECRET || "3456";
var {userModle} = require("../dbrepo/modles")
var api = express.Router()


api.post('/signup', (req, res, next) => {

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


        } else if (err){
            res.status(500).send({
                message:"db error"
            })
        } else {

            res.status(403).send({
                message: "User already exist"
            })
        }
    })


});


api.post("/login", (req, res, next) => {
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



api.post("/logout",(req, res, next) =>{

    res.cookie('jToken', "", {
        maxAge: 86_400_000,
        httpOnly: true
    });

    res.send("logout success");
})


module.exports = api