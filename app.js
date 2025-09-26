const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup for naxilon.com
app.use(cors({
  origin: [
    'https://naxilon.com',
    'https://www.naxilon.com',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS']
}));

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    message: '🚀 Naxilon Backend Server is healthy and running!',
    timestamp: new Date().toISOString(),
    status: 'operational'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Naxilon Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      contact: '/api/contact'
    }
  });
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, country, stateCity, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and message are required fields.' 
      });
    }

    console.log('📧 Contact form submission received:', { name, email });

    // Email transporter configuration
    const transporter = nodemailer.createTransporter({
      host: 'smtp.ionos.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: `Naxilon Contact Form: ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
          <h2 style="color: #0E1E3A; border-bottom: 2px solid #00BFFB; padding-bottom: 10px;">New Contact Form Submission</h2>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;">
            <p><strong>👤 Name:</strong> ${name}</p>
            <p><strong>📧 Email:</strong> ${email}</p>
            <p><strong>📞 Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>🌍 Country:</strong> ${country || 'Not provided'}</p>
            <p><strong>🏙️ State/City:</strong> ${stateCity || 'Not provided'}</p>
          </div>
          
          <div style="background: white; padding: 15px; border-left: 4px solid #00BFFB; margin: 10px 0;">
            <p><strong>💬 Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
          </div>
          
          <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
            <p><strong>📅 Submitted:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>🌐 Source:</strong> Naxilon Website Contact Form</p>
          </div>
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully to:', process.env.EMAIL_USER);
    
    res.json({ 
      success: true, 
      message: 'Thank you! Your message has been sent successfully. We will get back to you soon.' 
    });
    
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Sorry, there was an error sending your message. Please try again later or contact us directly at info@naxilon.com.' 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 ========================================');
  console.log('🚀 Naxilon Backend Server Started');
  console.log('🚀 ========================================');
  console.log(`📍 Port: ${PORT}`);
  console.log(`📧 Email: ${process.env.EMAIL_USER}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`✅ Health Check: http://localhost:${PORT}/api/health`);
  console.log('🚀 ========================================');
});
