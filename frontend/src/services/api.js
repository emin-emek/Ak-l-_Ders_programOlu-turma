import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// GET Requests
export const getDepartments = () => api.get('/departments');
export const getTeachers = () => api.get('/teachers');
export const getClassrooms = () => api.get('/classrooms');

// POST Requests
export const addDepartment = (data) => api.post('/departments', data);
export const addTeacher = (data) => api.post('/teachers', data); 
export const addCourse = (data) => api.post('/courses', data);
export const addClassroom = (data) => api.post('/classrooms', data);

// Algorithm Trigger
export const generateScheduleFromAPI = () => api.post('/generate-schedule');

export default api;
