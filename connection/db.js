import mongoose from "mongoose";

export const db = async () => {
    try {
        await mongoose.connect(process.env.DB_URI).then(() => console.log('Connected to mongodb'))
    } catch (error) {
        console.log('Error Occured in connecting database', error)
    }
};

