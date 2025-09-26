const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ SIMPLIFIED CORS - Yeh 100% work karega
app.use(cors({
  origin: '*', // Pehle sab allow karte hain, baad mein restrict kar lenge
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Preflight requests handle karein
app.options('*', cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    message: '🚀 Naxilon Backend Server is healthy and running!',
    timestamp: new Date().toISOString(),
    status: 'operational',
    environment: process.env.NODE_ENV || 'production'
  });
});

// ✅ Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Naxilon Backend API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      contact: 'POST /api/contact'
    }
  });
});

// ✅ Contact form endpoint - SIMPLIFIED
app.post('/api/contact', async (req, res) => {
  // ✅ CORS headers manually set karein
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  try {
    const { name, email, phone, country, stateCity, message } = req.body;

    console.log('📧 Contact form submission received:', { name, email });

    // ✅ Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and message are required fields.' 
      });
    }

    // ✅ IONOS SMTP configuration
    const transporter = nodemailer.createTransporter({
      host: 'smtp.ionos.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER || 'info@naxilon.com',
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // ✅ Simple email content
    const mailOptions = {
      from: process.env.EMAIL_USER || 'info@naxilon.com',
      to: process.env.EMAIL_USER || 'info@naxilon.com',
      subject: `Naxilon Contact: ${name}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Country:</strong> ${country || 'Not provided'}</p>
        <p><strong>State/City:</strong> ${stateCity || 'Not provided'}</p>
        <p><strong>Message:</strong> ${message}</p>
        <p><em>Received: ${new Date().toLocaleString()}</em></p>
      `
    };

    // ✅ Send email
    await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    
    res.json({ 
      success: true, 
      message: 'Thank you! Your message has been sent successfully.' 
    });
    
  } catch (error) {
    console.error('❌ Email error:', error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
});

// ✅ 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ✅ Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ message: 'Internal server error' });
});

// ✅ Server start
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 ========================================');
  console.log('🚀 Naxilon Backend Server Started');
  console.log('🚀 ========================================');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log('✅ Server is running...');
  console.log('🚀 ========================================');
});
