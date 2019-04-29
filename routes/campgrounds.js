var express = require("express");
var router  = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var Review = require("../models/review");
var User = require("../models/user");
var Notification = require("../models/notification");
// you can require /middleware will automatically require index.js
var middleware= require("../middleware");
// Image Update related Config
// multerconfig
var multer = require("multer");
var storage = multer.diskStorage({
    filename: function(req, file, callback){
        callback(null, Date.now()+file.originalname);
    }
});
var imageFilter = function(req, file, cb){
    if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)){
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({storage: storage, fileFilter: imageFilter});
//  cloudinary config
var cloudinary = require("cloudinary");
cloudinary.config({
    cloud_name: "dcxock7fx",
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// INDEX ROUTE
router.get("/", function(req, res){
    // eval(require("locus"));
    var perPage = 8;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery: 1;
    var noMatch = null;
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    // console.log(req.user);
    // res.render("campgrounds", {campgrounds: campgrounds});
    // Get allCampgrounds from DB and pass it to campgrounds on campgrounds.ejs file
        Campground.find({name: regex}).skip(perPage*(pageNumber-1)).limit(perPage).exec(function(err, allCampgrounds){
            Campground.count().exec(function (err, count){
               if(err){
                    console.log(err);
                    res.redirect("back");
                } else {
                    if(allCampgrounds.length<1){
                        noMatch="No campgrounds match that query, please try again.";
                    }
                    res.render("campgrounds/index", {
                        campgrounds: allCampgrounds, 
                        page: "campgrounds",
                        current: pageNumber,
                        pages: Math.ceil(count/perPage),
                        noMatch: noMatch,
                        search: req.query.search
                    });
                }
            });
        });
    } else {
        Campground.find({}).skip(perPage*(pageNumber-1)).limit(perPage).exec(function(err, allCampgrounds){
            Campground.count().exec(function(err, count){
               if(err){
                    console.log(err);
                } else {
                    res.render("campgrounds/index", {
                        campgrounds: allCampgrounds, 
                        page: "campgrounds",
                        current: pageNumber,
                        pages: Math.ceil(count/perPage), 
                        noMatch: noMatch,
                        search: false
                    });
                    //eval(require("locus"));
                } 
            });
        });
    }
});



// CREATE ROUTE
// Logic to add new campgrounds and redirect to main page
router.post("/", middleware.isLoggedIn, upload.single('image'), async function(req, res){
    try {
        // upload image to cloudinary
        let result = await cloudinary.v2.uploader.upload(req.file.path);
        req.body.campground.image = result.secure_url;
        req.body.campground.author = {
            id: req.user._id,
            username: req.user.username
        }; 
        
        // generate notification to followers
        let campground = await Campground.create(req.body.campground);
        let user = await User.findById(req.user._id).populate('followers').exec();
        let newNotification = {
            username: req.user.username,
            campgroundId: campground.id
        };
        //eval(require("locus"));
        for(const follower of user.followers) {
            let notification = await Notification.create(newNotification);
            follower.notifications.push(notification);
            follower.save();
        }
        res.redirect(`/campgrounds/${campground.id}`);
   } catch(err) {
       req.flash('error', err.message);
       res.redirect('back');
   }
});

// NEW ROUTE
// form to add data to POST
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("campgrounds/new"); 
});

// SHOW ROUTE
// show page - shows more info about one campground
router.get("/:id", function(req, res){
    // find the campground with provided ID
    // since comments stored inside campground is ref id, you need to populate it to get actual content
    Campground.findById(req.params.id).populate("comments").populate({
        path: "reviews",
        options: {sort: {createdAt: -1}}
    }).exec(function(err, foundCampground){
        if(err || !foundCampground){
            req.flash("error", "Campground not found");
            res.redirect("back");
        } else {
            // console.log(foundCampground);
            // render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
    // res.send("THIS WILL BE THE SHOW PAGE ONE DAY!");    
});

// EDIT ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
    // found campground by Id
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err || !foundCampground){
            req.flash("error", "Campground not found");
            res.redirect("back");
        } else {
            res.render("campgrounds/edit", {campground: foundCampground});
        }
    });
});
// UPDATE ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
    delete req.body.campground.rating;
    // find and update campground
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
        if(err || !updatedCampground){
            req.flash("error", "Campground not updated");
            res.redirect("/campgrounds");
        } else {
            // redirect the show page
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});
// DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findByIdAndRemove(req.params.id, function(err, campground){
        if(err){
            res.redirect("/campgrounds");  
        } else {
            // use the $in operator which finds all Comment and Review database entries 
            // which have ids contained in campground.comments and campground.reviews, and 
            // deletes them along with the associated campground that is getting removed. T
            Comment.remove({"_id": {$in: campground.comments}}, function(err){
                if(err){
                    console.log(err);
                    return res.redirect("/campgrounds");
                }
                Review.remove({"_id": {$in: campground.reviews}}, function(err){
                    if(err){
                        console.log(err);
                        return res.redirect("/campgrounds");
                    }
                    campground.remove();
                    req.flash('success', 'Campground deleted successfully!');
                    res.redirect("/campgrounds");
                });
            });
            res.redirect("/campgrounds"); 
        }
    });
});

// DESTROY CAMPGROUD AND ALSO ITS COMMENTS ROUTE
// var Comment = require("../models/comment");
// router.delete("/:id", checkCampgroundOwnership, (req, res) => {
//     Campground.findByIdAndRemove(req.params.id, (err, campgroundRemoved) => {
//         if (err) {
//             console.log(err);
//         }
//         Comment.deleteMany( {_id: { $in: campgroundRemoved.comments } }, (err) => {
//             if (err) {
//                 console.log(err);
//             }
//             res.redirect("/campgrounds");
//         });
//     })
// });

// middleware move to middleware/index.js
// fuzzy search
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};
module.exports = router;