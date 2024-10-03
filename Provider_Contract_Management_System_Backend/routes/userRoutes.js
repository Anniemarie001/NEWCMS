const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

require('dotenv').config();
// Create a reusable transporter object us Outlook SMTP
const transporter = nodemailer.createTransport({
  host: "smtp-mail.outlook.com",
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.OUTLOOK_EMAIL,
    pass: process.env.OUTLOOK_PASSWORD,
  },
});

// Register a new user
router.post('/register', async (req, res) => {
  const { username, email, firstName, lastName, staffId, role, password } = req.body;

  if (!req.body || !req.body.username || !req.body.email || !req.body.firstName || !req.body.lastName || !req.body.staffId || !req.body.role || !password ) {
    return res.status(400).json({ error: 'Please provide all required fields' });
  }

 

  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }, { staffId }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    
  //   // Trim the password before hashing
  const trimmedPassword = password.trim();
  //  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(trimmedPassword, salt);



      // Generate verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');

    

   // console.log('Registration - Placeholder Password Hashing');
    //console.log('Placeholder hashed password:', hashedPassword);

    // Create new user
    const newUser = new User({
      username,
      email,
      firstName,
      lastName,
      staffId,
      role,
      password: hashedPassword,
      verificationToken,
      isVerified: false
    });

    await newUser.save();

    //Send verification email
    const verificationLink = `http://localhost:5000/api/users/verify/${verificationToken}`;
    await transporter.sendMail({
      from: process.env.OUTLOOK_EMAIL,
      to: email,
      subject: 'Set Your Password',
      html: `
        <p>Dear ${firstName} ${lastName},</p>
        <p>Welcome to our application! Please click the link below to verify your account and set your password:</p>
        <a href="${verificationLink}">${verificationLink}</a>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>Your Application Team</p>
      `
    });

    res.status(201).json({ message: 'User registered successfully. Please check your email to verify your account.' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
});
// GET route for verification
router.get('/verify/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).send('Invalid or expired verification token');
    }

    // Render a simple HTML form for password setting
    res.send(`
      <html>
        <body>
          <h2>Set Your Password</h2>
          <form action="/api/users/verify/${token}" method="POST">
            <input type="password" name="password" placeholder="Enter your password" required>
            <button type="submit">Set Password</button>
          </form>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error in verification route:', error);
    res.status(500).send('Server error');
  }
});

// Update the POST route for verification and password setting
router.post('/verify/:token',  express.urlencoded({ extended: true }), async (req, res) => {
  const { token } = req.params;
  const { password  } = req.body;

   if (!password) {
     return res.status(400).send({ error: 'Password is required' });
   }

  try {
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).send({ error: 'Invalid or expired verification token' });
    }
    //console.log('User found for password reset:', user.username);

    // // Hash the password
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password.trim(), salt);
    
    // Trim and hash the new password
    const trimmedPassword = password.trim();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(trimmedPassword, salt);

    //console.log('New password hashed');
    //console.log('First 20 chars of hashed password:', hashedPassword.substring(0, 20) + '...');

    // Update user
    user.password = hashedPassword;
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    //console.log('User updated with new password');
    
//     // After saving the user in your verify route
 //const updatedUser = await User.findOne({ verificationToken: token });
//console.log('Updated user password:', updatedUser.password); // Should show the new hashed password

    res.send(`
      <html>
        <body>
          <h2>Account verified and password set successfully.</h2>
          <p>You will be redirected to the login page in 5 seconds...</p>
          <script>
            setTimeout(function() {
              window.location.href = 'http://localhost:3000/';  // Update this URL to your actual login page URL
            }, 5000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error setting password:', error);
    res.status(500).send('Server error');
  }
});

// Login user
router.post('/login', async (req, res) => {
  //console.log('Request body:', req.body); // Check what is being sent
  const { username, password } = req.body;

  // Check if password is provided
  if (!password) {
    //console.log('Login failed: No password provided');
    return res.status(400).json({ message: 'Password is required' });
  }

  const trimmedPassword = password.trim(); // Trim whitespace from password

  try {
    const user = await User.findOne({ username });
    //console.log('Login attempt for user:', username);
   // console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      //console.log('Login failed: User not found');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    //console.log('User found:', user.username);
    //console.log('Stored password hash:', user.password);
    //console.log('Provided password (trimmed):', trimmedPassword);

    if (!user.isVerified) {
     // console.log('Login failed: User not verified');
      return res.status(400).json({ message: 'Please verify your account before logging in' });
    }

  
   
    const isMatch = bcrypt.compare(trimmedPassword, user.password);
    //console.log('Password match:', isMatch ? 'Yes' : 'No');
  //   // Additional comparison logging
  //   console.log('Manual hash comparison:', manualHash === user.password ? 'Match' : 'No Match');


    if (!isMatch) {
     // console.log('Login failed: Incorrect password');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

  //console.log('Login successful');

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, role: user.role });
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).send('Server error');
  }
});

// Get all users (protected route)
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update a user
router.put('/:id', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete a user
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndRemove(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});
// Forgot password route
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  console.log('Forgot password request received for email:', email);
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
     
    }

    console.log('User found:', user.username);
    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');


    console.log('Generated reset token:', resetToken);
    // Set token and expiry on user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
    await user.save();
    console.log('Generated reset token:', resetToken);

    // Send reset email
    const resetLink = `http://localhost:5000/api/users/reset-password/${resetToken}`;
    await transporter.sendMail({
      from: process.env.OUTLOOK_EMAIL,
      to: email,
      subject: 'Password Reset',
      html: `
        <p>Hello,</p>
        <p>You requested to reset your password. Please click the link below to reset it:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>If you did not request this, please ignore this email.</p>
        <p>Best regards,<br>Your Application Team</p>
      `,
    });

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    res.status(500).json({ error: 'Error sending password reset email' });
  }
});


// Reset password route
// router.post('/reset-password/:token', async (req, res) => {
//   const { token } = req.params;
//   const { password } = req.body;

// console.log('Reset password request received. Token:', token);

//   try {
//     const user = await User.findOne({
//       resetPasswordToken: token,
//       resetPasswordExpires: { $gt: Date.now() }, // Check if token is not expired
//     });

//     if (!user) {
//       console.log('Invalid or expired token:', token);
//       return res.status(400).json({ error: 'Invalid or expired token' });
//     }

//     // Hash and update the new password
//     const hashedPassword = await bcrypt.hash(password, 10);
//     user.password = hashedPassword;
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpires = undefined;
//     await user.save();

//     console.log('Password reset successfully for user:', user.username);

//     res.json({ message: 'Password reset successfully' });
//   } catch (error) {
//     console.error('Error resetting password:', error);
//     res.status(500).json({ error: 'Error resetting password' });
//   }
// });

// GET route for password reset
router.get('/reset-password/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).send('Invalid or expired reset token');
    }

    // Render a simple HTML form for password resetting
    res.send(`
      <html>
        <body>
          <h2>Reset Your Password</h2>
          <form action="/api/users/reset-password/${token}" method="POST">
            <input type="password" name="password" placeholder="Enter your new password" required>
            <button type="submit">Reset Password</button>
          </form>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error in reset password route:', error);
    res.status(500).send('Server error');
  }
});

// POST route for password reset
router.post('/reset-password/:token', express.urlencoded({ extended: true }), async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).send({ error: 'Password is required' });
  }

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).send({ error: 'Invalid or expired reset token' });
    }

    // Trim and hash the new password
    const trimmedPassword = password.trim();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(trimmedPassword, salt);

    // Update user
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.send(`
      <html>
        <body>
          <h2>Password reset successfully.</h2>
          <p>You will be redirected to the login page in 5 seconds...</p>
          <script>
            setTimeout(function() {
              window.location.href = 'http://localhost:3000/login';  // Update this URL to your actual login page URL
            }, 5000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).send('Server error');
  }
});

module.exports = router;

