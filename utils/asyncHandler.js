// Promises Method:

const asyncHandler = (requestHandler) => {       // asyncHandler is a higher-order function that takes a request handler (controller)
    return (req, res, next) => {                 // Returns a new function (middleware) with req, res, next
        Promise.resolve(requestHandler(req, res, next)) // Ensures requestHandler is always wrapped in a resolved Promise
            .catch((err) => next(err))           // If it rejects (error occurs), forward error to Express's error middleware
    }
}  

export { asyncHandler }










    // Try Catch Method:

// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)                  // Run the controller function
//     } catch (err) {                               // If any error occurs
//         res.status(err.code || 500).json({        // Send a response instead of passing it to next()
//             success: false,
//             message: err.message
//         })
//     }
// }