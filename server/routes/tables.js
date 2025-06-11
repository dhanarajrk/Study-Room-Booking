// server/routes/tables.js
import express from 'express';
import Table from '../models/Table.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const tables = await Table.find().sort('tableNumber');
    res.json(tables);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;