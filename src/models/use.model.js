import mongoose, {Schema} from "mongoose";
import { use } from "react";

const userSchema =  new Schema(
    {
        userName:{
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email:{
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName:{
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String,
            required: true,

        },
        coverImg: {
            type: String,

        },
        watchHistory:[
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, 'password is required']
        },
        refreshToken:{
            type: String
        }
    },
    {
        timestamps: true
    }
)


export const User = mongoose.model("User", userSchema)