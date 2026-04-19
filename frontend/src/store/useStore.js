import { create } from 'zustand';
import * as API from '../services/api';

const useStore = create((set, get) => ({
  departments: [],
  teachers: [],
  classrooms: [],
  generatedSchedule: null, // Backend'den dönen bölüm bazlı program nesnesi
  isLoading: false,
  error: null,

  // Global verileri listeleme
  fetchInitialData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [depsRes, teachRes, classRes] = await Promise.all([
        API.getDepartments(),
        API.getTeachers(),
        API.getClassrooms()
      ]);
      set({ 
        departments: depsRes.data, 
        teachers: teachRes.data,
        classrooms: classRes.data,
        isLoading: false 
      });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  // Ekleme Metotları
  addDepartment: async (data) => {
    try {
      const res = await API.addDepartment(data);
      set(state => ({ departments: [...state.departments, res.data] }));
      return res.data;
    } catch (err) { throw err; }
  },

  addTeacher: async (data) => {
      try {
          const res = await API.addTeacher(data);
          set(state => ({ teachers: [...state.teachers, res.data] }));
          return res.data;
      } catch(err) { throw err; }
  },

  addClassroom: async (data) => {
      try {
          const res = await API.addClassroom(data);
          set(state => ({ classrooms: [...state.classrooms, res.data] }));
          return res.data;
      } catch(err) { throw err; }
  },

  addCourse: async (data) => {
      try {
          await API.addCourse(data);
          // refresh departments (ders eklendi)
          await get().fetchInitialData();
      } catch(err) { throw err; }
  },

  // Algoritmayı Tetikleme
  generateSchedule: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await API.generateScheduleFromAPI();
      set({ generatedSchedule: res.data, isLoading: false });
    } catch (err) {
      set({ 
        error: err.response?.data?.error || err.message, 
        isLoading: false 
      });
      throw err;
    }
  }
}));

export default useStore;
