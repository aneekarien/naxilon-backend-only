const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 8080; // ✅ Railway ke liye 8080 use karein

// ✅ Basic CORS - Sabse pehle
app.use(cors());

// ✅ Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    message: '🚀 Naxilon Backend Server is healthy!',
    status: 'working',
    timestamp: new Date().toISOString()
  });
});

// ✅ Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Naxilon Backend API',
    version: '1.0.0',
    endpoints: ['/api/health', '/api/contact']
  });
});

// ✅ Contact endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, country, stateCity, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and message are required.' 
      });
    }

    console.log('📧 Received contact form:', { name, email });

    // ✅ IONOS SMTP with error handling
    const transporter = nodemailer.createTransporter({
      host: 'smtp.ionos.com',
      port: 587, // ✅ PORT 587 try karein (SSL nahi)
      secure: false, // ✅ false for port 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `Naxilon Contact: ${name}`,
      text: `
        Name: ${name}
        Email: ${email}
        Phone: ${phone || 'N/A'}
        Country: ${country || 'N/A'}
        State/City: ${stateCity || 'N/A'}
        Message: ${message}
      `
    };

    await transporter.sendMail(mailOptions);
    
    res.json({ 
      success: true, 
      message: 'Message sent successfully!' 
    });

  } catch (error) {
    console.error('❌ Email error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send message. Please try again.' 
    });
  }
});

// ✅ 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ✅ Server start
app.listen(PORT, () => {
  console.log('🚀 Naxilon Server Started on Port:', PORT);
  console.log('✅ Health Check: /api/health');
});
