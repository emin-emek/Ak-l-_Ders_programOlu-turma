const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http'); 
const { Server } = require('socket.io'); 
const { syncDb, Department, Teacher, Classroom, Course, TimeSlot } = require('./models');
const { generateGlobalSchedule } = require('./scheduler');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

syncDb().then(() => console.log("SQLite Veritabanı yeni mimariyle hazır."));

let globalCourses = [];
io.on('connection', (socket) => {
  socket.emit('init_courses', globalCourses);
  socket.on('update_courses', (newCoursesState) => {
    globalCourses = newCoursesState;
    socket.broadcast.emit('sync_courses', globalCourses);
  });
});

// -- BÖLÜM (DEPARTMENT) API --
app.get('/api/departments', async (req, res) => {
  try {
    const deps = await Department.findAll({ include: [Teacher, Course] });
    res.json(deps);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/departments', async (req, res) => {
  try {
    const dep = await Department.create({ ad: req.body.ad });
    res.json(dep);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// -- HOCA (TEACHER) API --
app.get('/api/teachers', async (req, res) => {
    try {
        const teachers = await Teacher.findAll();
        res.json(teachers);
    } catch(err) { res.status(500).json({error: err.message}); }
});
app.post('/api/teachers', async (req, res) => {
    try {
        const hoca = await Teacher.create({ ad: req.body.ad, soyad: req.body.soyad, unavailable_times: req.body.unavailable_times });
        if (req.body.departmentId) {
            const dep = await Department.findByPk(req.body.departmentId);
            if (dep) await dep.addTeacher(hoca);
        }
        res.json(hoca);
    } catch(err) { res.status(500).json({error: err.message}); }
});

// -- DERS (COURSE) API --
app.post('/api/courses', async (req, res) => {
    try {
        const { ders_adi, haftalik_saat, DepartmentId, TeacherId, ClassroomId } = req.body;
        // Foreign Key ile ilişkilendirerek dersi kaydet
        const ders = await Course.create({ ders_adi, haftalik_saat, DepartmentId, TeacherId, ClassroomId });
        res.json(ders);
    } catch(err) { res.status(500).json({error: err.message}); }
});

// -- SINIF (CLASSROOM) API --
app.post('/api/classrooms', async (req, res) => {
    try {
        const cls = await Classroom.create({ sinif_adi: req.body.sinif_adi, kapasite: req.body.kapasite });
        res.json(cls);
    } catch(err) { res.status(500).json({error: err.message}); }
});
app.get('/api/classrooms', async (req, res) => {
  try { res.json(await Classroom.findAll()); } catch(err) { res.status(500).json({error: err.message}); }
});

// -- GENERATE SCHEDULE --
app.post('/api/generate-schedule', async (req, res) => {
  try {
    const schedule = await generateGlobalSchedule();
    res.json(schedule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Backend http://localhost:${PORT} portunda çalışıyor.`));
