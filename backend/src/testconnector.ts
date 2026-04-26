import { MongoClient } from 'mongodb';

// If running TS app on host: use localhost
// If running TS app in another Docker container: use 'mongodb' (container name)
const MONGO_URI =
process.env.MONGO_URI || "mongodb://localhost:27017/tradingdiary";

const client = new MongoClient(MONGO_URI);
async function connectDB() {
    try {
        await client.connect();
        console.log("Successfully connected to MongoDB on Docker");
        
        const db = client.db('myDatabase');
        // Your database logic here
        
    } catch (error) {
        console.error("Connection failed:", error);
    } finally {
        await client.close();
    }
}

connectDB();
