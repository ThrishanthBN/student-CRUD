// server.js
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connect to local MongoDB (make sure mongod is running)
mongoose
  .connect('mongodb://127.0.0.1:27017/student_crud', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB error', err));

// Student schema + model
const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  semester: { type: String, required: true, trim: true },
  course: { type: String, required: true, trim: true },
  rollNumber: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
});

const Student = mongoose.model('Student', StudentSchema);

/* ====== CRUD APIs ====== */

// Create student
app.post('/api/students', async (req, res) => {
  try {
    const { name, semester, course, rollNumber, phone, email } = req.body;
    if (!name || !semester || !course || !rollNumber) {
      return res.status(400).json({ error: 'Name, semester, course and roll number are required.' });
    }
    const student = new Student({ name, semester, course, rollNumber, phone, email });
    await student.save();
    return res.status(201).json(student);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Read all students
app.get('/api/students', async (req, res) => {
  try {
    const list = await Student.find().sort({ createdAt: -1 });
    return res.json(list);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Read single student
app.get('/api/students/:id', async (req, res) => {
  try {
    const s = await Student.findById(req.params.id);
    if (!s) return res.status(404).json({ error: 'Not found' });
    return res.json(s);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid id' });
  }
});

// Update student
app.put('/api/students/:id', async (req, res) => {
  try {
    const { name, semester, course, rollNumber, phone, email } = req.body;
    if (!name || !semester || !course || !rollNumber) {
      return res.status(400).json({ error: 'Name, semester, course and roll number are required.' });
    }
    const updated = await Student.findByIdAndUpdate(
      req.params.id,
      { name, semester, course, rollNumber, phone, email },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Not found' });
    return res.json(updated);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid id' });
  }
});

// Delete student
app.delete('/api/students/:id', async (req, res) => {
  try {
    const d = await Student.findByIdAndDelete(req.params.id);
    if (!d) return res.status(404).json({ error: 'Not found' });
    return res.json({ message: 'Deleted' });
  } catch (err) {
    return res.status(400).json({ error: 'Invalid id' });
  }
});

// Serve index.html
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server at http://localhost:${PORT}`));
