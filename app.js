const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ SIMPLE CORS - Bilkul basic
app.use(cors());

// ✅ Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Health check - Pehla endpoint
app.get('/api/health', (req, res) => {
    console.log('✅ Health check called');
    res.json({ 
        status: 'OK',
        message: 'Server is running perfectly',
        timestamp: new Date().toISOString()
    });
});

// ✅ Root endpoint
app.get('/', (req, res) => {
    console.log('✅ Root endpoint called');
    res.json({ 
        service: 'Naxilon Backend API',
        version: '1.0.0',
        status: 'active',
        endpoints: ['/api/health', '/api/contact']
    });
});

// ✅ Contact form endpoint
app.post('/api/contact', async (req, res) => {
    console.log('📧 Contact form received');
    
    try {
        const { name, email, phone, country, stateCity, message } = req.body;

        // ✅ Basic validation
        if (!name || !email || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name, email, and message are required.' 
            });
        }

        console.log('📧 Processing contact form for:', name, email);

        // ✅ IONOS SMTP configuration (Port 587 - Most reliable)
        const transporter = nodemailer.createTransporter({
            host: 'smtp.ionos.com',
            port: 587,
            secure: false, // false for port 587
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // ✅ Simple email content
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: `Naxilon Contact: ${name}`,
            html: `
                <h3>New Contact Form Submission</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                <p><strong>Country:</strong> ${country || 'Not provided'}</p>
                <p><strong>State/City:</strong> ${stateCity || 'Not provided'}</p>
                <p><strong>Message:</strong> ${message}</p>
                <hr>
                <p><em>Received: ${new Date().toLocaleString()}</em></p>
            `
        };

        // ✅ Send email
        await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully');
        
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

// ✅ Server start with 0.0.0.0 for Railway
app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 ========================================');
    console.log('🚀 Naxilon Backend Server Started');
    console.log('🚀 ========================================');
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'production'}`);
    console.log('✅ Server is ready and waiting for requests...');
    console.log('🚀 ========================================');
});
