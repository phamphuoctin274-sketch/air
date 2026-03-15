/**
 * MODULE: FIREBASE LOGIC & REAL-TIME SYNC
 * Chức năng: Quản lý kết nối, lắng nghe dữ liệu và cập nhật UI động
 */

let database;
let currentDataLimit = 12; // Mặc định 3 giờ (mỗi 15p một bản ghi -> 4 bản ghi/giờ)

function initFirebase() {
    const config = {
        databaseURL: document.getElementById('cfg-host').value,
        apiKey: document.getElementById('cfg-auth').value
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(config);
    }
    database = firebase.database();
    
    // Kiểm tra trạng thái kết nối
    const statusRef = database.ref(".info/connected");
    statusRef.on("value", (snap) => {
        const statusDiv = document.getElementById('connection-status');
        if (snap.val() === true) {
            statusDiv.innerHTML = '<span class="badge bg-success"><i class="fas fa-wifi"></i> Đã kết nối Firebase</span>';
        } else {
            statusDiv.innerHTML = '<span class="badge bg-danger"><i class="fas fa-wifi-slash"></i> Mất kết nối</span>';
        }
    });

    // Bắt đầu lắng nghe dữ liệu real-time
    startDataListener();
}

function startDataListener() {
    const dataRef = database.ref('sensor_data').limitToLast(currentDataLimit);
    
    dataRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        const labels = [];
        const tempValues = [];
        const humidValues = [];
        const pmValues = [];

        Object.keys(data).forEach(key => {
            const entry = data[key];
            labels.push(new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
            tempValues.push(entry.temp);
            humidValues.push(entry.humid);
            pmValues.push(entry.pm25);
        });

        // Cập nhật biểu đồ (Truy cập từ app.js)
        updateCharts(labels, tempValues, humidValues, pmValues);
        
        // Cập nhật thẻ AQI hiện tại
        const latestPM = pmValues[pmValues.length - 1];
        renderCurrentAQI(latestPM);
    });
}

function updateViewRange(hours) {
    if(hours === 'custom') {
        const val = document.getElementById('custom-range').value;
        currentDataLimit = val ? parseInt(val) * 4 : 12;
    } else {
        currentDataLimit = hours * 4;
    }
    // Khởi động lại listener với giới hạn mới
    database.ref('sensor_data').off();
    startDataListener();
}

function renderCurrentAQI(pmValue) {
    const aqi = AQI_TOOL.calculate(pmValue);
    const card = document.getElementById('aqi-card-current');
    card.style.borderTop = `10px solid ${aqi.color}`;
    card.innerHTML = `
        <h5 class="text-muted">AQI HIỆN TẠI</h5>
        <h1 style="color: ${aqi.color}; font-size: 4rem;">${aqi.val}</h1>
        <h4 class="badge" style="background-color: ${aqi.color}">${aqi.level}</h4>
        <hr>
        <p class="small text-start"><b>Lời khuyên:</b> ${aqi.advice}</p>
    `;
}
