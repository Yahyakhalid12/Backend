class ApiError extends Error {                  // Create a class 'ApiError' that extends the built-in JavaScript 'Error' class
    constructor(
        statusCode,                             // HTTP status code for the error (e.g., 404, 500)
        message = "Something went wrong",       // Default error message if not provided
        errors = [],                            // Extra details about the error (array)
        stack = ""                              // Custom stack trace (default empty string)
    ){
        super(message)                          // Call the parent (Error) constructor with the error message

        this.statusCode = statusCode            // Save the HTTP status code
        this.data = null                        // Always null for errors (since no data returned)
        this.message = message                  // Store the error message
        this.success = false,                   // Explicitly mark this as a failed response
        this.errors = errors                    // Store extra error details (if any)

        if(stack){                              // If a stack trace string was provided...
            this.stack = stack                  // ...save it directly
        } else {
            Error.captureStackTrace(this, this.constructor)  
            // Otherwise, capture the stack trace automatically from this class
        }
    }
}

export { ApiError }                             // Export the class for use in other files
