# Finafid User Backend (Node.js)

This repository contains the backend code for the Finafid User application, developed using Node.js and MongoDB. The backend handles user authentication, profile management, wallet functionality, product data retrieval, and various other services.

## 📂 Project Structure

The project follows a modular structure, keeping routes, controllers, models, and utilities separate for maintainability and scalability:

```plaintext
finafid-user-backend-node/
├── controllers/
├── models/
├── routes/
├── utils/
├── config/
├── middleware/
├── services/
├── .env
├── app.js
├── package.json
└── README.md
```



## 📂 Key Folders

Below is an overview of the main folders and their purposes:

1. **controllers/**: Contains the logic for handling API requests (e.g., user registration, login).
2. **models/**: Defines MongoDB schemas and models using Mongoose.
3. **routes/**: Holds route definitions for various API endpoints (e.g., user, auth, products).
4. **utils/**: Includes utility functions (e.g., error handling, JWT token generation).
5. **config/**: Configuration files (e.g., MongoDB connection setup).
6. **middleware/**: Middleware functions (e.g., authentication checks).
7. **services/**: Contains business logic and service functions for the application.

Each folder is designed to keep the code modular and maintainable.

## 🚀 Getting Started

Follow these instructions to get a copy of the project running on your local machine for development and testing purposes.

### Prerequisites

Make sure you have the following installed:

- **Node.js** (v18.x or higher)
- **MongoDB** (locally installed or MongoDB Atlas)
- **npm** (v9.x or higher)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/finafid/finafid-user-backend-node.git
   cd finafid-user-backend-node```

2. Install the dependencies:

```bash
npm install
```
3. Set up environment variables:

Create a .env file in the root directory and add the following variables:

-**PORT=3000**
-**MONGODB_URI=mongodb://localhost:27017/finafid**
-**JWT_SECRET=your_jwt_secret_key**
-**EXPO_PUBLIC_API_URL=https://finafid-backend-node-e762fd401cc5.herokuapp.com/api/v1**
Start the development server:
```
npm run dev
```
The server should now be running at http://localhost:4000.

## 📋 API Endpoints

Here are some of the main API endpoints available in this backend:
-**Auth Routes**
***POST /api/v1/auth/register: ***Register a new user.
***POST /api/v1/auth/login: ***Log in a user and return a JWT token.
User Routes
***GET /api/v1/user/profile: ***Fetch the user's profile.
***PUT /api/v1/user/update:*** Update user information.
Wallet Routes
***POST /api/v1/wallet/addBalance:*** Add balance to the user's wallet.
***GET /api/v1/wallet/getBalance: *** Get the current wallet balance.
***GET /api/v1/wallet/transactions: ***Fetch wallet transaction history.
Product Routes
***GET /api/v1/products/list:*** Get a list of all products.
***GET /api/v1/products/:id: ***Get details of a specific product.
Other Routes
***GET /api/v1/categories:*** List all product categories.
***GET /api/v1/banners:*** Fetch banners for the home screen.


## 🛠️ Technologies Used
-**Node.js:** JavaScript runtime environment.
-**Express:** Web framework for Node.js.
-**MongoDB:** NoSQL database for data storage.
-**Mongoose:** ODM library for MongoDB.
-**JWT: **JSON Web Token for user authentication.
-**dotenv: **For environment variable management.

## 🛡️ Security
*The backend uses JWT for user authentication and authorization.
Passwords are hashed using bcrypt before storing in the database.
All sensitive data is managed using environment variables.*
## 🔄 Deployment
**The backend is currently deployed using Heroku at:**

https://finafid-backend-node-e762fd401cc5.herokuapp.com/api/v1

To deploy your own version:

```**Push the code to your GitHub repository.
Link your Heroku app to the GitHub repository.**
Set the environment variables in Heroku.
Deploy the app via the Heroku dashboard or CLI.```

