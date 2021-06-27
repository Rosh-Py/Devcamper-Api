# Devcamper-Api using Node.js and Express.js


### API Documentation can be found below:

https://documenter.getpostman.com/view/15037808/TzeTJV3n

### Deployed link
https://devcamper-api-v1.herokuapp.com/api/v1/bootcamps

## A full fledged API with support of following features:

### Bootcamps
* Create Bootcamp
* Update Bootcamp (Secured with authentication)
* Delete Bootcamp (Secured with authentication)
* Fetch all bootcamps
* Fetch single bootcamp using id
* Fetch bootcamps with advanced query (select, sort, page, limit).

### Courses
* Create a course
* Update the course (only admin and publisher roles)
* Delete the course (only admin and publisher roles)
* Fetch all courses
* Fetch single course
* Fetch courses with advanced query (select, sort, page, limit)

### Authentication
* Register user
* Login user using Bearer Token
* Update user details
* Change password
* Forgot Password / Reset password (With reset token send over email)
* logout

### Other features
* CORS
* XSS prevention
* Rate Limiting
* NoSQL injection prevention
* HPP prevention
