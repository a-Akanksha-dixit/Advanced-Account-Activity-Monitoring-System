import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});
// ─────────────────────────────────────────────
// POST /api/login — Demo login handler
// ─────────────────────────────────────────────


export default router;

