var express = require('express');
var router = express.Router();
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy;

var userModel = require('../model/user');
var file = require('../model/fileSystem');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('/login');
});

/* GET register page. */
router.get('/register', checkLogin, function(req, res, next) {
  res.render('register',{errors : null});
});
 
/* POST register. */
router.post('/register', function(req, res, next) {
  userModel.getUserByEmail(req.body.email, function (err,userFound) { 
    var errors = [];
    if (err) throw err;
    if (userFound){
     var err = {};
      err.msg = "Existing email address";
      errors.push(err);
    } 
    else {
      req.checkBody('password_confirmation','Password confirmation does not match').equals(req.body.password);
      errors = req.validationErrors();
    }
    
  if (errors){
    res.render('register',{errors : errors});
  } else {
      var UserSchema = new userModel ({
        firstName : req.body.first_name,
        lastName : req.body.last_name,
        email : req.body.email,
        password: req.body.password,
        });
      userModel.createUser(UserSchema);
      req.flash('success_msg','Successful registration');
      file.createUserDir(req.body.email);
      res.redirect('/');
  }
  });

  
});

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
  },
  function(username, password, done) {
  userModel.getUserByEmail(username,function (err,userFound) { 
    if (err) throw err;
    if (!userFound) 
      return done(null,false,{message : 'This email does not exist. Please register before'});
    userModel.checkPassword(password,userFound.password,function (err, isMatch) { 
      if (err) throw err;
      if (isMatch) 
        return done(null,userFound);
      else return done(null,false,{message : 'Wrong password'});
    });
  });
    }
));

passport.serializeUser(function(email, done) {
  done(null, email.id);
});

passport.deserializeUser(function(id, done) {
  userModel.getUserById(id, function (err,email) {
    done(err,email);
  });
});


/* GET login page. */
router.get('/login', checkLogin, function(req, res, next) {
  res.render('login',{errors : null});
});

router.post('/login',
  passport.authenticate('local', { successRedirect: '/device',
                                   failureRedirect: '/login',
                                   failureFlash: true }
));

/* GET logout page. */
router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/login');
});

/* GET device (main) page. */
router.get('/device', checkAuthtication, function(req, res, next) {
  res.render('device',{errors : null, user : req.user.email});
});

//Check if user logins: TRUE = prevent login , FALSE = allow login
function checkLogin(req , res , next) {
  if (!req.isAuthenticated()) next();
  else res.redirect('/device');
}

//Allow access device page if user login
function checkAuthtication(req , res , next) {
  if (req.isAuthenticated()) next();
  else res.redirect('/login');
}

module.exports = router;
