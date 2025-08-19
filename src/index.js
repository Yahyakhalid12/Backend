// require('dotenv').config({path: './env'})

import dotenv from "dotenv"
import mongoose from "mongoose";
import DB_NAME from "./constants.js";
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})

connectDB()










//One way to connect to database it is not a good practice

/*
import express from "express";

// function connectDB(){}

// connectDB()

;( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        application.on("error", (error) => {
            console.log("Application is not able to connect to DB_NAME", error)
            throw error
        })

        application.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`)
        })

    } catch (error) {
        console.log("Error", error)
    }
}) ()

*/