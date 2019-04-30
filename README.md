# YelpCamp
A MEN-stack based website allows registered users to post/comment/review their favorite campgrounds and meet new friends!

## DEMO:
https://enigmatic-coast-28741.herokuapp.com/

## Features
### Authentication:
- User login with username and password
- Admin sign-up with admin code
- Forgot Password and Reset vis email confirmation
- User Profile page setup with sign-up
- Follower and Following relationship

### Authorization:
- One cannot manage posts and view user profile without being authenticated
- One cannot edit or delete posts, comments and reviews created by other users
- Admin can manage all posts, comments and reviews

### campground posts:
- Create, edit and delete posts and comments
- Upload campground photos
- Fuzzy Search on existing campgrounds
- In-app notifications of following users
- notification pages on all the past notifications and following users
- campgrounds review systems

### Custome enhancement
- background animation on landing page
- Flash messages responding to users' interaction with the app
- Responsive web design
- Update campground photos when editing campgrounds
- Improve image load time on the landing page using Cloudinary
- Display time since post/comments/reviews was created
- Pagination on campgrounds index

### Code develop environment
- Front-end: ejs, bootstrap, css, html, dom, jquery
- back-end: express, mongodb, mongoose, passport, moment, nodemailer, cloudinary, crypto, async, connect-flash, passport-local
- Platform: Cloudinary, Heroku, Cloud9(migrate to AWS)
