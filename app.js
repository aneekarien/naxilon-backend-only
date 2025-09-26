const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
    console.log('✅ Health check called');
    res.json({ 
        status: 'OK',
        message: 'Server is running perfectly',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    console.log('✅ Root endpoint called');
    res.json({ 
        service: 'Naxilon Backend API',
        version: '1.0.0',
        status: 'active',
        endpoints: ['/api/health', '/api/contact']
    });
});

// ✅✅✅ CONTACT ENDPOINT - IONOS KE LIYE OPTIMIZED ✅✅✅
app.post('/api/contact', async (req, res) => {
    console.log('📧 Contact form received');
    
    try {
        const { name, email, phone, country, stateCity, message } = req.body;

        // Validation
        if (!name || !email || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name, email, and message are required.' 
            });
        }

        console.log('📧 Processing contact form for:', name, email);

        // ✅ IONOS SMTP CONFIGURATION (EXACT SETTINGS)
        const transporter = nodemailer.createTransport({
            host: 'smtp.ionos.com',
            port: 587,
            secure: false, // false for TLS
            auth: {
                user: process.env.EMAIL_USER, // info@naxilon.com
                pass: process.env.EMAIL_PASS, // Khurram8174657296!!
            },
            tls: {
                // IONOS specific settings
                ciphers: 'SSLv3',
                rejectUnauthorized: false
            },
            // Connection settings
            connectionTimeout: 30000, // 30 seconds
            greetingTimeout: 30000,
            socketTimeout: 30000,
            // Debugging
            debug: true,
            logger: true
        });

        // Verify connection first
        console.log('🔧 Verifying SMTP connection...');
        await transporter.verify();
        console.log('✅ SMTP connection verified');

        // Email content
        const mailOptions = {
            from: `"Naxilon Website" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            replyTo: email,
            subject: `Naxilon Contact Form: ${name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px;">
                    <h2 style="color: #0E1E3A;">New Contact Form Submission</h2>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                    <p><strong>Country:</strong> ${country || 'Not provided'}</p>
                    <p><strong>State/City:</strong> ${stateCity || 'Not provided'}</p>
                    <p><strong>Message:</strong> ${message}</p>
                    <hr>
                    <p><em>Received: ${new Date().toLocaleString()}</em></p>
                </div>
            `
        };

        // Send email
        console.log('📤 Sending email...');
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', info.messageId);
        
        res.json({ 
            success: true, 
            message: 'Thank you! Your message has been sent successfully.' 
        });
        
    } catch (error) {
        console.error('❌ Email error:', error);
        
        // Better error message
        let errorMessage = 'Server error. Please try again later.';
        
        if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Connection to email server timed out.';
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Cannot connect to email server.';
        } else if (error.response) {
            errorMessage = `Email server error: ${error.response}`;
        }
        
        res.status(500).json({ 
            success: false, 
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Server start
app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 ========================================');
    console.log('🚀 Naxilon Backend Server Started');
    console.log('🚀 ========================================');
    console.log(`📍 Port: ${PORT}`);
    console.log('✅ Server is ready and waiting for requests...');
    console.log('🚀 ========================================');
});
