const { Department, Teacher, Course, Classroom, TimeSlot, SchoolSetting } = require('./models');

const parseTime = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

async function generateGlobalSchedule() {
  // Eager Loading: Derslerin Hoca ve Sınıfına ulaşıyoruz
  const departments = await Department.findAll({
    include: [
      {
        model: Course,
        include: [Teacher, Classroom]
      }
    ]
  });

  const timeSlots = await TimeSlot.findAll({
    order: [['gun', 'ASC'], ['baslangic_saati', 'ASC']]
  });
  
  const settings = await SchoolSetting.findOne();
  const lunchBreak = settings && settings.ogle_molasi ? settings.ogle_molasi : "12:00-13:00";
  const [lStart, lEnd] = lunchBreak.split('-');
  const lunchStartMin = parseTime(lStart);
  const lunchEndMin = parseTime(lEnd);

  // 2. Flatten Courses
  let allCourses = [];
  departments.forEach(dept => {
    dept.Courses.forEach(course => {
      for (let i = 0; i < course.haftalik_saat; i++) {
         allCourses.push({
          uid: `${course.id}_${i}`, 
          departmentId: dept.id,
          departmentName: dept.ad,
          courseId: course.id,
          courseName: course.ders_adi,
          teacherId: course.TeacherId,
          teacherName: course.Teacher ? `${course.Teacher.ad} ${course.Teacher.soyad}` : 'Atanmamış',
          teacherUnavailable: course.Teacher ? course.Teacher.unavailable_times : {},
          classroomId: course.ClassroomId,
          classroomName: course.Classroom ? course.Classroom.sinif_adi : 'Belirsiz',
          duration: 1 
         });
      }
    });
  });

  const scheduleResults = []; 

  // 3. Backtracking
  const solve = (courseIndex) => {
    if (courseIndex >= allCourses.length) return true; 

    const currentCourse = allCourses[courseIndex];

    for (let slot of timeSlots) {
      const slotStart = parseTime(slot.baslangic_saati);
      const slotEnd = parseTime(slot.bitis_saati);

      // --- CONSTRAINT 1: ÖĞLE MOLASI KESİŞİMİ ---
      if (slotStart < lunchEndMin && slotEnd > lunchStartMin) continue;

      // --- CONSTRAINT 2: HOCA AYKIRI ZAMANLAR ---
      if (currentCourse.teacherUnavailable && currentCourse.teacherUnavailable[slot.gun]) {
        const blocks = currentCourse.teacherUnavailable[slot.gun];
        let hocaUygunDegil = false;
        for (let block of blocks) {
           if (block === "Tüm Gün") { hocaUygunDegil = true; break; }
           const [bStart, bEnd] = block.split('-');
           if (slotStart < parseTime(bEnd) && slotEnd > parseTime(bStart)) { hocaUygunDegil = true; break; }
        }
        if(hocaUygunDegil) continue; // Hoca bu slotu istemiyor
      }

      // --- CONSTRAINT 3 & 4: ÇAKIŞMALAR ---
      let hasConflict = false;
      
      for (let scheduled of scheduleResults) {
        if (scheduled.timeSlot.gun === slot.gun && scheduled.timeSlot.baslangic_saati === slot.baslangic_saati) {
          
          // Kural 3: Aynı hoca farklı ders veremez
          if (scheduled.teacherId && scheduled.teacherId === currentCourse.teacherId) {
            hasConflict = true;
            break;
          }

          // Kural 4: Aynı sınıfta (Havuzdan seçilen) başka ders yapılamaz
          if (scheduled.classroomId && scheduled.classroomId === currentCourse.classroomId) {
            hasConflict = true;
            break;
          }
        }
      }

      if (hasConflict) continue; 
      
      // Atamayı yap (Sınıf döngüsü kalktı, çünkü sınıf zaten derse (Course) atanmış!)
      scheduleResults.push({
        uid: currentCourse.uid,
        departmentName: currentCourse.departmentName,
        courseName: currentCourse.courseName,
        teacherId: currentCourse.teacherId,
        teacherName: currentCourse.teacherName,
        classroomId: currentCourse.classroomId,
        classroomName: currentCourse.classroomName,
        timeSlot: slot
      });

      // İleri
      if (solve(courseIndex + 1)) return true;

      // Geri
      scheduleResults.pop();
    }

    return false; // Hiçbir saat uymadı
  };

  const success = solve(0);

  if (!success) {
    throw new Error("Çakışmasız program oluşturulamadı. Lütfen aykırı zamanları esnetiniz veya sınıf kapasitelerini / saatleri gözden geçiriniz.");
  }

  // 4. Çıktıyı İstenen Formata Getir (Bölüm Bazlı JSON)
  const groupedByDepartment = {};
  
  scheduleResults.forEach(item => {
    if (!groupedByDepartment[item.departmentName]) {
      groupedByDepartment[item.departmentName] = [];
    }
    groupedByDepartment[item.departmentName].push({
      ders_adi: item.courseName,
      hoca_adi: item.teacherName,
      sinif_adi: item.classroomName,
      gun: item.timeSlot.gun,
      saat: `${item.timeSlot.baslangic_saati} - ${item.timeSlot.bitis_saati}`,
      is_irregular_hour: item.timeSlot.is_irregular_hour
    });
  });

  return groupedByDepartment;
}

module.exports = {
  generateGlobalSchedule
};
