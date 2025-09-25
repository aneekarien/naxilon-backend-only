import nodemailer from 'nodemailer';

// IONOS email configuration ke saath transporter create karna
const createTransport = () => {
  return nodemailer.createTransport({
    host: 'smtp.ionos.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendContactEmail = async (formData: any) => {
  try {
    console.log('Attempting to send email with:', process.env.EMAIL_USER);
    
    const transporter = createTransport();
    
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
            <p><strong>Phone:</strong> ${formData.phone}</p>
            <p><strong>Country:</strong> ${formData.country}</p>
            <p><strong>State/City:</strong> ${formData.stateCity}</p>
            <p><strong>Message:</strong></p>
            <p style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #00BFFB;">
              ${formData.message}
            </p>
          </div>
          <p style="margin-top: 20px; color: #666; font-size: 12px;">
            This email was sent from the Naxilon website contact form.
          </p>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};