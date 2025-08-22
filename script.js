// ✅ Smart Attendance System (LocalStorage-only IN restriction with OUT block & auto history)
// ✅ Smart Attendance System (LocalStorage-only IN restriction with OUT block & auto history)


const allowedLat = 26.508982853131812;
const allowedLng = 74.54039096484861;
const radius = 0.05;

const studentMap = {
  "101": "Sunil Dhawan",
  "102": "Arjun Ram",
  "103": "Suheel",
  "104": "Rajesh",
  "105": "Jagdish kasaniyan",
  "106": "Mahender pg",
  "107": "Rajveer",
  "108": "Abhi",
  "109": "Manish",
  "110": "Manu",
  "469": "Mahendra Gahlot",
  "420": "Rahul Rawat",
  "506": "kana ram",
  "423": "Ramniwash"
  "Ajmer": "Yash"
};

const URL = "https://script.google.com/macros/s/AKfycbzhR-60-AUw2gL6_8ro7Dm3arl0exFNJ0a3n0MYPE-r-s4YwLrJDkJsT31mYk9LqqG92g/exec";
const historyUrl = "https://script.google.com/macros/s/AKfycbwYMb6IVNNSVO6E70ujDfO3x1x7G2sZX44X37MpTFiuBGysDNScXmsbZxuZUv-qJfXA/exec";
const statusMsg = document.getElementById("statusMsg");

// 🔁 Reset logic if day changed
const today = new Date().toLocaleDateString("en-GB");
if (localStorage.getItem("lastActionDate") !== today) {
  localStorage.removeItem("attendanceStatus");
  localStorage.removeItem("firstInTime");
  localStorage.setItem("lastActionDate", today);
}

window.onload = () => {
  const savedId = localStorage.getItem("regId");
  if (savedId && studentMap[savedId]) {
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("attendanceSection").style.display = "block";
    checkLocation(savedId);
  }
};

function saveAndProceed() {
  const id = document.getElementById("regInput").value.trim();
  if (!id || !studentMap[id]) return alert("❌ Invalid ID!");
  localStorage.setItem("regId", id);
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("attendanceSection").style.display = "block";
  checkLocation(id);
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
function checkLocation(id) {
  const name = studentMap[id];
  const today = new Date().toLocaleDateString("en-GB");
  const status = localStorage.getItem("attendanceStatus");
  const lastDate = localStorage.getItem("lastActionDate");

  // ✅ अगर पहले ही OUT हो चुका है
  if (lastDate === today && status === "OUT") {
    statusMsg.innerHTML = `❌ <b style="color:#ff009d">${name}</b>, आप पहले ही 🟢'IN' और '🔴OUT' हो चुके हैं! दोबारा अनुमत नहीं है।`;
    showHistory();
    return;
  }

  // ✅ अगर पहले ही IN हो चुका है (OUT नहीं हुआ)
  if (lastDate === today && status === "IN") {
    const time = localStorage.getItem("firstInTime");
    statusMsg.innerHTML = `✅ Hello <b style="color:#ff009d">${name}</b>, आप पहले ही "🟢IN" हो चुके हैं<br>⏰ समय: ${time}`;
    return;
  }

  // 📍 Location check start
  statusMsg.innerHTML = "📡 Location check हो रही है...";
  if (!navigator.geolocation) {
    statusMsg.innerHTML = "❌ Location supported नहीं है।";
    return;
  }

  navigator.geolocation.getCurrentPosition(pos => {
    const dist = getDistance(pos.coords.latitude, pos.coords.longitude, allowedLat, allowedLng);

    if (dist <= radius) {
      // ✅ Mark IN
      const now = new Date();
      const timeStr = now.toLocaleTimeString();

      localStorage.setItem("attendanceStatus", "IN");
      localStorage.setItem("lastActionDate", today);
      localStorage.setItem("firstInTime", timeStr);

      statusMsg.innerHTML = `✅ Hello <b style="color:#ff009d">${name}</b>, आप Library क्षेत्र के अंदर हैं!<br>✅ आपकी "🟢IN" उपस्थिति दर्ज की गई है - समय: ⏰${timeStr}`;
      markAttendanceSilent("IN");
      setTimeout(showHistory, 2000);
    } else {
      statusMsg.innerHTML = `❌ आप Library क्षेत्र से बाहर हैं (📏 ${dist.toFixed(2)} km)। IN उपस्थिति नहीं हो सकती।`;
    }

  }, err => {
    statusMsg.innerHTML = `❌ Location error: ${err.message}`;
  });
}


// ❗ Other functions remain unchanged — markAttendanceSilent, showHistory, etc.


function markAttendanceSilent(status) {
  const id = localStorage.getItem("regId");
  if (!id) return;
  const formData = new URLSearchParams({ ID: id, Status: status, Location: "auto" });
  fetch(URL, { method: "POST", body: formData })
    .then(res => console.log("✔ Attendance submitted"))
    .catch(err => console.error("❌ fetch error:", err));
}

function manualOut() {
  const id = localStorage.getItem("regId");
  if (!id) return;

  const name = studentMap[id];
  const attendanceStatus = localStorage.getItem("attendanceStatus");

  if (attendanceStatus !== "IN") {
    statusMsg.innerHTML = `⚠️ <b>${name}</b>, आपकी \"IN\" उपस्थिति नहीं मिली है। पहले IN करें फिर OUT करें।`;
    return;
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString();
  localStorage.setItem("attendanceStatus", "OUT");

  statusMsg.innerHTML = `🔴 आप Manual रूप से \"OUT\" हो गए हैं!<br>\"OUT\" उपस्थिति दर्ज की गई है - ⏰${timeStr}`;
  markAttendanceSilent("OUT");
  setTimeout(showHistory, 1500);
}

function showHistory() {
  const id = localStorage.getItem("regId");
  if (!id) return;

  const hb = document.getElementById("historyTableBody");
  const loaderDiv = document.getElementById("loaderMsg");

  loaderDiv.innerHTML = `<span class="spinner"></span> कृपया प्रतीक्षा करें...`;
  hb.innerHTML = `<tr><td colspan="4" style="text-align:center;"><span class="spinner"></span> कृपया प्रतीक्षा करें...</td></tr>`;
  document.getElementById("historyModal").style.display = "flex";

  fetch(`${historyUrl}?type=history&id=${id}`)
    .then(res => res.json())
    .then(data => {
      historyData = data; // 👈 global variable में save करो
      loaderDiv.innerHTML = "";
      renderHistoryTable(historyData); // 👈 render with global data
    })
    .catch(() => {
      loaderDiv.innerHTML = "❌ History लोड करने में त्रुटि हुई!";
      hb.innerHTML = "<tr><td colspan='4'>❌ History लोड करने में विफल!</td></tr>";
    });
}


function retryHistoryFetch(retry, status) {
  const id = localStorage.getItem("regId");
  fetch(`${historyUrl}?type=history&id=${id}`)
    .then(res => res.json())
    .then(data => {
      const today = new Date().toLocaleDateString("en-GB");
      if (data.some(e => e.date === today && e.status === status)) {
        historyData = data;
        renderHistoryTable(data);
        document.getElementById("historyModal").style.display = "flex";
      } else if (retry < 5) {
        setTimeout(() => retryHistoryFetch(retry + 1, status), 2000);
      } else {
        alert(`${status} History update नहीं हुआ, reload करके देखें।`);
      }
    })
    .catch(err => console.error("❌ retryHistoryFetch error:", err));
}
function convertToInputFormat(dateStr) {
  const parts = dateStr.split("/"); // MM/DD/YYYY
  if (parts.length !== 3) return "";
  const [mm, dd, yyyy] = parts;
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`; // YYYY-MM-DD
}


function renderHistoryTable(data) {
  const hb = document.getElementById("historyTableBody");
  const selectedDate = document.getElementById("filterDate").value;
  hb.innerHTML = "";

  const sorted = [...data].reverse();
  const filtered = selectedDate
    ? sorted.filter(e => convertToInputFormat(e.date) === selectedDate)
    : sorted;

  if (filtered.length === 0) {
    hb.innerHTML = "<tr><td colspan='5'>कोई डेटा नहीं मिला।</td></tr>";
    return;
  }

  filtered.forEach((e, index) => {
    const icon = e.status === "IN" ? "🟢" : "🔴";
    const maskedPhone = e.phone.replace(/^(\d{2})\d{4}(\d{4})$/, "$1****$2");
    hb.innerHTML += `
      <tr style="background: ${index === 0 ? 'rgba(117, 197, 235, 0.72)' : 'white'}; border: 1px solid black;">
        <td style="border: 1px solid black;"><b style="color:rgb(77, 6, 243);">${e.name}</b><br>${maskedPhone}</td>
        <td style="border: 1px solid black;">${e.date}</td>
        <td style="border: 1px solid black;">${e.time}</td>
        <td style="border: 1px solid black;">${icon} ${e.status}</td>
      </tr>`;
  });
}

