var mongoose    = require("mongoose");
//mongoose.connect("mongodb://localhost/yelp_camp");
const databaseUri = "mongodb+srv://yelpcamp:<yelpcamp123>@yelpcamp-ths21.mongodb.net/test?retryWrites=true";
// const databaseUri = process.env.MONGODB_URI || "mongodb://localhost:27017/yelp_camp_final";
mongoose.connect(databaseUri, {useNewUrlParser: true, "useFindAndModify": false})
    .then(() => console.log(`Database connected`))
    .catch(err => console.log(`Database connection error: ${err.message}`));
// mongoose.connect("mongodb://localhost:27017/yelp_camp_final", {useNewUrlParser: true});
// mongoose.set("useFindAndModify", false);
// var Comment = require("./comment");
// var Review = require("./review");

// SCHEMA SETUP
var campgroundSchema = new mongoose.Schema({
    name: String,
    price: String,
    image: String,
    imageId: String,
    description: String, 
    createdAt: {
        type: Date,
        default: Date.now
    },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ],
    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    rating: {
        type: Number,
        default: 0
    }
});

// pre hook function to remove comments in db when delete campgrounds
// since this is triggered by remove function, you need to change the rountes using findById not findByIdAndRemove()
// const Comment = require('./comment');
// campgroundSchema.pre('remove', async function() {
// 	await Comment.remove({
// 		_id: {
// 			$in: this.comments
// 		}
// 	});
// });

module.exports = mongoose.model("Campground", campgroundSchema);