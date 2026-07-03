import { Router } from 'express';
import { whatsappWebhook, verifyWebhook } from '../controllers/whatsappController';
import express from 'express';

const router = Router();

// Twilio sends URL-encoded form data, not JSON
router.use(express.urlencoded({ extended: false }));

// GET: Twilio webhook verification
router.get('/webhook', verifyWebhook);

// POST: Incoming WhatsApp messages from Twilio
router.post('/webhook', whatsappWebhook);

export default router;
