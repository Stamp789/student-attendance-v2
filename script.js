const users = {
  '66001': { password: '1234', role: 'student', name: 'มานี กล้าหาญ' },
  'teacher01': { password: 'admin123', role: 'teacher', name: 'ครูสมศรี' }
};

let attendanceHistory = [];

const webhookURL = 'https://script.google.com/macros/s/AKfycbzAoUIHjd4r5xdynOL44__nggFXdClM6AIKo4EbdVC9Eq__bU1lUKu6lDk2e5F8gniJ/exec';

function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  
  if (users[username] && users[username].password === password) {
    localStorage.setItem('user', JSON.stringify({ username, role: users[username].role }));
    if (users[username].role === 'student') {
      showStudentDashboard();
    } else {
      showTeacherDashboard();
    }
  } else {
    alert('รหัสผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  }
}

function logout() {
  localStorage.removeItem('user');
  location.reload();
}

function showStudentDashboard() {
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('dashboard-student').style.display = 'block';
  checkTodayAttendance();
}

function showTeacherDashboard() {
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('dashboard-teacher').style.display = 'block';
  renderChart();
}

function checkTodayAttendance() {
  const today = new Date().toISOString().split('T')[0];
  const user = JSON.parse(localStorage.getItem('user'));
  const checked = attendanceHistory.find(record => record.username === user.username && record.date === today);
  
  if (checked) {
    document.getElementById('student-alert').innerHTML = '✅ วันนี้คุณได้เช็คชื่อแล้ว!';
  } else {
    document.getElementById('student-alert').innerHTML = '⚠️ วันนี้คุณยังไม่ได้เช็คชื่อ!';
  }
}

function checkIn() {
  const today = new Date().toISOString().split('T')[0];
  const user = JSON.parse(localStorage.getItem('user'));
  
  const alreadyChecked = attendanceHistory.find(record => record.username === user.username && record.date === today);
  
  if (!alreadyChecked) {
    attendanceHistory.push({ username: user.username, date: today });
    sendToSheet(user.username, today);
    alert('เช็คชื่อสำเร็จ!');
  } else {
    alert('คุณได้เช็คชื่อแล้ววันนี้');
  }
  
  checkTodayAttendance();
}

function sendToSheet(username, today) {
  const data = {
    date: today,
    studentId: username,
    name: users[username].name,
    status: 'มาเรียน'
  };

  fetch(webhookURL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

function viewHistory() {
  const historyDiv = document.getElementById('student-history') || document.getElementById('teacher-student-list');
  historyDiv.innerHTML = '<h3>ประวัติการเช็คชื่อ</h3>';
  
  const today = new Date();
  let historyHTML = '<ul>';
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    const user = JSON.parse(localStorage.getItem('user'));
    const record = attendanceHistory.find(r => r.username === user.username && r.date === dateString);
    
    historyHTML += `<li>${dateString}: ${record ? '✅ มาเรียน' : '❌ ขาด'}</li>`;
  }
  
  historyHTML += '</ul>';
  historyDiv.innerHTML += historyHTML;
}

function viewStudentList() {
  const studentListDiv = document.getElementById('teacher-student-list');
  studentListDiv.innerHTML = '<h3>รายชื่อนักเรียน</h3><ul>';
  
  for (let username in users) {
    if (users[username].role === 'student') {
      const today = new Date().toISOString().split('T')[0];
      const record = attendanceHistory.find(r => r.username === username && r.date === today);
      studentListDiv.innerHTML += `<li>${username} : ${record ? '✅ มาเรียน' : '❌ ยังไม่มา'}</li>`;
    }
  }
  
  studentListDiv.innerHTML += '</ul>';
}

function downloadPDF() {
  const doc = new jsPDF();
  doc.text("รายงานการเช็คชื่อ", 10, 10);
  doc.text("ชั้นเรียน: ป.3/1", 10, 20);
  doc.text("นักเรียน: มานี กล้าหาญ", 10, 30);
  doc.text("สถานะ: มาเรียน", 10, 40);
  
  doc.save('attendance-report.pdf');
}

function renderChart() {
  const ctx = document.getElementById('attendanceChart').getContext('2d');
  const chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['มาเรียน', 'ขาดเรียน', 'ลา', 'สาย'],
      datasets: [{
        label: 'สรุปการมาเรียน',
        data: [80, 10, 5, 5],  // This would be dynamic based on real data
        backgroundColor: ['#28a745', '#dc3545', '#ffc107', '#007bff'],
      }]
    },
    options: {
      responsive: true
    }
  });
}

window.onload = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user) {
    if (user.role === 'student') {
      showStudentDashboard();
    } else {
      showTeacherDashboard();
    }
  }
};
