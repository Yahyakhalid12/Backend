import express, { urlencoded } from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors( {
    origin: process.env.CORS_ORIGIN || "http://localhost:8000",
    credentials: true
})) // one way to configure cors

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// Health check route
app.get("/health", (req, res) => {
    res.json({ 
        success: true, 
        message: "Server is running",
        timestamp: new Date().toISOString()
    });
});

import userRouter from "./routes/user.routes.js"

app.use("/api/v1/users", userRouter)

// http://localhost:8000/api/v1/users/register   // http://localhost:8000/Api/v1/videos

// 404 handler for undefined routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors: err.errors || []
    });
});

export { app }