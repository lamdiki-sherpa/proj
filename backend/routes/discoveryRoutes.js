// routes/discoveryRoutes.js
import express from 'express';
import { listDesigners, getDesignerProfile } from '../controllers/creatorController.js';

const r = express.Router();
r.get('/designers', listDesigners);
r.get('/designers/:id', getDesignerProfile);
export default r;
