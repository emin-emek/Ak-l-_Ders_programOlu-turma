import React, { useState } from 'react';
import useStore from '../store/useStore.js';
import '../styles/ScheduleGrid.css';

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
const PIXELS_PER_MINUTE = 1.2;
const START_HOUR = 8;
const END_HOUR = 17;
const START_MINUTE = START_HOUR * 60;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);

const timeToPixels = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMins = (h * 60 + m) - START_MINUTE;
  return totalMins * PIXELS_PER_MINUTE;
};

const durationToPixels = (durationStr) => {
    // durationStr format: "09:00 - 10:00"
    const [startStr, endStr] = durationStr.split(' - ');
    if(!startStr || !endStr) return 60 * PIXELS_PER_MINUTE; // Yoksul default
    const [sh, sm] = startStr.split(':').map(Number);
    const [eh, em] = endStr.split(':').map(Number);
    const durationMins = (eh * 60 + em) - (sh * 60 + sm);
    return durationMins * PIXELS_PER_MINUTE;
};

function ScheduleGrid() {
  const { generatedSchedule, isLoading } = useStore();
  
  // Hangi sekmenin (bölümün) açık olduğunu takip eden state
  const [activeTab, setActiveTab] = useState('');

  // schedule datasının keyleri bölüm adlarıdır.
  const departments = generatedSchedule ? Object.keys(generatedSchedule) : [];

  // Tab ilk gelişte otomatik seçilsin
  React.useEffect(() => {
     if (departments.length > 0 && !activeTab) {
         setActiveTab(departments[0]);
     }
  }, [departments]);

  if (isLoading) {
    return (
      <div className="schedule-container glass-panel" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h2 style={{ color: '#fff' }}>Yükleniyor...</h2>
      </div>
    );
  }

  if (!generatedSchedule || departments.length === 0) {
      return (
          <div className="schedule-container glass-panel" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.7)' }}>
                <h2>Henüz Program Oluşturulmadı</h2>
                <p>Sol paneldeki formlardan veritabanını doldurup algoritmayı tetikleyiniz.</p>
              </div>
          </div>
      );
  }

  const activeCourses = generatedSchedule[activeTab] || [];
  const totalHeight = (END_HOUR - START_HOUR) * 60 * PIXELS_PER_MINUTE;

  return (
    <div className="schedule-container glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
      
      {/* TABS (SEKMELER) BÖLÜMÜ */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '10px' }}>
          {departments.map(dept => (
              <button 
                key={dept} 
                onClick={() => setActiveTab(dept)}
                style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === dept ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    fontWeight: activeTab === dept ? 'bold' : 'normal',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                }}
              >
                  {dept}
              </button>
          ))}
      </div>

      <div className="schedule-header-controls">
        <h2>{activeTab} - Haftalık Program</h2>
        <span className="badge">{activeCourses.length} Blok Ders</span>
      </div>

      <div className="schedule-grid-wrapper" style={{ flex: 1 }}>
        <div className="schedule-grid">
          
          <div className="grid-header-cell time-header"></div>
          {DAYS.map(day => (
            <div key={`header-${day}`} className="grid-header-cell">{day}</div>
          ))}

          <div className="grid-time-sidebar" style={{ height: `${totalHeight}px` }}>
            {HOURS.slice(0, -1).map(hour => (
              <div key={hour} className="grid-time-label" style={{ top: `${(hour - START_HOUR) * 60 * PIXELS_PER_MINUTE}px` }}>
                {`${hour}:00`}
              </div>
            ))}
          </div>

          {DAYS.map(day => (
            <div key={`col-${day}`} className="day-column" style={{ height: `${totalHeight}px` }}>
              
              {activeCourses.filter(c => c.gun === day).map((course, idx) => {
                const startTimeStr = course.saat.split(' - ')[0];

                return (
                  <div
                    key={idx}
                    className="course-card"
                    style={{
                      top: `${timeToPixels(startTimeStr)}px`,
                      height: `${durationToPixels(course.saat)}px`,
                      backgroundColor: course.is_irregular_hour ? 'rgba(239, 68, 68, 0.9)' : 'rgba(99, 102, 241, 0.9)', // Kırmızımsı veya Mor
                      borderColor: '#fff',
                      boxShadow: `0 4px 12px rgba(0,0,0,0.5)`,
                      cursor: 'default'
                    }}
                  >
                    <div className="course-card-content">
                      <strong>{course.ders_adi}</strong>
                      <span className="course-prof" style={{color:'#fde047'}}>{course.hoca_adi}</span>
                      <span className="course-prof" style={{color:'#a7f3d0'}}>Sınıf: {course.sinif_adi}</span>
                      <span className="course-time">{course.saat}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}

          {HOURS.slice(0, -1).map(hour => (
            <div key={`line-${hour}`} className="horizontal-line" style={{ top: `${(hour - START_HOUR) * 60 * PIXELS_PER_MINUTE + 40}px` }} />
          ))}

        </div>
      </div>
    </div>
  );
}

export default ScheduleGrid;
