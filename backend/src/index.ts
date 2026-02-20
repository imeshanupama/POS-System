import express from "express";
import cors from "cors";
import { initDatabase } from "./db";

const app = express();
app.use(cors());
app.use(express.json());

import productsRouter from './routes/products';
import salesRouter from './routes/sales';
import authRouter from './routes/auth';

import shiftsRouter from './routes/shifts';

// Initialize DB
initDatabase();

app.use('/api/products', productsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/auth', authRouter);
app.use('/api/shifts', shiftsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
