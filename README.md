# 🚀 Blockchain with Backend

A full-stack blockchain-based application that integrates smart contracts with a Node.js backend using Express and MongoDB.

---

## 📌 Features

- 🔐 User Authentication (JWT + bcrypt)
- ⛓ Blockchain interaction using Ethers.js
- 🧾 Smart contract deployment using Hardhat
- 📦 Backend API with Express.js
- 🗄 Database integration with MongoDB
- 🔑 Environment variable configuration using dotenv

---

## 🛠 Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- Ethers.js
- Hardhat
- JWT Authentication
- bcrypt

---

## 📁 Project Structure
├── index.js # Main server file
├── hardhat.config.ts # Hardhat config
├── package.json
├── .env # Environment variables (not included in repo)
├── /contracts # Smart contracts (if present)
├── /scripts # Deployment scripts
└── /routes /models # Backend logic (if present)


---

## ⚙️ Installation & Setup

### 1. Clone the repo

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name

Install dependencies
npm install

3. Setup environment variables

Create a .env file in root:
PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
PRIVATE_KEY=your_wallet_private_key

4. Run the server
node index.js
OR
npx nodemon index.js

5. Run Hardhat (for blockchain)
npx hardhat compile
npx hardhat run scripts/deploy.js

👩‍💻 Author
Megha
