// all the middleware goes here
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var Review = require("../models/review");
var middlewareObj = {};

middlewareObj.checkCampgroundOwnership = function (req, res, next){
    if(req.isAuthenticated()){
        Campground.findById(req.params.id, function(err, foundCampground){
            if(err || !foundCampground){
                req.flash("error", "Campground not found");
                res.redirect("back");
            } else {
                // does user own the campground
                // req.user._id is a string, foundCampground.auther.id is a mongoose object
                // if(foundCampground.author.id === req.user._id)
                if (foundCampground.author.id.equals(req.user._id) || req.user.isAdmin){
                    next();
                } else {
                    // otherwise, rediect
                    // res.send("You do no have permission to do that!");
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        // if not, redirect
        // res.send("You need to be logged in to do that!!");
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
}

middlewareObj.checkCommentOwnership = function (req, res, next){
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err || !foundComment){
                req.flash("error", "Comment not found");
                res.redirect("back");
            } else {
                // does user own the campground
                // req.user._id is a string, foundCampground.auther.id is a mongoose object
                // if(foundComment.author.id === req.user._id)
                if (foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
                    next();
                } else {
                    // otherwise, rediect
                    // res.send("You do no have permission to do that!");
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        // if not, redirect
        // res.send("You need to be logged in to do that!!");
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }    
}

middlewareObj.checkReviewOwnership = function(req, res, next){
    if(req.isAuthenticated()){
        Review.findById(req.params.review_id, function(err, foundReview){
            if(err || !foundReview){
                req.flash("error", "Cannot found the Review");
                res.redirect("back");
            } else {
                // does user own the comment?
                if(foundReview.author.id.equals(req.user._id)){
                    next();
                } else {
                    req.flash('error', "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash('error', 'You need to be logged in to do that');
        res.redirect('back');
    }
};

middlewareObj.checkReviewExistence = function(req, res, next){
    if(req.isAuthenticated()){
        Campground.findById(req.params.id).populate("reviews").exec(function(err, foundCampground){
            if(err || !foundCampground) {
                req.flash('error', 'Campground not found.');
                res.redirect('back');
            } else {
                // check if user.id exists in foundCampground.reviews
                var foundUserReview = foundCampground.reviews.some(function(review){
                    return review.author.id.equals(req.user._id); 
                });
                if(foundUserReview){
                    req.flash('error', 'You already wrote a review/');
                    return res.redirect('/campgrounds/'+foundCampground._id);
                }
                // if the review not found, go to next middleware
                next();
            }
        });
    } else {
        req.flash('error', 'You need to login first.');
        res.redirect('back');
    }  
};

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    // think this as (key,value) pair
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/login");
}

module.exports = middlewareObj;