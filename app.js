// Authentication Project with Passportjs strategy using local-mongoose, Google, Github and LinkedIn OAuth2
// Udemy Course: The Complete 2023 Web Developement Bootcamp
// Acknowledgement: Angela Yu (App Brewery)
// By: sys-unknwn7645

const express = require("express");
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const GitHubStrategy = require("passport-github2");
const LinkedInStrategy = require("passport-linkedin-oauth2").Strategy;

const app = express();

app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

/////env
require("dotenv").config();
const USER_ID = process.env.userId;
const PASS = process.env.password;
const GOOGLE_CLIENT_ID = process.env.CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.CLIENT_SECRET;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const LINKEDIN_KEY = process.env.LINKD_CLIENT_ID;
const LINKEDIN_SECRET = process.env.LINKD_CLIENT_SECRET;
//

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

// mongoose.connect("mongodb://127.0.0.1:27017/userDB"); //placeholder when running locally
mongoose.connect("mongodb+srv://"+USER_ID+":"+PASS+"@cluster0.9kyl5he.mongodb.net/userDB");

const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    secret: String,
    googleId: String,
    githubId: String,
    linkedInId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("user",userSchema);

//////////////////////////////////////////////////////////////////

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username, name: user.name });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

////////////////////////////////////////////////////

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/github/secrets"
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOrCreate({ githubId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));

passport.use(new LinkedInStrategy({
    clientID: LINKEDIN_KEY,
    clientSecret: LINKEDIN_SECRET,
    callbackURL: "http://localhost:3000/auth/linkedin/secrets",
    scope: ['r_emailaddress', 'r_liteprofile'],
  }, function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    User.findOrCreate({ linkedInId: profile.id }, function (err, user) {
      return done(null, profile);
    });
  }));

//////////////////////////////////////////////////////////

app.get("/", async function (req,res){
    res.render("home");
});

app.get("/auth/google", passport.authenticate("google", {scope: ["profile"]}),)

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
});

app.get('/auth/github',
  passport.authenticate('github', { scope: [ 'user:email' ] }));

app.get('/auth/github/secrets', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
});

app.get('/auth/linkedin',
  passport.authenticate('linkedin', { state: 'SOME STATE'  }),
  function(req, res){
    // The request will be redirected to LinkedIn for authentication, so this
    // function will not be called.
});

app.get('/auth/linkedin/secrets', passport.authenticate('linkedin', {
    successRedirect: '/secrets',
    failureRedirect: '/login'
}));

app.get("/login", async function (req,res){
    res.render("login");
});

app.get("/register", async function (req,res){
    res.render("register")
});

app.get("/logout",async function (req, res){
    req.logout(()=>{
        res.redirect("/")
    });
});

app.post("/register", async function(req,res){
    User.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req,res, function (){
                res.redirect("/secrets");
            })
        }
    })
});

app.post("/login",async function(req,res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if (err){
            console.log(err);
        } else {
            passport.authenticate("local")(req,res, function (){
                res.redirect("/secrets");
            });
        }
    })
});

app.get("/secrets", async function (req,res){
    if(req.isAuthenticated()){
        User.find({secret:{$ne:null}})
        .then((foundUsers)=>{
            res.render("secrets",{allSecrets:foundUsers});
        })
        .catch((err)=>{
            console.log(err);
        });
        
    } else {
        res.redirect("/login")
    } 
});

app.get("/submit", async function (req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    } else {
        res.redirect("/login")
    } 
});

app.post("/submit", async function (req,res){
    if(req.isAuthenticated()){
        User.updateOne({_id:req.user.id},{secret: req.body.secret})
        .then(()=>{
            res.redirect("/secrets");
        })
        .catch((err)=>{
            console.log(err);
        });
        
    } else {
        res.redirect("/login")
    } 
});

app.listen(process.env.PORT || 3000,function (){
    console.log("Server Started")
});