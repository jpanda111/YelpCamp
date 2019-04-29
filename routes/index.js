var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User    = require("../models/user");
var Campground = require("../models/campground");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var Notification = require("../models/notification");
var { isLoggedIn } = require("../middleware");

// root route
router.get("/", function(req, res){
    res.render("landing");
});

// show register form
router.get("/register", function(req, res) {
    res.render("register", {page: "register"});
});

// handle register logic
router.post("/register", function(req, res){
    var newUser = new User(
        {
            username: req.body.username, 
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
        });
    //eval(require("locus")); locus is debug tool you can break code and check local variables
    if(req.body.adminCode==='secretcode123'){
        newUser.isAdmin=true;
    }
    if(req.body.avatar){
        newUser.avatar = req.body.avatar;
    }
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            // you can also do: return res.render("register", {"error": err.message});
            req.flash("error", err.message);
            return res.redirect("/register");
        }
        passport.authenticate("local")(req, res, function(){
            // you can also use req.body.username, here use DB's username just in case it got changed in DB
            req.flash("success", "Welcome to YelpCamp "+user.username);
            res.redirect("/campgrounds"); 
        });
    });
});

// show login form
router.get("/login", function(req, res){
    res.render("login", {page: "login"});
});

// handle login form
router.post("/login", passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
    }), function(req, res){
});

// logout
router.get("/logout", function(req, res){
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/campgrounds");
});

// forgot password
router.get("/forgot", function(req, res){
    res.render("forgot");
});

router.post("/forgot", function(req, res, next){
    async.waterfall([
        // generate random tokens, send token as part of url
        function(done){
            crypto.randomBytes(20, function(err, buf){
                var token=buf.toString('hex');
                done(err, token);
            });
        },
        // find user by the provided email
        function(token, done){
            User.findOne({email: req.body.email}, function(err, user){
                if(!user){
                    req.flash("error", "No account with that email address exists.");
                    return res.redirect("/forgot");
                }
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now()+3600000; // 1 hour
                user.save(function(err){
                    done(err, token, user); 
                });
            });
        },
        // sending the email
        function(token, user, done) {
            console.log(process.env.GMAILPW);
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'yelpcamp2019users@gmail.com',
                    // you need to set up export GMAILPW = your pw here
                    pass: process.env.GMAILPW
                }
            });
            var mailOptions = {
                to: user.email,
                from: 'yelpcamp2019users@gmail.com',
                subject: 'Node.js Password Reset',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account. \n\n'+
                    'Pleae click on the following link, or paste this into your browser to complete the process: \n\n'+
                    'http://'+req.headers.host+'/reset/'+token+'\n\n'+
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                console.log('mail sent');
                console.log(user.email);
                req.flash('success', 'An email has been sent to '+user.email+' with further instructions.');
                done(err, 'done');
            });
        }
        ], function(err){
            if(err) return next(err);
            res.redirect("/forgot");
        });
});

// reset password
router.get("/reset/:token", function(req, res) {
    // check if token is valid, otherwise back to forgot.ejs
    User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function(err, user){
        if(!user){
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgot');
        } 
        res.render('reset', {token: req.params.token});
    });
});
router.post('/reset/:token', function(req, res) {
    async.waterfall([
        function(done){
            User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function(err, user){
                if(!user){
                    req.flash('error', 'Password reset token is valid or has expired.');
                    return res.redirect('back');
                }
                // check if new password is same as confirm password
                if(req.body.password===req.body.confirm){
                    // mongo-local-passport will do the hash & salt for you
                    user.setPassword(req.body.password, function(err){
                        user.resetPasswordToken=undefined;
                        user.resetPasswordExpires=undefined;
                        user.save(function(err) {
                            // save the updated user and login and invoke done()
                            req.logIn(user, function(err){
                                done(err, user);
                            });
                        });
                    });
                } else {
                    req.flash('error', 'Passwords do not match.');
                    return res.redirect('back');
                }
            });
        },
        // send the confirmation email
        function(user, done){
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'yelpcamp2019users@gmail.com',
                    pass: process.env.GMAILPW
                }
            });
            var mailOptions = {
                to: user.email,
                from: 'yelpcamp2019users@gmail.com',
                subject: 'Your password has been changed',
                text: 'Hello, \n\n'+
                    'This is a confirmation that the password of your account '+user.email+' has just been changed. \n'
            };
            smtpTransport.sendMail(mailOptions, function(err){
                req.flash('success', 'Success! Your password has been changed.');
                done(err);
            });
        }
        ], function(err) {
            res.redirect('/campgrounds');
        });
});

// USERS PROFILE
router.get('/users/:id', async function(req, res){
    try {
        let user = await User.findById(req.params.id).populate('followers').exec();
        let campgrounds = await Campground.find().where('author.id').equals(user._id).populate('comments').populate({
            path: 'reviews',
            options: {sort: {createdAt: -1}}
        }).exec();
        res.render("users/show", {user, campgrounds});
    } catch(err) {
        req.flash('error', err.message);
        return res.redirect('back');
    }
});

// follow user
router.get('/follow/:id', isLoggedIn, async function(req, res){
    try {
        let user = await User.findByIdAndUpdate(req.params.id, {
            $addToSet: {
                followers: req.user._id
            }
        });
        let user2 = await User.findByIdAndUpdate(req.user._id, {
            $addToSet: {
                followings: user.id
            }
        });
        //eval(require("locus"));
        // user.followers.push(req.user._id);
        // user.save();
        req.flash('success', 'Successfully followed '+user.username+'!');
        res.redirect('/users/'+req.params.id);
    } catch(err) {
        req.flash('error', err.message);
        res.redirect('back');
    }
});

// view all notifications
router.get('/notifications', isLoggedIn, async function(req, res){
    try {
        let user = await User.findById(req.user._id).populate({
            path: 'notifications',
            options: { sort: {"_id": -1}}
        }).populate('followings').exec();
        let allNotifications = user.notifications;
        //eval(require("locus"));
        
        res.render('notifications/index', {allNotifications, user});
    } catch(err) {
        req.flash('error', err.message);
        res.redirect('back');    
    }
});

// handle notifications
router.get('/notifications/:id', isLoggedIn,async function(req,res){
    try {
        let notification = await Notification.findById(req.params.id);
        notification.isRead = true;
        notification.save();
        res.redirect(`/campgrounds/${notification.campgroundId}`);
    } catch(err) {
        req.flash('error', err.message);
        res.redirect('back');    
    }   
});
// router.get("/users/:id", function(req, res){
//     User.findById(req.params.id, function(err, foundUser){
//         if(err){
//             req.flash("error", "Somthing went wrong.");
//             res.redirect("/");
//         } else {
//             Campground.find().where('author.id').equals(foundUser._id).populate("comments").populate({
//         path: "reviews",
//         options: {sort: {createdAt: -1}}
//     }).exec(function(err, campgrounds){
//                 if(err){
//                     req.flash("error", "Somthing went wrong.");
//                     res.redirect("/");
//                 } else {
//                     res.render("users/show", {user: foundUser, campgrounds: campgrounds});
//                 }
//             });
//         }
//     });
// });

module.exports = router;