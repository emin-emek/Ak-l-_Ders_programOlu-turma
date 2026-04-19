const { DataTypes } = require('sequelize');
const sequelize = require('./database');

// ==========================================
// AŞAMA 1: GENEL HAVUZ (Global Kaynaklar)
// ==========================================

const Classroom = sequelize.define('Classroom', {
  sinif_adi: { type: DataTypes.STRING, allowNull: false, unique: true }, 
  kapasite: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 30 }
});

const Teacher = sequelize.define('Teacher', {
  ad: { type: DataTypes.STRING, allowNull: false },
  soyad: { type: DataTypes.STRING, allowNull: false },
  unavailable_times: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('unavailable_times');
      try { return rawValue ? JSON.parse(rawValue) : {}; } 
      catch { return {}; }
    },
    set(val) {
      this.setDataValue('unavailable_times', typeof val === 'object' ? JSON.stringify(val) : val);
    }
  }
});

// ZAMAN DİLİMİ (TimeSlot) Havuzu
const TimeSlot = sequelize.define('TimeSlot', {
  gun: { type: DataTypes.STRING, allowNull: false },
  baslangic_saati: { type: DataTypes.STRING, allowNull: false }, 
  bitis_saati: { type: DataTypes.STRING, allowNull: false }, 
  is_irregular_hour: { type: DataTypes.BOOLEAN, defaultValue: false } 
});

// ==========================================
// AŞAMA 2: BÖLÜM HİYERARŞİSİ VE EŞLEŞTİRME
// ==========================================

const Department = sequelize.define('Department', {
  ad: { type: DataTypes.STRING, allowNull: false, unique: true }
});

const Course = sequelize.define('Course', {
  ders_adi: { type: DataTypes.STRING, allowNull: false },
  haftalik_saat: { type: DataTypes.INTEGER, allowNull: false }
});

// -- İLİŞKİLER (MAPPINGS) --

// 1. Bir Hoca birden çok bölüme girebilir (Çoka-Çok)
Department.belongsToMany(Teacher, { through: 'DepartmentTeacher' });
Teacher.belongsToMany(Department, { through: 'DepartmentTeacher' });

// 2. Bölüm -> Ders (Bire-Çok)
Department.hasMany(Course, { foreignKey: 'DepartmentId', onDelete: 'CASCADE' });
Course.belongsTo(Department, { foreignKey: 'DepartmentId' });

// 3. Ders -> Hoca (Genel Havuzdan FK)
Teacher.hasMany(Course, { foreignKey: 'TeacherId' });
Course.belongsTo(Teacher, { foreignKey: 'TeacherId' });

// 4. Ders -> Sınıf (Genel Havuzdan FK)
Classroom.hasMany(Course, { foreignKey: 'ClassroomId' });
Course.belongsTo(Classroom, { foreignKey: 'ClassroomId' });

// OKUL AYARLARI 
const SchoolSetting = sequelize.define('SchoolSetting', {
  ogle_molasi: { 
    type: DataTypes.STRING, 
    defaultValue: '12:00-13:00' 
  }
});

const syncDb = async () => {
  await sequelize.sync({ alter: true });
  
  const settingsCount = await SchoolSetting.count();
  if (settingsCount === 0) {
    await SchoolSetting.create({ ogle_molasi: '12:00-13:00' });
  }

  // Cumartesi/Pazar iptal edildi, Saat 08.00-17.00 arasına sınırlandı
  await TimeSlot.destroy({ where: {} }); // Önceki hatalı (veya fazla) slotları temizle
  
  const defaultDays = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
  const slots = [];
  defaultDays.forEach(gun => {
    for (let i = 8; i < 17; i++) {
      const hFormat = i.toString().padStart(2, '0');
      const hNextFormat = (i + 1).toString().padStart(2, '0');
      slots.push({ gun, baslangic_saati: `${hFormat}:00`, bitis_saati: `${hNextFormat}:00`, is_irregular_hour: false });
    }
  });
  await TimeSlot.bulkCreate(slots);
};

module.exports = {
  sequelize, Department, Teacher, Classroom, Course, TimeSlot, SchoolSetting, syncDb
};
