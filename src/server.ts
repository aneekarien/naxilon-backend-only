import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ES modules mein __dirname ka alternative
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manual environment variables loading with BOM handling
const envPath = path.resolve(__dirname, '..', '.env');
console.log('Loading env from:', envPath);

if (fs.existsSync(envPath)) {
  let envFile = fs.readFileSync(envPath, 'utf8');
  
  if (envFile.charCodeAt(0) === 0xFEFF) {
    envFile = envFile.substring(1);
    console.log('Removed BOM from .env file');
  }
  
  envFile.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...values] = trimmedLine.split('=');
      if (key && values.length > 0) {
        const value = values.join('=').trim();
        const cleanValue = value.replace(/^['"](.*)['"]$/, '$1');
        process.env[key.trim()] = cleanValue;
        console.log(`Set env: ${key.trim()}=${cleanValue}`);
      }
    }
  });
} else {
  console.error('.env file not found at:', envPath);
}

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
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

// Import mailer function
const sendContactEmail = async (formData: any) => {
  try {
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.ionos.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      replyTo: formData.email,
      subject: `Naxilon Contact Form: ${formData.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #0E1E3A;">New Contact Form Submission</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
            <p><strong>Name:</strong> ${formData.name}</p>
            <p><strong>Email:</strong> ${formData.email}</p>
            <p><strong>Phone:</strong> ${formData.phone || 'Not provided'}</p>
            <p><strong>Country:</strong> ${formData.country || 'Not provided'}</p>
            <p><strong>State/City:</strong> ${formData.stateCity || 'Not provided'}</p>
            <p><strong>Message:</strong></p>
            <p style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #00BFFB;">
              ${formData.message}
            </p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
};

// Contact route with email sending
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, country, stateCity, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ 
        error: 'Name, email, and message are required' 
      });
    }

    console.log('📨 Contact form submission received:', { name, email, message });

    // Send email
    await sendContactEmail({ name, email, phone, country, stateCity, message });
    
    res.json({ 
      success: true, 
      message: 'Contact form submitted successfully! We will get back to you soon.' 
    });
  } catch (error) {
    console.error('❌ Contact form error:', error);
    res.status(500).json({ 
      error: 'Failed to send email. Please try again later.' 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running!',
    emailUser: process.env.EMAIL_USER,
    nodeEnv: process.env.NODE_ENV
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Email user: ${process.env.EMAIL_USER}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔑 Password set: ${process.env.EMAIL_PASS ? 'Yes' : 'No'}`);
});