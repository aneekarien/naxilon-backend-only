import express from 'express';
import { sendContactEmail } from '../utils/mailer.js';  // ✅ Correct path with .js extension

const router = express.Router();

// Contact form submission handle karna
router.post('/contact', async (req, res) => {
  try {
    const { name, email, phone, country, stateCity, message } = req.body;

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({ 
        error: 'Name, email, and message are required' 
      });
    }

    // Email send karo
    await sendContactEmail({
      name,
      email,
      phone: phone || 'Not provided',
      country: country || 'Not provided',
      stateCity: stateCity || 'Not provided',
      message
    });

    res.status(200).json({ 
      success: true, 
      message: 'Message sent successfully!' 
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ 
      error: 'Failed to send message. Please try again later.' 
    });
  }
});

// Preflight request handle karo (OPTIONS method)
router.options('/contact', (req, res) => {
  res.header('Access-Control-Allow-Origin', [
    'https://naxilon.com',
    'https://www.naxilon.com', 
    'http://localhost:5173'
  ]);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

export default router;