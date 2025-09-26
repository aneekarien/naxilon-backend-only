const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ IMPROVED CORS Configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://naxilon.com',
      'https://www.naxilon.com',
      'http://localhost:5173',
      'http://localhost:3000',
      'https://naxilon-backend-only-production.up.railway.app'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ IMPROVED Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    message: '🚀 Naxilon Backend Server is healthy and running!',
    timestamp: new Date().toISOString(),
    status: 'operational',
    environment: process.env.NODE_ENV || 'production',
    port: PORT
  });
});

// ✅ IMPROVED Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Naxilon Backend API',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      health: 'GET /api/health',
      contact: 'POST /api/contact'
    },
    documentation: 'See /api/health for server status'
  });
});

// ✅ IMPROVED Contact form endpoint with better error handling
app.post('/api/contact', async (req, res) => {
  // Set CORS headers explicitly
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  try {
    const { name, email, phone, country, stateCity, message } = req.body;

    console.log('📧 Contact form submission received:', { 
      name: name?.substring(0, 10) + '...', 
      email: email?.substring(0, 10) + '...' 
    });

    // ✅ BETTER Validation
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'VALIDATION_ERROR',
        message: 'Name, email, and message are required fields.' 
      });
    }

    // ✅ FIXED Email transporter configuration (IONOS SMTP)
    const transporter = nodemailer.createTransporter({
      host: 'smtp.ionos.com',
      port: 465, // ✅ Changed to 465 for SSL
      secure: true, // ✅ true for port 465
      auth: {
        user: process.env.EMAIL_USER || 'info@naxilon.com',
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false // ✅ Important for Railway
      }
    });

    // Verify transporter configuration
    await transporter.verify(function (error, success) {
      if (error) {
        console.log('❌ SMTP Connection Error:', error);
        throw new Error('SMTP configuration error: ' + error.message);
      } else {
        console.log('✅ SMTP Server is ready to send messages');
      }
    });

    // ✅ IMPROVED Email content
    const mailOptions = {
      from: process.env.EMAIL_USER || 'info@naxilon.com',
      to: process.env.EMAIL_USER || 'info@naxilon.com',
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
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully! Message ID:', info.messageId);
    
    res.json({ 
      success: true, 
      message: 'Thank you! Your message has been sent successfully. We will get back to you soon.',
      messageId: info.messageId
    });
    
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    
    // ✅ BETTER Error response
    res.status(500).json({ 
      success: false, 
      error: 'EMAIL_SEND_FAILED',
      message: 'Sorry, there was an error sending your message. Please try again later or contact us directly at info@naxilon.com.',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ 404 Handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    availableEndpoints: {
      health: 'GET /api/health',
      contact: 'POST /api/contact'
    }
  });
});

// ✅ Error handling middleware
app.use((error, req, res, next) => {
  console.error('🚨 Server Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// ✅ Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 ========================================');
  console.log('🚀 Naxilon Backend Server Started');
  console.log('🚀 ========================================');
  console.log(`📍 Port: ${PORT}`);
  console.log(`📧 Email: ${process.env.EMAIL_USER || 'info@naxilon.com'}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🔧 Node Version: ${process.version}`);
  console.log('✅ Health Check: /api/health');
  console.log('✅ Contact Endpoint: /api/contact');
  console.log('🚀 ========================================\n');
});

// ✅ Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});
