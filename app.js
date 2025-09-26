const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS Configuration
app.use(cors({
    origin: ['https://naxilon.com', 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS']
}));

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Health check endpoint
app.get('/api/health', (req, res) => {
    console.log('✅ Health check called');
    res.json({ 
        status: 'OK',
        message: 'Naxilon Backend Server is running perfectly',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production'
    });
});

// ✅ Root endpoint
app.get('/', (req, res) => {
    console.log('✅ Root endpoint called');
    res.json({ 
        service: 'Naxilon Backend API',
        version: '2.0.0',
        status: 'active',
        endpoints: {
            health: 'GET /api/health',
            contact: 'POST /api/contact'
        },
        documentation: 'Contact form API for naxilon.com'
    });
});

// ✅✅✅ CONTACT ENDPOINT - UPDATED WITH BETTER ERROR HANDLING ✅✅✅
app.post('/api/contact', async (req, res) => {
    console.log('📧 Contact form received');
    
    try {
        const { name, email, phone, country, stateCity, message } = req.body;

        // ✅ Validation
        if (!name || !email || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name, email, and message are required fields.' 
            });
        }

        console.log('📧 Processing contact form for:', name, email);

        // ✅ IONOS SMTP CONFIGURATION - UPDATED WITH MULTIPLE OPTIONS
        const smtpConfig = {
            // Try primary configuration first
            host: 'smtp.ionos.com',
            port: 465, // ✅ IONOS recommended SSL port
            secure: true, // ✅ SSL enabled for port 465
            auth: {
                user: process.env.EMAIL_USER || 'info@naxilon.com',
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false // ✅ Important for Railway
            },
            // Connection settings
            connectionTimeout: 60000, // 60 seconds
            greetingTimeout: 30000,
            socketTimeout: 60000,
            // Debugging
            debug: true,
            logger: true
        };

        const transporter = nodemailer.createTransport(smtpConfig);

        // ✅ Verify connection with better error handling
        console.log('🔧 Verifying SMTP connection to IONOS...');
        try {
            await transporter.verify();
            console.log('✅ SMTP connection verified successfully');
        } catch (verifyError) {
            console.error('❌ SMTP verification failed:', verifyError);
            
            // Try alternative configuration if primary fails
            console.log('🔄 Trying alternative SMTP configuration...');
            const altConfig = {
                ...smtpConfig,
                host: 'smtp.ionos.com',
                port: 587, // Alternative port
                secure: false, // TLS for port 587
            };
            
            const altTransporter = nodemailer.createTransport(altConfig);
            await altTransporter.verify();
            console.log('✅ Alternative SMTP connection verified');
        }

        // ✅ Email content with better formatting
        const mailOptions = {
            from: `"Naxilon Website" <${process.env.EMAIL_USER || 'info@naxilon.com'}>`,
            to: process.env.EMAIL_USER || 'info@naxilon.com',
            replyTo: email,
            subject: `Naxilon Contact Form Submission: ${name}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #0E1E3A; color: white; padding: 20px; text-align: center; }
                        .content { background: #f9f9f9; padding: 20px; border-radius: 5px; }
                        .field { margin-bottom: 10px; }
                        .field strong { color: #0E1E3A; }
                        .message { background: white; padding: 15px; border-left: 4px solid #00BFFB; margin: 15px 0; }
                        .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>New Contact Form Submission</h2>
                        </div>
                        <div class="content">
                            <div class="field"><strong>👤 Name:</strong> ${name}</div>
                            <div class="field"><strong>📧 Email:</strong> ${email}</div>
                            <div class="field"><strong>📞 Phone:</strong> ${phone || 'Not provided'}</div>
                            <div class="field"><strong>🌍 Country:</strong> ${country || 'Not provided'}</div>
                            <div class="field"><strong>🏙️ State/City:</strong> ${stateCity || 'Not provided'}</div>
                            
                            <div class="message">
                                <strong>💬 Message:</strong><br>
                                ${message.replace(/\n/g, '<br>')}
                            </div>
                        </div>
                        <div class="footer">
                            <p><strong>📅 Submitted:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'UTC' })}</p>
                            <p><strong>🌐 Source:</strong> Naxilon Website Contact Form (https://naxilon.com)</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            // Text version for email clients that don't support HTML
            text: `
New Contact Form Submission from Naxilon Website

Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}
Country: ${country || 'Not provided'}
State/City: ${stateCity || 'Not provided'}

Message:
${message}

Submitted: ${new Date().toLocaleString()}
Source: https://naxilon.com
            `
        };

        // ✅ Send email with detailed logging
        console.log('📤 Attempting to send email...');
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully! Message ID:', info.messageId);
        console.log('✅ Email response:', info.response);
        
        // ✅ Success response
        res.json({ 
            success: true, 
            message: 'Thank you! Your message has been sent successfully. We will get back to you within 24 hours.',
            messageId: info.messageId
        });
        
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        
        // ✅ Detailed error handling
        let errorMessage = 'Sorry, there was an error sending your message. Please try again later or contact us directly at info@naxilon.com.';
        let errorCode = 'EMAIL_SEND_FAILED';
        
        if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Connection to email server timed out. This might be a temporary issue. Please try again in a few minutes.';
            errorCode = 'CONNECTION_TIMEOUT';
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Unable to connect to email server. Please try again later.';
            errorCode = 'CONNECTION_REFUSED';
        } else if (error.responseCode) {
            errorMessage = `Email server error (${error.responseCode}). Please try again.`;
            errorCode = 'SMTP_ERROR';
        }
        
        res.status(500).json({ 
            success: false, 
            message: errorMessage,
            error: errorCode,
            detail: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ✅ Handle preflight requests
app.options('/api/contact', cors());

// ✅ 404 handler for undefined routes
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
    console.error('🚨 Unhandled Server Error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error occurred',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
});

// ✅ Server start with proper configuration
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

// ✅ Handle uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    process.exit(1);
});
