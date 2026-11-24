import express from 'express';
import { getTopLocations } from '../controllers/statsController.js';

const router = express.Router();

router.get('/top-locations', getTopLocations);

export default router;
