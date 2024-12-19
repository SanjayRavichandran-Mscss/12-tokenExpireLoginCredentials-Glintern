const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const sendMail = require('../utils/mailer');
const schedule = require('node-schedule');

exports.registerStudent = async (req, res) => {
  const { roll_number, student_name, student_email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.execute(
      `INSERT INTO student_register (roll_number, student_name, student_email, password) VALUES (?, ?, ?, ?)`,
      [roll_number, student_name, student_email, hashedPassword]
    );

    const mailContent = `<h1>Welcome ${student_name}</h1><p>You have successfully registered.</p>`;
    await sendMail(student_email, 'Registration Successful', mailContent);

    res.status(201).json({ message: 'Student registered successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.loginStudent = async (req, res) => {
  const { roll_number, student_email, password } = req.body;
  try {
    const [rows] = await db.execute(
      `SELECT * FROM student_register WHERE roll_number = ? AND student_email = ?`,
      [roll_number, student_email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isPasswordValid = await bcrypt.compare(password, rows[0].password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ id: rows[0].id }, process.env.JWT_SECRET, { expiresIn: '3m' });
    await db.execute(
      `INSERT INTO student_login (roll_number, student_email, login_time) VALUES (?, ?, NOW())`,
      [roll_number, student_email]
    );

    const loginMailContent = `<h1>Login Successful</h1><p>You have successfully logged in.</p>`;
    await sendMail(student_email, 'Login Successful', loginMailContent);

    schedule.scheduleJob(new Date(Date.now() + 3 * 60 * 1000), async () => {
      console.log('Login expired');
      const expiredMailContent = `<h1>Token Expired</h1><p>Your login token has expired.</p>`;
      await sendMail(student_email, 'Token Expired', expiredMailContent);
    });

    res.status(200).json({ message: 'Login successful.', token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


