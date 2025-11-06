// routes/calendarRoutes.js
import express from 'express';
import { getBookableSlots } from '../controllers/calendarController.js';

const r = express.Router();
r.get('/designer/:designerId/slots', getBookableSlots); // ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
export default r;
