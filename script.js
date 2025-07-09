// ✅ Optimized Auto Attendance with Fixed IN Display Time & Conditional OUT

const allowedLat = 26.486691442317298;
const allowedLng = 74.63343361051672;
const radius = 0.05;

const studentMap = {
  "101": "Sunil",
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
  "423": "Ramniwash",
};

const URL = "https://script.google.com/macros/s/AKfycbzhR-60-AUw2gL6_8ro7Dm3arl0exFNJ0a3n0MYPE-r-s4YwLrJDkJsT31mYk9LqqG92g/exec";
const historyUrl = "https://script.google.com/macros/s/AKfycbwYMb6IVNNSVO6E70ujDfO3x1x7G2sZX44X37MpTFiuBGysDNScXmsbZxuZUv-qJfXA/exec";

const statusMsg = document.getElementById("statusMsg");


window.onload = () => {
  const savedId = localStorage.getItem("regId");
  if (savedId && studentMap[savedId]) {
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("attendanceSection").style.display = "block";
    checkLocation(savedId);
  }

  setInterval(() => {
    const id = localStorage.getItem("regId");
    if (id && studentMap[id]) {
      checkLocation(id);
    }
  }, 60000);
};


function saveAndProceed() {
  const id = document.getElementById("regInput").value.trim();
  if (!id || !studentMap[id]) return alert("❌ Invalid Reg.No!");
  localStorage.setItem("regId", id);
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("attendanceSection").style.display = "block";
  checkLocation(id);
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function checkLocation(id) {
  statusMsg.innerHTML = "📡 Location check हो रही है...";
  if (!navigator.geolocation) {
    statusMsg.innerHTML = "❌ Location supported नहीं है।";
    return;
  }

  navigator.geolocation.getCurrentPosition(pos => {
    const dist = getDistance(pos.coords.latitude, pos.coords.longitude, allowedLat, allowedLng);
    const name = studentMap[id];
    const today = new Date().toLocaleDateString("en-GB");

    if (dist <= radius) {
      if (localStorage.getItem("attendanceStatus") !== "IN") {
        const now = new Date();
        const timeStr = now.toLocaleTimeString();
        localStorage.setItem("attendanceStatus", "IN");
        localStorage.setItem("lastInDate", today);
        localStorage.setItem("firstInTime", timeStr);

        statusMsg.innerHTML = `✅ Hello <b style="color:#ff009d">${name}</b>, आप Library क्षेत्र के अंदर हैं!<br>✅ आपकी \"🟢 <b>IN</b>\" उपस्थिति दर्ज की गई है - समय:<br> ⏰${timeStr}`;
        markAttendanceSilent("IN");
      } else {
        const timeStr = localStorage.getItem("firstInTime") || "पहले";
        statusMsg.innerHTML = `✅ Hello <b style="color:#ff009d">${name}</b>, आप Library क्षेत्र के अंदर हैं!<br>✅ आपकी उपस्थिति पहले ही ⏰${timeStr} पर दर्ज की जा चुकी है।`;
      }
    }  else {
  const lastInDate = localStorage.getItem("lastInDate");

  if (
    localStorage.getItem("attendanceStatus") === "IN" &&
    lastInDate === today &&
    dist >= 0.5 // 👉 500 meters condition
  ) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    localStorage.setItem("attendanceStatus", "OUT");

    statusMsg.innerHTML = `❌ <b>${name}</b>, आप Library क्षेत्र से <b>${dist.toFixed(2)} km</b> दूर हैं!<br>🔴 आपकी "OUT" उपस्थिति दर्ज की गई है - समय: ⏰${timeStr}`;
    markAttendanceSilent("OUT");

  } else if (dist < 0.5) {
    statusMsg.innerHTML = `⚠️ <b>${name}</b>, आप Library से थोड़ी ही दूरी पर हैं (📏 ${dist.toFixed(2)} km)। OUT तभी लगेगा जब दूरी 0.5 km से ज़्यादा हो।`;
  } else {
    statusMsg.innerHTML = `❌ आप Library क्षेत्र के बाहर हैं,<br>लेकिन आपकी "IN" उपस्थिति नहीं मिली इसलिए "OUT" नहीं की गई।`;
  }
}

  }, err => {
    statusMsg.innerHTML = `❌ Error: ${err.message}`;
  });
}


function markAttendanceSilent(status) {
  const id = localStorage.getItem("regId");
  if (!id) return;

  if (status === "IN") {
    localStorage.setItem("attendanceStatus", "IN");
    localStorage.setItem("lastInDate", new Date().toLocaleDateString("en-GB"));
  }

  const formData = new URLSearchParams({ ID: id, Status: status, Location: "auto" });
  fetch(URL, { method: "POST", body: formData })
    .then(res => {
      console.log(`✅ ${status} request response`, res.ok);
      if (res.ok && status === "IN") {
        retryHistoryFetch(0, status);
      } else if (res.ok && status === "OUT") {
        showHistory();
      }
    })
    .catch(err => console.error("❌ fetch error:", err));
}
function manualOut() {
  const id = localStorage.getItem("regId");
  if (!id) return;

  const name = studentMap[id];
  const today = new Date().toLocaleDateString("en-GB");
  const lastInDate = localStorage.getItem("lastInDate");
  const status = localStorage.getItem("attendanceStatus");

  // ✅ OUT तभी मान्य जब आज IN किया हो और अभी तक OUT ना हुआ हो
  if (lastInDate !== today || status !== "IN") {
    statusMsg.innerHTML = `⚠️ <b>${name}</b>, आपकी "IN" उपस्थिति नहीं मिली है। पहले IN करें फिर OUT करें।`;
    return;
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString();
  localStorage.setItem("attendanceStatus", "OUT");

  statusMsg.innerHTML = `🔴 आप Manual रूप से "OUT" हो गए हैं!<br>🔴 आपकी "OUT" उपस्थिति दर्ज की गई है - समय: ⏰${timeStr}`;
  markAttendanceSilent("OUT");
}


function showHistory() {
  const id = localStorage.getItem("regId");
  if (!id) return;

  const hb = document.getElementById("historyTableBody");
  const loaderDiv = document.getElementById("loaderMsg");

  loaderDiv.innerHTML = `<span class="spinner"></span> कृपया प्रतीक्षा करें...`;
  hb.innerHTML = `<tr><td colspan="4" style="text-align:center;"><span class="spinner"></span> कृपया प्रतीक्षा करें...</td></tr>`;
  document.getElementById("historyModal").style.display = "flex";

  setTimeout(() => {
    fetch(`${historyUrl}?type=history&id=${id}`)
      .then(res => res.json())
      .then(data => {
        loaderDiv.innerHTML = "";
        renderHistoryTable(data);
      })
      .catch(() => {
        loaderDiv.innerHTML = "❌ इतिहास लोड करने में त्रुटि हुई!";
        hb.innerHTML = "<tr><td colspan='4'>❌ इतिहास लोड करने में विफल!</td></tr>";
      });
  }, 1000);
}

function retryHistoryFetch(retry, status) {
  const id = localStorage.getItem("regId");
  fetch(`${historyUrl}?type=history&id=${id}`)
    .then(res => res.json())
    .then(data => {
      const today = new Date().toLocaleDateString("en-GB");
      if (data.some(e => e.date === today && e.status === status)) {
        renderHistoryTable(data);
        document.getElementById("historyModal").style.display = "flex";
      } else if (retry < 5) {
        setTimeout(() => retryHistoryFetch(retry + 1, status), 2000);
      } else {
        alert(`${status} history update नहीं हुआ, reload करके देखें।`);
      }
    })
    .catch(err => console.error("❌ retryHistoryFetch error:", err));
}

function convertToInputFormat(dateStr) {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return "";
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
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
