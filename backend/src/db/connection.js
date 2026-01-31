import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB = async() => {
    try{
        const connection = await mongoose.connect(`${process.env.MONGODB_ATLAS}/${DB_NAME}`)
        if (connection) console.log(`Database connected successfully....`);
        
    }
    catch(err){
        console.log('Connection Error', err);
        process.exit(1);
    }
} 


export default connectDB