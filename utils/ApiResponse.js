class ApiResponse {                   // Define a class named 'ApiResponse'
    constructor (statusCode, data, message = "Success"){  
        // The constructor is called when a new object of ApiResponse is created.
        // It takes three parameters:
        // - statusCode: numeric HTTP status code (e.g., 200, 404, 500)
        // - data: the actual data you want to send in the response
        // - message: optional text message (default = "Success")

        this.statusCode = statusCode   // Save the status code into the object
        this.data = data               // Save the response data into the object
        this.message = message         // Save the message (default "Success")
        this.success = statusCode < 400  // Boolean flag: true if status < 400 (means no error)
    }
}

export { ApiResponse }