import express from 'express'
import { createWallet, getBalance, getTokenBalance, login, sendTransaction, signup, transferToken } from '../controller.js/userController.js';
import authenticateToken from '../middleware/authenticate.js';
const userRouter = express.Router();

userRouter.post('/signup', signup);
userRouter.post('/login', login);
userRouter.post('/create-wallet', authenticateToken, createWallet);
userRouter.post('/check-balance', authenticateToken, getBalance);
userRouter.post('/send-money', authenticateToken, sendTransaction);
userRouter.post('/get-token-balance', authenticateToken, getTokenBalance);
userRouter.post('/send-token', authenticateToken, transferToken);

export default userRouter;