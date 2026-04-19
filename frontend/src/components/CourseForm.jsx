import React, { useState } from 'react';
import toast from 'react-hot-toast';
import useStore from '../store/useStore.js';
import '../styles/CourseForm.css';

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
// Daha esnek zaman seçimleri için
const generateTimes = () => {
  const times = [];
  for(let h=8; h<21; h++){
    times.push(`${String(h).padStart(2,'0')}:00`);
    times.push(`${String(h).padStart(2,'0')}:30`);
  }
  times.push('21:00');
  return times;
};
const TIMES = generateTimes();
const COLORS = ['#6366f1', '#ec4899', '#8b5cf6', '#14b8a6', '#f59e0b', '#ef4444'];

function CourseForm() {
  const autoAddCourse = useStore(state => state.autoAddCourse);
  const addCourse = useStore(state => state.addCourse);

  const [isManual, setIsManual] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    professor: '',
    classroom: '',
    durationHours: 2, 
    day: 'Pazartesi',
    startTime: '09:00',
    endTime: '11:00',
    color: COLORS[0]
  });

  const [blockedTimes, setBlockedTimes] = useState({});
  const [blockDay, setBlockDay] = useState('Pazartesi');
  const [blockStart, setBlockStart] = useState('09:00');
  const [blockEnd, setBlockEnd] = useState('10:00');
  const [isAllDay, setIsAllDay] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const val = name === 'durationHours' ? parseFloat(value) : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const addBlockTime = () => {
    // String karşılaştırma yerine min karşılaştırma:
    const sMin = parseInt(blockStart.split(':')[0]) * 60 + parseInt(blockStart.split(':')[1]);
    const eMin = parseInt(blockEnd.split(':')[0]) * 60 + parseInt(blockEnd.split(':')[1]);

    if (sMin >= eMin && !isAllDay) {
      toast.error('Blok bitişi başlangıcından sonra olmalı.');
      return;
    }
    
    setBlockedTimes(prev => {
      const dayBlocks = prev[blockDay] || [];
      const newBlock = isAllDay ? "Tüm Gün" : `${blockStart}-${blockEnd}`;
      if (!dayBlocks.includes(newBlock)) {
        return { ...prev, [blockDay]: [...dayBlocks, newBlock] };
      }
      return prev;
    });
    toast.success('Hoca engeli (Aykırı Saat) eklendi.', { icon: '🚫' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    try {
      if (isManual) {
        // Manuel Mode
        const sMin = parseInt(formData.startTime.split(':')[0]) * 60 + parseInt(formData.startTime.split(':')[1]);
        const eMin = parseInt(formData.endTime.split(':')[0]) * 60 + parseInt(formData.endTime.split(':')[1]);
        if (sMin >= eMin) {
          toast.error('Bitiş saati başlangıçtan sonra olmalıdır.', { icon: '⏱️' });
          return;
        }

        const payload = {
          ...formData, // day, start, end gelir
          aykiri_zamanlar: blockedTimes
        };
        addCourse(payload);
        toast.success(`Ders başarıyla manuel olarak atandı!`, { icon: '✅' });

      } else {
        // Auto Mode
        if (formData.durationHours <= 0) return;
        
        const payload = {
          code: formData.code,
          name: formData.name,
          professor: formData.professor,
          classroom: formData.classroom,
          color: formData.color,
          aykiri_zamanlar: blockedTimes
        };
        const placedCourse = autoAddCourse(payload, formData.durationHours);
        toast.success(
          `${formData.code} dersi otomatik olarak ${placedCourse.day} ${placedCourse.startTime} - ${placedCourse.endTime} aralığına atandı!`, 
          { icon: '✨', duration: 4000 }
        );
      }
      
      setFormData(prev => ({ ...prev, code: '', name: '', professor: '', classroom: '' }));
      setBlockedTimes({});
    } catch (error) {
      toast.error(error.message, { icon: '⚠️', duration: 4000 });
    }
  };

  return (
    <div className="course-form-container glass-panel" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
        <h2>{isManual ? '⚙️ Manuel Atama' : '🤖 Otomatik Yerleştir'}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Manuel</label>
          <input 
            type="checkbox" 
            checked={isManual} 
            onChange={(e) => setIsManual(e.target.checked)} 
            style={{ width: '18px', height: '18px' }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="course-form">
        <div className="form-group">
          <label>Ders Kodu</label>
          <input type="text" name="code" value={formData.code} onChange={handleChange} placeholder="Örn: BIL201" required />
        </div>
        
        <div className="form-group">
          <label>Ders Adı</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Örn: Veri Yapıları" required />
        </div>

        <div className="form-group">
          <label>Öğretim Üyesi</label>
          <input type="text" name="professor" value={formData.professor} onChange={handleChange} placeholder="Örn: Dr. Ali Yılmaz" />
        </div>

        <div className="form-group">
          <label>Sınıf</label>
          <input type="text" name="classroom" value={formData.classroom} onChange={handleChange} placeholder="Örn: A-101" required />
        </div>

        {/* TIME-BLOCKER UI (Aykırı Saatler) */}
        <div className="time-blocker-section" style={{ background: 'rgba(255,0,0,0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,0,0,0.2)' }}>
          <label style={{ color: '#ff8a8a', fontSize: '0.9rem' }}>🚫 Hoca Aykırı Zamanlar</label>
          <div className="form-row" style={{ marginTop: '0.5rem' }}>
            <select value={blockDay} onChange={e => setBlockDay(e.target.value)}>
              {DAYS.map(day => <option key={`b-${day}`} value={day}>{day}</option>)}
            </select>
          </div>
          <div className="form-row" style={{ marginTop: '0.5rem', alignItems: 'center' }}>
            <input type="checkbox" id="allday" checked={isAllDay} onChange={e => setIsAllDay(e.target.checked)} style={{ width: 'auto' }} />
            <label htmlFor="allday" style={{ cursor: 'pointer', fontSize: '0.9rem' }}>Tüm Gün Kapalı</label>
          </div>
          {!isAllDay && (
            <div className="form-row" style={{ marginTop: '0.5rem' }}>
              <select value={blockStart} onChange={e => setBlockStart(e.target.value)}>
                {TIMES.slice(0, -1).map(time => <option key={`bs-${time}`} value={time}>{time}</option>)}
              </select>
              <select value={blockEnd} onChange={e => setBlockEnd(e.target.value)}>
                {TIMES.slice(1).map(time => <option key={`be-${time}`} value={time}>{time}</option>)}
              </select>
            </div>
          )}
          <button type="button" onClick={addBlockTime} style={{ marginTop: '10px', padding: '5px 10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%' }}>Engel Ekle</button>
          
          {Object.keys(blockedTimes).length > 0 && (
            <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#ffb3b3' }}>
              <strong>Engeller:</strong> {JSON.stringify(blockedTimes)}
            </div>
          )}
        </div>

        {isManual ? (
          <>
            {/* MANUEL GÜN/SAAT SEÇİCİ */}
            <div className="form-row">
              <div className="form-group">
                <label>Gün</label>
                <select name="day" value={formData.day} onChange={handleChange}>
                  {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Başlangıç (Örn: 10:20 ise elinizle yazabilirsiniz!)</label>
                <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Bitiş</label>
                <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} required />
              </div>
            </div>
          </>
        ) : (
          /* OTOMATİK SÜRE SEÇİCİ */
          <div className="form-group" style={{ marginTop: '10px' }}>
            <label>Dersin Süresi (Saat)</label>
            <select name="durationHours" value={formData.durationHours} onChange={handleChange} required>
              <option value="0.75">45 Dakika</option>
              <option value="1">1 Saat</option>
              <option value="1.5">1 Saat 30 Dakika</option>
              <option value="2">2 Saat</option>
              <option value="3">3 Saat</option>
              <option value="4">4 Saat</option>
            </select>
          </div>
        )}

        <div className="form-group">
          <label>Renk Seçimi</label>
          <div className="color-picker">
            {COLORS.map(color => (
              <div 
                key={color} 
                className={`color-option ${formData.color === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setFormData(prev => ({ ...prev, color }))}
              />
            ))}
          </div>
        </div>

        <button type="submit" className="submit-btn">{isManual ? 'Programa Yerleştir' : '✨ Sistemi Çalıştır & Yerleştir'}</button>
      </form>
    </div>
  );
}

export default CourseForm;
