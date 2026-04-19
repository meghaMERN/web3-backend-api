import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { db } from './connection/db.js';

await db();

const { default: User } = await import('./models/userSchema.js');
const { default: userRouter } = await import('./routes/userRoute.js');

const app = express();
app.use(express.json());

const Port = process.env.PORT || 3000;

app.use('/user', userRouter);

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.listen(Port, () => {
    console.log(`Server listening at port ${Port}`);
});