var mongoose = require("mongoose");
var Campground  = require("./models/campground");
var Comment = require("./models/comment");
var User = require("./models/user");

var seeds = [
    {
        name: "Los Padres National Forest", 
        price: "11.99",
        createdAt: "2019-04-21T02:51:13.750Z",
        image: "https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1050&q=80",
        description: "white, yellow, and blue dome tent near green hammock",
        author:{
            username: "Laura",
            firstName: "Laura",
            lastName: "Yang"
        }
    },
    {
        name: "Haliburton", 
        price: "12.99",
        createdAt: "2019-04-20T00:51:13.750Z",
        image: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1050&q=80",
        description: "group of people near bonfire near trees during nighttime",
        author:{
            username: "Jill"
        }        
    },
    {
        name: "Golden Ears Provincial Park", 
        price: "14.99",
        createdAt: "2019-03-21T08:51:13.750Z",
        image: "https://images.unsplash.com/photo-1492648272180-61e45a8d98a7?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80",
        description: "man sitting on stone beside white camping tent",
        author:{
            username: "Glen"
        }    
    },
    {
        name: "Squamish Valley", 
        price: "13.99",
        createdAt: "2019-04-11T01:51:13.750Z",
        image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1050&q=80",
        description: "orange camping tent near green trees",
        author:{
            username: "Scott"
        }    
    },
    {
        name: "Badavut Beach", 
        price: "15.99",
        createdAt: "2019-04-17T02:48:13.750Z",
        image: "https://images.unsplash.com/photo-1517824806704-9040b037703b?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1050&q=80",
        description: "blue tent under milkyway",
        author:{
            username: "Sahin"
        }    
    },
    {
        name: "Flaming Gorge Reservoir", 
        price: "13.99",
        createdAt: "2019-04-18T02:48:13.750Z",
        image: "https://images.unsplash.com/photo-1508873696983-2dfd5898f08b?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1050&q=80",
        description: "woman and a dog inside outdoor tent near body of water",
        author:{
            username: "Patrick"
        }    
    },
    {
        name: "San Luis Valley", 
        price: "12.99",
        createdAt: "2019-04-10T02:48:13.750Z",
        image: "https://images.unsplash.com/photo-1519708495087-ca1b71df408c?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1056&q=80",
        description: "tent at the field near trees during night",
        author:{
            username: "Andrew"
        }    
    },
    {
        name: "Entrevaux", 
        price: "12.99",
        createdAt: "2019-02-19T02:48:13.750Z",
        image: "https://images.unsplash.com/photo-1486679679458-629f321a617c?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1355&q=80",
        description: "making pictures from my friends at the campfire",
        author:{username: "Joris"}    
    }
];

async function seedDB(){
    try {
        await Campground.deleteMany({});
        await Comment.deleteMany({});
        await User.deleteMany({});
        for(const seed of seeds) {
            let user = await User.create(
                {
                    username: seed.author.username,
                    email: seed.author.username+'@gmail.com',
                    firstName: seed.author.username,
                    lastName: seed.author.lastName
                });
            let campground = await Campground.create(seed);
            let comment = await Comment.create(
                {
                    text: 'This place is great, but I wish there was internet',
                    author: {
                        id: user._id,
                        username: seed.author.username
                    }
                });
            campground.comments.push(comment);
            campground.author.id = user._id;
            campground.save();
        }    
    } catch (err){
        console.log(err);
    }
}

module.exports = seedDB;
//     //Remove all campgrounds;
    // Campground.deleteMany({}, function(err){
    //     if(err){
    //         console.log(err);
    //     }
    //     console.log("removed campgrounds!");
    //     // delete comments;
    //     Comment.deleteMany({}, function(err){
    //         if(err){
    //             console.log(err);
    //         }
    //         console.log("removed comments!");
    //         User.deleteMany({}, function(err){
    //             if(err){
    //                 console.log(err);
    //             }
    //             console.log("removed users!");
    //             //add a few campgrounds;
    //             data.forEach(function(seed){
    //                 Campground.create(seed, function(err, campground){
    //                     if(err){
    //                         console.log(err);
    //                     } else {
    //                         //console.log("added a campground");
    //                         //create a comment
    //                         Comment.create(
    //                             {
    //                                 text: "This place is great, but I wish there was internet",
    //                                 createdAt: "2019-04-19T02:48:13.750Z",
    //                                 author:{
    //                                     id : "588c2e092403d111454fff76",
    //                                     username: "Jack"
    //                                 }
    //                             }, function(err, comment){
    //                                 if(err){
    //                                     console.log(err);
    //                                 } else{
    //                                     campground.comments.push(comment);
    //                                     campground.save();
    //                                     //console.log("Created new comment");
    //                                 }
    //                             });
    //                     }
    //                 });
    //             });
    //         });
    //     });
    // }); 