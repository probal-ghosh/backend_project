import express from "express";
const app = express()
import 'dotenv/config'
import connetDB from "./db/index.js";


connetDB()
.then(()=>{
    app.listen(process.env.PORT || 4000, ()=>{
        console.log(`server is running at port ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log('mongoDB connection failed', err)
})


/*
;(async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on("error", (error)=>{
            console.log("ERR:", error);
            throw error
        })

        app.listen(process.env.PORT, ()=>{
            console.log(`App is running on ${process.env.PORT}`)
        })

    } catch (error) {
        console.error("error: ", error)
    }
})()*/