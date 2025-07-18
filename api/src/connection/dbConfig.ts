import mongoose from 'mongoose';

const connectionDb = async() =>{
    try {
        const connect = await mongoose.connect(process.env.MONGO_URI as string);
        console.log(
            "Database connected: ",
            connect.connection.host,
            connect.connection.name
        );      
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

export {connectionDb};