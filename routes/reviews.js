var express = require("express");
// merge params in campground and comments, so in comments, we have access to campground id
var router  = express.Router({mergeParams: true});
var Campground = require("../models/campground");
var Review = require("../models/review");
var middleware = require("../middleware");

// Reviews INDEX route
// first find the campground in question, populate the ObjectId references in the reviews field and sort them by the createdAt date (newest first).
router.get("/", function(req, res){
    Campground.findById(req.params.id).populate({
        path: 'reviews',
        // sorting the populated reviews array
        options: {sort: {createdAt: -1}}
    }).exec(function(err, campground){
        if (err|| !campground){
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/index", {campground: campground});
    });
});

// Reviews NEW route
// middleware.isLoggedIn to check if the visitor is authenticated like we've seen before, 
// middleware.checkReviewExistence which also checks if the user already reviewed the campground, since we only want to allow 1 single review per user
router.get("/new", middleware.isLoggedIn, middleware.checkReviewExistence, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err){
            req.flash('error', err.message);
            return res.redirect('back');
        }
        res.render("reviews/new", {campground: foundCampground});
    });
});

// Reviews CREATE route
router.post("/", middleware.isLoggedIn, middleware.checkReviewExistence, function(req, res){
    // look up Campground by Id
    Campground.findById(req.params.id).populate("reviews").exec(function(err, foundCampground){
        if(err){
            req.flash("error", err.message);
            return res.redirect('back');
        }
        Review.create(req.body.review, function(err, review){
            if(err){
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // add username/id and campground id to the review and save in DB also campground
            review.author.id= req.user._id;
            review.author.username = req.user.username;
            review.campground = foundCampground;
            review.save();
            foundCampground.reviews.push(review);
            // calculate average review rating for this campground
            foundCampground.rating = calculateAverage(foundCampground.reviews);
            // save campground to DB
            foundCampground.save();
            req.flash('success', 'Your review has been successfully added.');
            res.redirect("/campgrounds/"+foundCampground._id);
        })
    });
});

// Reviews EDIT ROUTE
// check the review ownership and allow access if a user is indeed the author of the specific review
router.get("/:review_id/edit", middleware.checkReviewOwnership, function(req, res){
    Review.findById(req.params.review_id, function(err, foundReview){
        if(err){
            req.flash("error", 'hello '+err.message);
            return res.redirect('back');
        }
        res.render('reviews/edit', {campground_id: req.params.id, review: foundReview});
    });
});

// Reviews Update
// find our existing review and submit the modifications, then find the related campground in question to calculate the new average
router.put("/:review_id", middleware.checkReviewOwnership, function(req, res){
    Review.findByIdAndUpdate(req.params.review_id, req.body.review, {new:true}, function(err, updatedReview){
        if(err){
            req.flash('error', err.message);
            return res.redirect('back');
        }
        Campground.findById(req.params.id).populate("reviews").exec(function(err, foundCampground){
            if(err){
                req.flash("error", err.message);
                return res.redirect("back");
            }
            console.log(foundCampground);
            foundCampground.rating = calculateAverage(foundCampground.reviews);
            foundCampground.save();
            req.flash("success", "Your review was successfully edited.");
            res.redirect("/campgrounds/"+foundCampground._id);
        });
    });
});

// Reviews DELETE
router.delete("/:review_id", middleware.checkReviewOwnership, function(req, res){
    Review.findByIdAndRemove(req.params.review_id, function(err){
        if(err){
            req.flash("error", err.message);
            return res.redirect("back");
        } 
        // use $pull to remove the deleted ObjectId review reference from the campground's reviews array 
        Campground.findByIdAndUpdate(req.params.id, {$pull: {reviews: req.params.review_id}}, {new: true}).populate("reviews").exec(function(err, campground){
            if(err){
                req.flash("error", err.message);
                return res.redirect("back");
            } 
            campground.rating = calculateAverage(campground.reviews);
            campground.save();
            req.flash("success", "Your review was deleted successfully.");
            res.redirect("/campgrounds/"+req.params.id);
        });
    });
});

function calculateAverage(reviews){
    if(reviews.length===0){
        return 0;
    }
    var sum=0;
    reviews.forEach(function(review){
        sum+= review.rating;
    });
    return sum/reviews.length;
}

module.exports = router;
