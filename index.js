require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/authRoutes');
const db = require('./config/db.js')
const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);

// Start Server
db.query("SELECT 1")
  .then(() => {
      console.log("MySQL connected!");
      app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
  })
  .catch((err) => console.error("Database connection failed:", err.message));

