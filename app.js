var express         = require("express"),
    app             = express(),
    bodyParser      = require("body-parser"),
    mongoose        = require("mongoose"),
    flash           = require("connect-flash"),
    passport        = require("passport"),
    LocalStrategy   = require("passport-local"),
    methodOverride  = require("method-override"),
    Campground      = require("./models/campground"),
    Comment         = require("./models/comment"),
    User            = require("./models/user"),
    seedDB          = require("./seeds");
// set up env variable
require('dotenv').config();
// const databaseUri = process.env.DATABASEURL || "mongodb://localhost:27017/yelp_camp_final";
mongoose.connect(process.env.DATABASEURL, {useNewUrlParser: true, "useFindAndModify": false})
    .then(() => console.log(`Database connected`))
    .catch(err => console.log(`Database connection error: ${err.message}`));
    
// npm uninstall mongoose; npm install --save mongoose@5.3.15
mongoose.set("useFindAndModify", false);
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname+"/public"));
app.use(methodOverride("_method"));
app.use(flash());

//seedDB(); // seed the database

// ========================================
//        PASSPORT CONFIGURATION
// ========================================
app.locals.moment = require("moment");
// set up express-session
app.use(require("express-session")({
    // secret is used to encode and decode the sessions
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
}));
// set up passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
// passport de/serialize, responsible read/write the session (decode/encode)
// do not write your own, use passport-local-mongoose exist methods
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// get currentUser info using this middleware function
// we put middleware in app.use(), which will be called every route
// this is mainly to define some global parameters which will use for every route
app.use(async function(req, res, next){
    // res.locals is all the info availabe inside our template
   res.locals.currentUser = req.user;
   if(req.user) {
       try {
           let user = await User.findById(req.user._id).populate('notifications', null, { isRead:false}).exec();
           res.locals.notifications = user.notifications.reverse();
       } catch(err) {
           console.log(err.message);
       }
   }
   res.locals.error = req.flash("error");
   res.locals.success = req.flash("success");
   next();
});

// ========================================
//        ROUTES CONFIGURATION
// ========================================
var commentRoutes       = require("./routes/comments"),
    reviewRoutes        = require("./routes/reviews"),
    campgroundRoutes    = require("./routes/campgrounds"),
    indexRoutes         = require("./routes/index");

app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("The YelpCamp Server Has Started!");
});