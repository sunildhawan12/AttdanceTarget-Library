 const allowedLat = 26.486691442317298;
  const allowedLng = 74.63343361051672;
  const radius = 0.05;

  const studentMap = {
    "101": "Sunil",
    "102": "Arjun Ram",
    "469": "Mahendra Gahlot",
    "420": "Rahul Rawat",
    "506": "kana ram",
    "423": "Ramniwash",
    "105": "Jagdish kasaniyan",
    "106": "Mahender pg",
    "103": "Suheel",
    "104": "Rajesh",

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
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
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
    const now = new Date();
    const timeStr = now.toLocaleTimeString();

    if (dist <= radius) {
      // ✅ INSIDE: Auto IN lagao agar abhi tak IN nahi hai
      if (localStorage.getItem("attendanceStatus") !== "IN") {
        statusMsg.innerHTML = `
          ✅ Hello <b style="color:#ff009d">${name}</b>, आप Library क्षेत्र के अंदर हैं!<br>
          ✅ आपकी "🟢 <b>IN</b>" उपस्थिति दर्ज की गई है - समय: ⏰${timeStr}
        `;
        markAttendanceSilent("IN");
        localStorage.setItem("attendanceStatus", "IN");
      } else {
        // Already IN — only show message
        statusMsg.innerHTML = `✅ Welcome back <b style="color:#ff009d">${name}</b>, आप Library क्षेत्र के अंदर हैं!`;
      }

    } else {
      // ❌ OUTSIDE: Auto OUT lagao agar abhi tak OUT nahi hai
      if (localStorage.getItem("attendanceStatus") === "IN") {
        statusMsg.innerHTML = `
          ❌ <b>${name}</b>, आप Library क्षेत्र से बाहर आ गए हैं!<br>
          🔴 आपकी "OUT" उपस्थिति दर्ज की गई है - समय: ⏰${timeStr}
        `;
        markAttendanceSilent("OUT");
        localStorage.setItem("attendanceStatus", "OUT");
      } else {
        statusMsg.innerHTML = `❌ आप Library क्षेत्र के बाहर हैं।`;
      }
    }
  }, err => {
    statusMsg.innerHTML = `❌ Error: ${err.message}`;
  });
}

function markAttendanceSilent(status) {
  const id = localStorage.getItem("regId");
  if (!id) return;

  const formData = new URLSearchParams({
    ID: id,
    Status: status,
    Location: "auto"
  });

  fetch(URL, { method: "POST", body: formData })
    .then(res => {
      if (!res.ok) {
        statusMsg.innerHTML += "<br>❌ उपस्थिति दर्ज नहीं हो पाई। कृपया फिर से प्रयास करें।";
      }
    })
    .catch(() => {
      statusMsg.innerHTML += "<br>❌ नेटवर्क त्रुटि। कृपया कनेक्शन जांचें।";
    });
}

  function maskPhone(phone) {
    if (!phone || phone.length < 4) return phone;
    return phone.slice(0, 2) + "****" + phone.slice(-4);
  }
let historyData = [];
function showHistory() {
  const id = localStorage.getItem("regId");
  if (!id) return;

  const hb = document.getElementById("historyTableBody");
  const loaderDiv = document.getElementById("loaderMsg");

  // ✅ Show message below "Create Account" button
  loaderDiv.innerHTML = ` <span class="spinner" ></span> कृपया प्रतीक्षा करें...`;

  // Also show inside table as fallback
  hb.innerHTML = `
    <tr>
      <td colspan="4" style="text-align:center;">
        <span class="spinner" ></span> कृपया प्रतीक्षा करें...
      </td>
    </tr>`;

  document.getElementById("historyModal").style.display = "flex";

  setTimeout(() => {
    fetch(`${historyUrl}?type=history&id=${id}`)
      .then(res => res.json())
      .then(data => {
        loaderDiv.innerHTML = ""; // ✅ Clear message after load
        renderHistoryTable(data);
      })
      .catch(err => {
        console.error("इतिहास लोड करने में त्रुटि:", err);
        loaderDiv.innerHTML = "❌ इतिहास लोड करने में त्रुटि हुई!";
        hb.innerHTML = "<tr><td colspan='4'>❌ इतिहास लोड करने में विफल!</td></tr>";
      });
  }, 1000);
}



// ✅ Helper function सबसे ऊपर डालें
function convertToInputFormat(dateStr) {
  // "05-07-2025" → "2025-07-05"
  const parts = dateStr.split("-");
  if (parts.length !== 3) return ""; 
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

// फिर बाकी functions आएंगे जैसे:
function renderHistoryTable(data) {
  const hb = document.getElementById("historyTableBody");
  const selectedDate = document.getElementById("filterDate").value; // YYYY-MM-DD
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

  historyTableBody.innerHTML += `
    <tr style="background: ${index === 0 ? 'rgba(117, 197, 235, 0.72)' : 'white'}; border: 1px solid black;">
      <td style="border: 1px solid black;"><b style="color:rgb(77, 6, 243);">${e.name}</b></br>${maskedPhone}</td>
      <td style="border: 1px solid black;">${e.date}</td>
      <td style="border: 1px solid black;">${e.time}</td>
      <td style="border: 1px solid black;">${icon} ${e.status}</td>
    </tr>`;
})
}
