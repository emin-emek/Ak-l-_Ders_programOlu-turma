import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import useStore from '../store/useStore.js';
import '../styles/CourseForm.css'; 

function DepartmentManager() {
  const { 
    departments, teachers, classrooms, 
    fetchInitialData, addDepartment, addTeacher, addClassroom, addCourse, generateSchedule 
  } = useStore();

  const [activeTab, setActiveTab] = useState('dept'); 
  
  // Forms states
  const [deptForm, setDeptForm] = useState({ ad: '' });
  const [tchForm, setTchForm] = useState({ ad: '', soyad: '', departmentId: '', unavailable_times: '{}' });
  const [clsForm, setClsForm] = useState({ sinif_adi: '', kapasite: 30 });
  const [crsForm, setCrsForm] = useState({ ders_adi: '', haftalik_saat: 2, DepartmentId: '', TeacherId: '', ClassroomId: '' });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleEntityAdd = async (e, type, data, resetFn) => {
      e.preventDefault();
      try {
          if (type === 'dept') await addDepartment(data);
          if (type === 'teacher') {
             // JSON string validate
             let unavParsed;
             try { unavParsed = JSON.parse(data.unavailable_times); } 
             catch(e) { throw new Error("Aykırı saatler geçerli bir JSON olmalıdır. Boş ise '{}' yazın."); }
             await addTeacher({...data, unavailable_times: unavParsed});
          }
          if (type === 'class') await addClassroom(data);
          if (type === 'course') {
             if(!data.ClassroomId) throw new Error("Lütfen havuza ait bir sınıf/amfi seçin!");
             await addCourse(data);
          }

          toast.success('Başarıyla Eklendi!', {icon: '✅'});
          resetFn();
      } catch(err) {
          toast.error(err.message, {icon: '❌'});
      }
  };

  const handleGenerate = async () => {
    try {
      if(departments.length === 0 || classrooms.length === 0) {
        toast.error('Algoritmayı çalıştırmak için en az 1 Bölüm ve 1 Sınıf olmalıdır.');
        return;
      }
      toast.loading('Algoritma çözüyor...', { id: 'gen' });
      await generateSchedule();
      toast.success('Ders Programı Çözüldü!', { id: 'gen' });
    } catch(err) {
      toast.error('Çözümleme Başarısız: ' + err.message, { id: 'gen' });
    }
  };

  return (
    <div className="course-form-container glass-panel" style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>⚙️ Hibrit Veri Havuzu</h2>
      
      <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
        <button onClick={() => setActiveTab('dept')} style={{ flex: 1, padding: '5px', background: activeTab === 'dept' ? '#6366f1' : '#333', color: '#white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Bölüm</button>
        <button onClick={() => setActiveTab('teacher')} style={{ flex: 1, padding: '5px', background: activeTab === 'teacher' ? '#ec4899' : '#333', color: '#white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Hoca</button>
        <button onClick={() => setActiveTab('class')} style={{ flex: 1, padding: '5px', background: activeTab === 'class' ? '#14b8a6' : '#333', color: '#white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Sınıf</button>
        <button onClick={() => setActiveTab('course')} style={{ flex: 1, padding: '5px', background: activeTab === 'course' ? '#f59e0b' : '#333', color: '#white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Ders</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
        {activeTab === 'dept' && (
          <form onSubmit={e => handleEntityAdd(e, 'dept', deptForm, () => setDeptForm({ad: ''}))} className="course-form">
            <div className="form-group">
              <label>Bölüm Adı</label>
              <input type="text" value={deptForm.ad} onChange={e => setDeptForm({ad: e.target.value})} placeholder="Örn: Bilgisayar Müh." required />
            </div>
            <button type="submit" className="submit-btn" style={{ background: '#6366f1' }}>Bölüm Ekle</button>
          </form>
        )}

        {activeTab === 'teacher' && (
          <form onSubmit={e => handleEntityAdd(e, 'teacher', tchForm, () => setTchForm({...tchForm, ad: '', soyad: ''}))} className="course-form">
            <div className="form-group">
              <label>Hoca Adı</label>
              <input type="text" value={tchForm.ad} onChange={e => setTchForm({...tchForm, ad: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Hoca Soyadı</label>
              <input type="text" value={tchForm.soyad} onChange={e => setTchForm({...tchForm, soyad: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Aykırı Zamanlar (JSON Formatında)</label>
              <textarea 
                value={tchForm.unavailable_times} 
                onChange={e => setTchForm({...tchForm, unavailable_times: e.target.value})}
                rows="4"
              />
              <small>Örn: {`{"Pazartesi":["09:00-11:00"], "Cuma":["Tüm Gün"]}`}</small>
            </div>
            <button type="submit" className="submit-btn" style={{ background: '#ec4899' }}>Genel Havuza Hoca Ekle</button>
          </form>
        )}

        {activeTab === 'class' && (
          <form onSubmit={e => handleEntityAdd(e, 'class', clsForm, () => setClsForm({...clsForm, sinif_adi: ''}))} className="course-form">
            <div className="form-group">
              <label>Sınıf/Amfi Adı</label>
              <input type="text" value={clsForm.sinif_adi} onChange={e => setClsForm({...clsForm, sinif_adi: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Kapasite</label>
              <input type="number" value={clsForm.kapasite} onChange={e => setClsForm({...clsForm, kapasite: parseInt(e.target.value)})} required />
            </div>
            <button type="submit" className="submit-btn" style={{ background: '#14b8a6' }}>Genel Havuza Sınıf Ekle</button>
          </form>
        )}

        {activeTab === 'course' && (
          <form onSubmit={e => handleEntityAdd(e, 'course', crsForm, () => setCrsForm({...crsForm, ders_adi: ''}))} className="course-form">
            
            <div className="form-group">
              <label>Bağlı Olduğu Bölüm</label>
              <select value={crsForm.DepartmentId} onChange={e => setCrsForm({...crsForm, DepartmentId: e.target.value})} required>
                <option value="">-- Bölüm Seç --</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.ad}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Ders Adı</label>
              <input type="text" value={crsForm.ders_adi} onChange={e => setCrsForm({...crsForm, ders_adi: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Haftalık Saat</label>
              <input type="number" value={crsForm.haftalik_saat} onChange={e => setCrsForm({...crsForm, haftalik_saat: parseInt(e.target.value)})} required />
            </div>

            <div className="form-group">
              <label>Dersi Verecek Hoca (Hoca Havuzundan)</label>
              <select value={crsForm.TeacherId} onChange={e => setCrsForm({...crsForm, TeacherId: e.target.value})} required>
                <option value="">-- Hoca Kaynağı Seç --</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.ad} {t.soyad}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>İşleneceği Sınıf (Sınıf Havuzundan - YENİ)</label>
              <select value={crsForm.ClassroomId} onChange={e => setCrsForm({...crsForm, ClassroomId: e.target.value})} required>
                <option value="">-- Sınıf Kaynağı Seç --</option>
                {classrooms.map(c => <option key={c.id} value={c.id}>{c.sinif_adi} (Kap: {c.kapasite})</option>)}
              </select>
            </div>

            <button type="submit" className="submit-btn" style={{ background: '#f59e0b' }}>Dersi Havuzla Eşleştir</button>
          </form>
        )}
      </div>

      <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
          <button 
             onClick={handleGenerate} 
             style={{ width: '100%', padding: '15px', background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)', transition: 'all 0.2s' }}
             onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
             onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            ✨ Sistemi Çalıştır & Eşleştir
          </button>
      </div>

    </div>
  );
}

export default DepartmentManager;
