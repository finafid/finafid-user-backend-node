const mongoose = require("mongoose");

const connectdb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL, {
            
        });

        console.log("Database connected");

        // Export the connection instance (optional)
        module.exports = mongoose.connection;
    } catch (error) {
        console.error("Error connecting to database:", error.message);
        process.exit(1); // Exit with failure
    }
};

module.exports = connectdb;
