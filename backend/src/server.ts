import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tradingdiary';

import tradeRoutes from './routes/tradeRoutes';
import strategyRoutes from './routes/strategyRoutes';
import portfolioRoutes from './routes/portfolioRoutes';
import symbolRoutes from './routes/symbolRoutes';

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.baseUrl}`);
  next();
});

app.use('/api/trades', tradeRoutes);
app.use('/api/strategies', strategyRoutes);
app.use('/api/portfolios', portfolioRoutes);
app.use('/api/symbols', symbolRoutes);

app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  console.log("Fetching root");
  res.send('API is running...');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });
