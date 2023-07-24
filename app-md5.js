// Project Authentication with Hash using MD5 library
// Udemy Course: The Complete 2023 Web Developement Bootcamp
// Acknowledgement: Angela Yu (App Brewery)
// By: sys-unknwn7645

const express = require("express");
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const md5 = require('md5');
         
const app = express();

app.set("view engine","ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});

const User = new mongoose.model("user",userSchema);

app.get("/", async function (req,res){
    res.render("home");
});

app.get("/login", async function (req,res){
    res.render("login");
});

app.get("/register", async function (req,res){
    res.render("register");
});

app.post("/register",async function(req,res){
    const user = new User({
        email: req.body.username,
        password: md5(req.body.password)
    });
    user.save().then(res.redirect("secrets")).catch((err)=>{
        console.log(err)
        res.redirect("/")
    });
    
});

app.post("/login",async function(req,res){
    const username = req.body.username;
    const password =  md5(req.body.password);

    User.findOne({email:username})
    .then((userInfo)=>{
        if(!userInfo) {
            console.log("User Does Not Exist");
            res.redirect("/login");
        } else if(userInfo.password === password) {
            res.redirect("secrets");
        } else {
            console.log("Wrong Password");
            res.redirect("/login");
    }})
    .catch((err)=>{
    console.log(err)
    res.redirect("/login")
    }); 
});

app.get("/secrets", function (req,res){
    res.render("secrets");
});


app.listen(process.env.PORT || 3000,function (){
    console.log("Server Started")
});