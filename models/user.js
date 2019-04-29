var mongoose                = require("mongoose");
var passportLocalMongoose   = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: {type: String, unique: true, required: true},
    password: String,
    avatar: {
        type: String,
        default: 'https://cdn4.iconfinder.com/data/icons/people-std-pack/512/hiker-512.png'
    },
    firstName: {type: String, default: ''},
    lastName: {type: String, default: 'Hiking Pro'},
    email: {type: String, unique: true, required: true},
    resetPasswordExpires: Date,
    resetPasswordToken: String,
    isAdmin: {
        type: Boolean,
        default: false
    },
    notifications: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Notification'
        }
    ],
    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            // unique: true,
            ref: 'User'
        }
    ],
    followings: [
        {
            type: mongoose.Schema.Types.ObjectId,
            // unique: true,
            ref: 'User'
        }
    ]
});
// add some methods from passportLocalMongoose to the User
UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", UserSchema);