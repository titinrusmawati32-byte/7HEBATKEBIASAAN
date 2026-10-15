// Kode Google Apps Script Lengkap yang Menggabungkan Database Google Sheets Anda dengan Router API Web App

export const COMPLETE_APPS_SCRIPT_CODE = `// =========================================================================
// KODE BACKEND LENGKAP: MISI 7 KEBIASAAN ANAK INDONESIA HEBAT
// Database: Google Sheets & Google Drive
// =========================================================================

// 1. FUNGSI WAJIB UNTUK WEB APP (GET & POST)
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    status: "online",
    message: "Web App Misi 7 Kebiasaan Anak Indonesia Hebat aktif!",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

// 2. ROUTER UTAMA (Menerima input dari Web App React)
function doPost(e) {
  try {
    var contents = e.postData ? e.postData.contents : "{}";
    var request = JSON.parse(contents);
    var action = request.action;
    var payload = request.payload || {};
    var response = { success: false, message: "Aksi tidak dikenal: " + action };

    if (action === "testConnection") {
      response = { success: true, message: "Koneksi Google Apps Script berhasil!", timestamp: new Date().toISOString() };
    } else if (action === "initSheets") {
      response = initSheets();
    } else if (action === "validasiLogin") {
      response = validasiLogin(payload.username, payload.password);
    } else if (action === "simpanMisiIndividu") {
      response = simpanMisiIndividu(payload);
    } else if (action === "cekStatusMisiHariIni") {
      response = { success: true, data: cekStatusMisiHariIni(payload.username) };
    } else if (action === "ambilDataGabungan") {
      response = { success: true, data: ambilDataGabungan(payload.role, payload.filterKelas) };
    } else if (action === "getDashboardKepsekData") {
      response = getDashboardKepsekData(payload.role, payload.filterKelas);
    } else if (action === "simpanDataSiswa") {
      response = simpanDataSiswa(payload);
    } else if (action === "ambilDataSiswa") {
      response = { success: true, data: ambilDataSiswa(payload.role, payload.filterKelas) };
    } else if (action === "simpanDataSiswaBulk") {
      response = simpanDataSiswaBulk(payload.dataArray);
    } else if (action === "hapusDataSiswaBulk") {
      response = hapusDataSiswaBulk(payload.nisnArray);
    } else if (action === "simpanDataGuru") {
      response = simpanDataGuru(payload);
    } else if (action === "ambilDataGuru") {
      response = { success: true, data: ambilDataGuru() };
    } else if (action === "hapusDataGuruBulk") {
      response = hapusDataGuruBulk(payload.usernameArray);
    } else if (action === "getPengaturanKop") {
      response = getPengaturanKop();
    } else if (action === "simpanPengaturanKop") {
      response = simpanPengaturanKop(payload);
    } else if (action === "getPengaturanGuru") {
      response = getPengaturanGuru(payload.kelas);
    } else if (action === "simpanPengaturanGuru") {
      response = simpanPengaturanGuru(payload);
    } else if (action === "getMateriHabit") {
      response = getMateriHabit(payload.kelas, payload.habitId);
    } else if (action === "simpanMateriHabit") {
      response = simpanMateriHabit(payload);
    } else if (action === "hapusEntriJurnal") {
      response = hapusEntriJurnal(payload);
    } else if (action === "hapusJurnalSiswaTanggal") {
      response = hapusJurnalSiswaTanggal(payload);
    }

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// =========================================================================
// 3. FUNGSI AUTOMASI PEMBUATAN SHEET & HEADER (TUKANG SAPU 🧹)
// =========================================================================
function initSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const sheetsConfig = {
    'Pengaturan': ['Kunci', 'Nilai'],
    'Data_Siswa': ['ID', 'NISN / Username', 'Nama Lengkap', 'Nama Panggilan', 'Kelas', 'Tahun Ajaran', 'Password'],
    'Data_Guru': ['ID', 'Username / NIP', 'Nama Lengkap', 'Kelas yang Diampu', 'Password', 'LinkYoutube', 'Konten_Kuis_JSON', 'Tempat_Cetak', 'Tanggal_Cetak'],
    'Habit_1': ['ID', 'Tanggal', 'Waktu Submit', 'Username', 'Nama Siswa', 'Kelas', 'Jam Bangun', 'URL Foto Bukti'],
    'Habit_2': ['ID', 'Tanggal', 'Waktu Submit', 'Username', 'Nama Siswa', 'Kelas', 'Catatan', 'URL Foto Bukti'],
    'Habit_3': ['ID', 'Tanggal', 'Waktu Submit', 'Username', 'Nama Siswa', 'Kelas', 'Catatan', 'URL Foto Bukti'],
    'Habit_4': ['ID', 'Tanggal', 'Waktu Submit', 'Username', 'Nama Siswa', 'Kelas', 'Catatan', 'URL Foto Bukti'],
    'Habit_5': ['ID', 'Tanggal', 'Waktu Submit', 'Username', 'Nama Siswa', 'Kelas', 'Catatan', 'URL Foto Bukti'],
    'Habit_6': ['ID', 'Tanggal', 'Waktu Submit', 'Username', 'Nama Siswa', 'Kelas', 'Catatan', 'URL Foto Bukti'],
    'Habit_7': ['ID', 'Tanggal', 'Waktu Submit', 'Username', 'Nama Siswa', 'Kelas', 'Catatan', 'URL Foto Bukti']
  };

  for (let sheetName in sheetsConfig) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) { sheet = ss.insertSheet(sheetName); }
    
    const firstRow = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0];
    if (!firstRow[0] || firstRow[0] === "") {
      const headers = sheetsConfig[sheetName];
      const range = sheet.getRange(1, 1, 1, headers.length);
      range.setValues([headers]);
      range.setFontWeight("bold");
      range.setBackground("#d9ead3");
      sheet.setFrozenRows(1);

      if (sheetName === 'Pengaturan') {
        sheet.appendRow(['NamaSekolah', 'Nama Sekolah']);
        sheet.appendRow(['LogoSekolah', '']);
        sheet.appendRow(['LinkYoutube', '']);
        sheet.setColumnWidth(1, 150); sheet.setColumnWidth(2, 300);
      }
      else if (sheetName === 'Data_Siswa') {
        sheet.setColumnWidth(2, 150); sheet.setColumnWidth(3, 200);
      }
      else if (sheetName === 'Data_Guru') {
        sheet.setColumnWidth(2, 200);
      }
    }
  }

  return { success: true, message: "Sistem berhasil di-refresh. Semua Sheet dan Header siap digunakan!" };
}

function getSheet(sheetName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      initSheets();
      sheet = ss.getSheetByName(sheetName);
    }
    return sheet;
  } catch (e) {
    throw new Error("Gagal mengakses Spreadsheet: " + e.toString());
  }
}

// ==========================================
// 4. FUNGSI LOGIN & AUTENTIKASI
// ==========================================
function validasiLogin(username, password) {
  try {
    const u = (username || "").toString().trim();
    const p = (password || "").toString().trim();

    // 1. Cek di Data_Guru
    const sheetGuru = getSheet('Data_Guru');
    const dataGuru = sheetGuru.getDataRange().getValues();
    for (let i = 1; i < dataGuru.length; i++) {
      if (dataGuru[i][1].toString().trim() === u && dataGuru[i][4].toString().trim() === p) {
        let role = 'Guru';
        let kelas = dataGuru[i][3].toString().trim();
        if (kelas.toLowerCase() === 'kepsek') role = 'Kepala Sekolah';
        return { success: true, role: role, username: u, nama: dataGuru[i][2], kelas: kelas };
      }
    }

    // 2. Cek di Data_Siswa
    const sheetSiswa = getSheet('Data_Siswa');
    const dataSiswa = sheetSiswa.getDataRange().getValues();
    for (let i = 1; i < dataSiswa.length; i++) {
      const dbPass = (dataSiswa[i][6] || '12345').toString().trim();
      if (dataSiswa[i][1].toString().trim() === u && dbPass === p) {
        return { success: true, role: 'Siswa', username: u, nama: dataSiswa[i][2], kelas: dataSiswa[i][4] };
      }
    }

    return { success: false, message: "ID atau Kata Sandi Salah!" };
  } catch (error) {
    return { success: false, message: "Server error: " + error.toString() };
  }
}

// ==========================================
// 5. MANAJEMEN DATA GURU & SISWA
// ==========================================
function simpanDataGuru(payload) {
  try {
    const sheet = getSheet('Data_Guru');
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][1].toString().trim() === payload.username.toString().trim()) {
        return { success: false, message: "Username/NIP ini sudah digunakan!" };
      }
    }
    sheet.appendRow([ Utilities.getUuid(), payload.username, payload.nama, payload.kelas, payload.password || 'guru123', '', '{}', 'Jakarta', '' ]);
    return { success: true, message: "Akun Guru berhasil ditambahkan!" };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function ambilDataGuru() {
  try {
    const data = getSheet('Data_Guru').getDataRange().getValues();
    if (data.length <= 1) return [];
    const hasil = [];
    for (let i = 1; i < data.length; i++) {
      hasil.push({
        id: data[i][0] ? data[i][0].toString() : ('guru-' + i),
        username: data[i][1] ? data[i][1].toString() : '',
        nama: data[i][2] ? data[i][2].toString() : '',
        kelas: data[i][3] ? data[i][3].toString() : '',
        password: data[i][4] ? data[i][4].toString() : '',
        linkYoutube: data[i][5] ? data[i][5].toString() : '',
        kontenKuisJson: data[i][6] ? data[i][6].toString() : '{}',
        tempatCetak: data[i][7] ? data[i][7].toString() : 'Jakarta',
        tanggalCetak: data[i][8] ? data[i][8].toString() : ''
      });
    }
    return hasil;
  } catch(e) { throw new Error("Gagal mengambil data guru: " + e.toString()); }
}

function hapusDataGuruBulk(usernameArray) {
  try {
    let sheet = getSheet('Data_Guru');
    let data = sheet.getDataRange().getValues();
    let count = 0;
    
    for (let i = data.length - 1; i > 0; i--) {
      let kelasGuru = data[i][3] ? data[i][3].toString().toLowerCase() : "";
      if (kelasGuru === 'kepsek') continue; // Kepsek kebal hapus
      
      if (usernameArray.includes(data[i][1].toString().trim())) {
        sheet.deleteRow(i + 1);
        count++;
      }
    }
    return { success: true, message: count + " akun guru berhasil dihapus!" };
  } catch (err) { return { success: false, message: err.message }; }
}

function simpanDataSiswa(payload) {
  try {
    const sheet = getSheet('Data_Siswa');
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][1].toString().trim() === payload.nisn.toString().trim()) {
        return { success: false, message: "NISN sudah terdaftar!" };
      }
    }
    sheet.appendRow([ Utilities.getUuid(), payload.nisn, payload.nama, payload.panggilan || '', payload.kelas, payload.tahunAjaran || '2026/2027', payload.password || '12345' ]);
    return { success: true, message: "Agen Siswa ditambahkan!" };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function ambilDataSiswa(role, filterKelas) {
  try {
    const data = getSheet('Data_Siswa').getDataRange().getValues();
    if (data.length <= 1) return [];
    
    const hasil = [];
    const kelasGuru = filterKelas ? filterKelas.toString().trim().toUpperCase() : '';

    for (let i = 1; i < data.length; i++) {
      const kelasSiswa = data[i][4] ? data[i][4].toString().trim().toUpperCase() : '';
      if (role === 'Guru' && kelasGuru !== '' && kelasGuru !== '-' && kelasGuru !== 'KEPSEK' && kelasSiswa !== kelasGuru) continue; 
      hasil.push({
        id: data[i][0] ? data[i][0].toString() : ('siswa-' + i),
        nisn: data[i][1] ? data[i][1].toString() : '',
        nama: data[i][2] ? data[i][2].toString() : '',
        panggilan: data[i][3] ? data[i][3].toString() : '',
        kelas: data[i][4] ? data[i][4].toString() : '',
        tahunAjaran: data[i][5] ? data[i][5].toString() : '',
        password: data[i][6] ? data[i][6].toString() : '12345'
      });
    }
    return hasil;
  } catch(e) { throw new Error("Gagal mengambil data siswa: " + e.toString()); }
}

function simpanDataSiswaBulk(dataArray) {
  try {
    const sheet = getSheet('Data_Siswa');
    const existingData = sheet.getDataRange().getValues();
    const existingNisn = new Set();
    
    for (let i = 1; i < existingData.length; i++) {
      if (existingData[i][1]) existingNisn.add(existingData[i][1].toString().trim());
    }

    const newRows = [];
    let countSuccess = 0;
    let countDuplicate = 0;

    dataArray.forEach(row => {
      const nisn = (row["NISN"] || row["nisn"] || "").toString().trim();
      const nama = row["Nama Lengkap"] || row["nama"] || "";
      const panggilan = row["Panggilan"] || row["panggilan"] || "";
      const kelas = row["Kelas"] || row["kelas"] || "Kelas 4A";
      const tahun = row["Tahun Ajaran"] || row["tahunAjaran"] || "2026/2027";

      if (nisn && !existingNisn.has(nisn)) {
        newRows.push([Utilities.getUuid(), nisn, nama, panggilan, kelas, tahun, '12345']);
        existingNisn.add(nisn); 
        countSuccess++;
      } else if (nisn) {
        countDuplicate++; 
      }
    });

    if (newRows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
    }

    let pesanStatus = "Import Selesai! " + countSuccess + " agen berhasil ditambahkan.";
    if (countDuplicate > 0) pesanStatus += " (" + countDuplicate + " agen dilewati karena NISN sudah terdaftar)";

    return { success: true, message: pesanStatus };
  } catch (e) {
    return { success: false, message: "Server error saat memproses Excel: " + e.toString() };
  }
}

function hapusDataSiswaBulk(nisnArray) {
  try {
    const sheet = getSheet('Data_Siswa');
    const data = sheet.getDataRange().getValues();
    let deletedCount = 0;

    for (let i = data.length - 1; i > 0; i--) {
      const nisn = data[i][1].toString().trim();
      if (nisnArray.includes(nisn)) {
        sheet.deleteRow(i + 1); 
        deletedCount++;
      }
    }
    return { success: true, message: "Berhasil menghapus " + deletedCount + " agen yang dipilih." };
  } catch (e) {
    return { success: false, message: "Gagal menghapus data: " + e.toString() };
  }
}

// ==========================================
// 6. PENGATURAN KOP & CETAK GLOBAL
// ==========================================
function getPengaturanKop() {
  try {
    const data = getSheet('Pengaturan').getDataRange().getValues();
    let config = { namaSekolah: '', logoSekolah: '', linkYoutube: '', usernameKepsek: '', passwordKepsek: '' };
    
    for(let i = 1; i < data.length; i++) {
      if(data[i][0] === 'NamaSekolah') config.namaSekolah = data[i][1];
      if(data[i][0] === 'LogoSekolah') config.logoSekolah = data[i][1];
      if(data[i][0] === 'LinkYoutube') config.linkYoutube = data[i][1];
    }

    const dataGuru = getSheet('Data_Guru').getDataRange().getValues();
    for (let i = 1; i < dataGuru.length; i++) {
      if (dataGuru[i][3].toString().toLowerCase() === 'kepsek') {
        config.usernameKepsek = dataGuru[i][1]; config.passwordKepsek = dataGuru[i][4]; break;
      }
    }
    return { success: true, data: config };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function simpanPengaturanKop(payload) {
  try {
    const sheet = getSheet('Pengaturan');
    const data = sheet.getDataRange().getValues();
    
    let isNamaSekolahExist = false; let isLogoSekolahExist = false; let isLinkYoutubeExist = false;
    for(let i = 1; i < data.length; i++) {
      if(data[i][0] === 'NamaSekolah') { sheet.getRange(i + 1, 2).setValue(payload.namaSekolah); isNamaSekolahExist = true; }
      if(data[i][0] === 'LogoSekolah') { sheet.getRange(i + 1, 2).setValue(payload.logoSekolah || ''); isLogoSekolahExist = true; }
      if(data[i][0] === 'LinkYoutube') { sheet.getRange(i + 1, 2).setValue(payload.linkYoutube || ''); isLinkYoutubeExist = true; }
    }
    
    if (!isNamaSekolahExist) sheet.appendRow(['NamaSekolah', payload.namaSekolah]);
    if (!isLogoSekolahExist) sheet.appendRow(['LogoSekolah', payload.logoSekolah || '']);
    if (!isLinkYoutubeExist) sheet.appendRow(['LinkYoutube', payload.linkYoutube || '']);

    if (payload.usernameKepsek && payload.passwordKepsek) {
      const sheetGuru = getSheet('Data_Guru');
      const dataGuru = sheetGuru.getDataRange().getValues();
      let isKepsekExist = false;
      for (let i = 1; i < dataGuru.length; i++) {
        if (dataGuru[i][3].toString().toLowerCase() === 'kepsek') {
          sheetGuru.getRange(i + 1, 2).setValue(payload.usernameKepsek);
          sheetGuru.getRange(i + 1, 5).setValue(payload.passwordKepsek);
          isKepsekExist = true; break;
        }
      }
      if (!isKepsekExist) sheetGuru.appendRow([Utilities.getUuid(), payload.usernameKepsek, 'Komandan Sekolah (Kepsek)', 'Kepsek', payload.passwordKepsek, '', '{}', 'Jakarta', '']);
    }
    return { success: true, message: 'Pengaturan Sekolah & Akun berhasil disimpan ke Spreadsheet.' };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// =========================================================
// 7. PENGATURAN KELAS KHUSUS GURU
// =========================================================
function getPengaturanGuru(kelasGuru) {
  try {
    const data = getSheet('Data_Guru').getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      let dbKelas = data[i][3] ? data[i][3].toString().trim().toUpperCase() : "";
      if (dbKelas === (kelasGuru ? kelasGuru.toString().trim().toUpperCase() : "")) {
        return { 
          success: true, 
          data: { 
            namaGuru: data[i][2],
            tempatCetak: data[i][7] || "Jakarta",
            tanggalCetak: data[i][8] || ""
          } 
        };
      }
    }
    return { success: false, message: "Data guru untuk kelas ini tidak ditemukan." };
  } catch(e) { return { success: false, message: e.toString() }; }
}

function simpanPengaturanGuru(payload) {
  try {
    const sheet = getSheet('Data_Guru');
    const data = sheet.getDataRange().getValues();
    let targetKelas = payload.kelas ? payload.kelas.toString().trim().toUpperCase() : "";

    for (let i = 1; i < data.length; i++) {
      let dbKelas = data[i][3] ? data[i][3].toString().trim().toUpperCase() : "";
      if (dbKelas === targetKelas) {
        sheet.getRange(i + 1, 3).setValue(payload.namaGuru);
        sheet.getRange(i + 1, 8).setValue(payload.tempatCetak);
        sheet.getRange(i + 1, 9).setValue(payload.tanggalCetak);
        return { success: true, message: "Pengaturan dasar kelas berhasil disimpan di Spreadsheet!" };
      }
    }
    return { success: false, message: "Akses ditolak, kelas guru tidak ditemukan." };
  } catch(e) { return { success: false, message: e.toString() }; }
}

// =========================================================
// 8. PENGATURAN MATERI, YOUTUBE & KUIS (HABIT 1..7)
// =========================================================
function getMateriHabit(kelasSiswa, habitId) {
  try {
    var data = getSheet('Data_Guru').getDataRange().getValues();
    var targetKelas = (kelasSiswa || "").toString().trim().toUpperCase();

    for (var i = 1; i < data.length; i++) {
      var kelasGuru = data[i][3] ? data[i][3].toString().trim().toUpperCase() : "";
      if (kelasGuru === targetKelas) {
        var rawDataMateri = data[i][6] ? data[i][6].toString().trim() : "{}";
        var materiJson = {};
        try { materiJson = JSON.parse(rawDataMateri); } catch(e) { materiJson = {}; }
        
        var dataHabitIni = materiJson['habit_' + habitId] || {};
        
        return { 
          success: true, 
          data: {
            materiTeks: dataHabitIni.materiTeks || "",
            linkYt: dataHabitIni.linkYt || "",
            kuisAktif: dataHabitIni.kuisAktif === true,
            pertanyaan: dataHabitIni.pertanyaan || "",
            opsiA: dataHabitIni.opsiA || "",
            opsiB: dataHabitIni.opsiB || "",
            opsiC: dataHabitIni.opsiC || "",
            jawaban: dataHabitIni.jawaban || "A"
          } 
        };
      }
    }
    return { success: false, message: "Guru untuk kelas tidak ditemukan" };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function simpanMateriHabit(payload) {
  try {
    var sheet = getSheet('Data_Guru');
    var data = sheet.getDataRange().getValues();
    var kelasSiswa = (payload.kelas || "").toString().trim().toUpperCase();
    var habitId = "habit_" + payload.habitId;
    
    for (var i = 1; i < data.length; i++) {
      var kelasGuru = data[i][3] ? data[i][3].toString().trim().toUpperCase() : "";
      
      if (kelasGuru === kelasSiswa) {
        var rawDataLama = data[i][6] ? data[i][6].toString().trim() : "{}";
        var jsonLama = {};
        try { jsonLama = JSON.parse(rawDataLama); } catch(e) { jsonLama = {}; }
        
        jsonLama[habitId] = {
          materiTeks: payload.materiTeks,
          linkYt: payload.linkYt,
          kuisAktif: payload.kuisAktif,
          pertanyaan: payload.pertanyaan,
          opsiA: payload.opsiA,
          opsiB: payload.opsiB,
          opsiC: payload.opsiC,
          jawaban: payload.jawaban
        };
        
        sheet.getRange(i + 1, 7).setValue(JSON.stringify(jsonLama));
        return { success: true, message: "Konten & Kuis untuk Misi " + payload.habitId + " berhasil disimpan di Spreadsheet!" };
      }
    }
    
    return { success: false, message: "Akses ditolak. Tidak menemukan data kelas." };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// ==========================================
// 9. PENGELOLAAN MISI (HABIT 1 - 7) & DRIVE
// ==========================================
function cekStatusMisiHariIni(username) {
  const tz = "Asia/Jakarta";
  const tglHariIni = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
  const misiSelesai = [];
  
  for (let i = 1; i <= 7; i++) {
    const data = getSheet('Habit_' + i).getDataRange().getValues();
    for (let r = data.length - 1; r > 0; r--) { 
      let tglRow = data[r][1];
      if (tglRow instanceof Date) tglRow = Utilities.formatDate(tglRow, tz, "yyyy-MM-dd");
      else if (tglRow) tglRow = tglRow.toString().trim().substring(0, 10);
      
      if (tglRow === tglHariIni && data[r][3].toString().trim() === username.toString().trim()) {
        misiSelesai.push(i);
        break;
      }
    }
  }
  return misiSelesai;
}

function simpanKeDrive(base64DataUrl, fileName) {
  if (!base64DataUrl || base64DataUrl.indexOf('data:') === -1) return base64DataUrl || "";
  try {
    let folderIter = DriveApp.getFoldersByName("Bukti_Misi_Anak_Hebat");
    let folder = folderIter.hasNext() ? folderIter.next() : DriveApp.createFolder("Bukti_Misi_Anak_Hebat");
    
    // Parse data URL: data:image/jpeg;base64,.....
    const parts = base64DataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const base64Data = parts[1];
    
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    return base64DataUrl; // Fallback simpan data asli jika Drive permission belum disetujui
  }
}

function simpanMisiIndividu(payload) {
  try {
    const tz = "Asia/Jakarta";
    let fotoUrl = "";
    if (payload.fileBase64) {
      const namaUnik = payload.username + "_Habit" + payload.habitId + "_" + new Date().getTime() + ".jpg";
      fotoUrl = simpanKeDrive(payload.fileBase64, namaUnik);
    }
    const sheet = getSheet('Habit_' + payload.habitId);
    sheet.appendRow([
      Utilities.getUuid(),
      Utilities.formatDate(new Date(), tz, "yyyy-MM-dd"),
      Utilities.formatDate(new Date(), tz, "HH:mm:ss"),
      payload.username,
      payload.nama,
      payload.kelas,
      payload.detail,
      fotoUrl
    ]);
    return { success: true, fotoUrl: fotoUrl, message: "Laporan Misi #" + payload.habitId + " berhasil masuk ke Google Sheets & Drive!" };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function hapusEntriJurnal(payload) {
  try {
    const tz = "Asia/Jakarta";
    const habitId = payload.habitId;
    const username = (payload.username || "").toString().trim();
    const targetTanggal = (payload.tanggal || "").toString().trim();

    const sheet = getSheet('Habit_' + habitId);
    const data = sheet.getDataRange().getValues();
    let deletedCount = 0;

    for (let r = data.length - 1; r > 0; r--) {
      let tglRow = data[r][1];
      if (tglRow instanceof Date) tglRow = Utilities.formatDate(tglRow, tz, "yyyy-MM-dd");
      else if (tglRow) tglRow = tglRow.toString().trim().substring(0, 10);

      const userRow = data[r][3] ? data[r][3].toString().trim() : "";
      if (userRow === username && (!targetTanggal || tglRow === targetTanggal)) {
        sheet.deleteRow(r + 1);
        deletedCount++;
      }
    }
    return { success: true, message: "Berhasil menghapus permanen " + deletedCount + " entri Misi #" + habitId + " dari Spreadsheet!" };
  } catch (error) {
    return { success: false, message: "Gagal menghapus entri jurnal: " + error.toString() };
  }
}

function hapusJurnalSiswaTanggal(payload) {
  try {
    const tz = "Asia/Jakarta";
    const username = (payload.username || "").toString().trim();
    const targetTanggal = (payload.tanggal || "").toString().trim();
    let totalDeleted = 0;

    for (let i = 1; i <= 7; i++) {
      const sheet = getSheet('Habit_' + i);
      const data = sheet.getDataRange().getValues();

      for (let r = data.length - 1; r > 0; r--) {
        let tglRow = data[r][1];
        if (tglRow instanceof Date) tglRow = Utilities.formatDate(tglRow, tz, "yyyy-MM-dd");
        else if (tglRow) tglRow = tglRow.toString().trim().substring(0, 10);

        const userRow = data[r][3] ? data[r][3].toString().trim() : "";
        if (userRow === username && (!targetTanggal || tglRow === targetTanggal)) {
          sheet.deleteRow(r + 1);
          totalDeleted++;
        }
      }
    }
    return { success: true, message: "Berhasil menghapus permanen " + totalDeleted + " data jurnal dari server Google Sheets!" };
  } catch (error) {
    return { success: false, message: "Gagal menghapus jurnal: " + error.toString() };
  }
}


// ==========================================
// 10. LAPORAN & STATISTIK ADMIN
// ==========================================
function ambilDataGabungan(role, filterKelas) {
  try {
    const tz = "Asia/Jakarta";
    const summaryMap = {};
    const kelasGuru = filterKelas ? filterKelas.toString().trim().toUpperCase() : '';

    const dataSiswa = getSheet('Data_Siswa').getDataRange().getValues();
    const mapKelasSiswa = {};
    for (let i = 1; i < dataSiswa.length; i++) {
      const nisn = dataSiswa[i][1] ? dataSiswa[i][1].toString().trim() : '';
      if (nisn) mapKelasSiswa[nisn] = dataSiswa[i][4] ? dataSiswa[i][4].toString().trim().toUpperCase() : '';
    }

    for (let i = 1; i <= 7; i++) {
      const data = getSheet('Habit_' + i).getDataRange().getValues();
      for (let r = 1; r < data.length; r++) {
        const row = data[r];
        const usernameSiswa = row[3] ? row[3].toString().trim() : '';

        let kelasDataSiswa = row[5] ? row[5].toString().trim().toUpperCase() : '';
        if (kelasDataSiswa === '' && mapKelasSiswa[usernameSiswa]) kelasDataSiswa = mapKelasSiswa[usernameSiswa];

        if (role === 'Guru' && kelasGuru !== '' && kelasGuru !== '-' && kelasGuru !== 'KEPSEK' && kelasDataSiswa !== kelasGuru) continue; 

        let tglRow = row[1];
        if (tglRow instanceof Date) tglRow = Utilities.formatDate(tglRow, tz, "yyyy-MM-dd");
        else if (tglRow) tglRow = tglRow.toString().trim().substring(0, 10);
        else continue; 

        const keyId = tglRow + "___" + usernameSiswa;
        if (!summaryMap[keyId]) {
          summaryMap[keyId] = { tanggal: tglRow, nama: row[4] ? row[4].toString() : 'Tanpa Nama', kelas: kelasDataSiswa || '-', username: usernameSiswa, h1: null, h2: null, h3: null, h4: null, h5: null, h6: null, h7: null };
        }
        
        let amanDetail = row[6];
        if (amanDetail instanceof Date) {
          amanDetail = Utilities.formatDate(amanDetail, tz, "HH:mm");
        } else if (amanDetail !== null && amanDetail !== undefined) {
          amanDetail = amanDetail.toString();
        }

        summaryMap[keyId]['h' + i] = { detail: amanDetail, url: row[7] || "" };
      }
    }
    
    const finalArray = Object.values(summaryMap);
    finalArray.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    return finalArray;
  } catch (error) { throw new Error("Gagal mengkompilasi data: " + error.message); }
}

function getDashboardKepsekData(role, filterKelas) {
  try {
    const tz = "Asia/Jakarta";
    const semuaData = ambilDataGabungan(role, filterKelas);
    const tglHariIni = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");

    let stats = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0, h7: 0 };
    const dataHariIni = semuaData.filter(d => d.tanggal === tglHariIni);
    
    dataHariIni.forEach(row => {
      if (row.h1) stats.h1++; if (row.h2) stats.h2++; if (row.h3) stats.h3++;
      if (row.h4) stats.h4++; if (row.h5) stats.h5++; if (row.h6) stats.h6++; if (row.h7) stats.h7++;
    });

    return { success: true, total: dataHariIni.length, stats: stats, tanggal: tglHariIni };
  } catch (error) { return { success: false, message: "Gagal memuat data dashboard: " + error.message }; }
}
`;
