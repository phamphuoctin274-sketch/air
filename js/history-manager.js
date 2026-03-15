/**
 * MODULE: HISTORY & EXCEL EXPORT
 */

async function loadHistory() {
    const startStr = document.getElementById('hist-start').value;
    const endStr = document.getElementById('hist-end').value;
    
    if (!startStr || !endStr) {
        alert("Vui lòng chọn đầy đủ thời gian!");
        return;
    }

    const startTime = new Date(startStr).getTime();
    const endTime = new Date(endStr).getTime();

    const snapshot = await database.ref('sensor_data')
        .orderByChild('timestamp')
        .startAt(startTime)
        .endAt(endTime)
        .once('value');

    const data = snapshot.val();
    const tbody = document.querySelector('#history-table tbody');
    tbody.innerHTML = "";

    if (!data) {
        tbody.innerHTML = "<tr><td colspan='6' class='text-center'>Không có dữ liệu trong khoảng này</td></tr>";
        return;
    }

    Object.values(data).sort((a,b) => b.timestamp - a.timestamp).forEach(item => {
        const aqi = AQI_TOOL.calculate(item.pm25);
        const row = `
            <tr>
                <td>${new Date(item.timestamp).toLocaleString()}</td>
                <td>${item.temp}</td>
                <td>${item.humid}</td>
                <td>${item.pm25}</td>
                <td><b style="color:${aqi.color}">${aqi.val}</b></td>
                <td><span class="badge" style="background-color:${aqi.color}">${aqi.level}</span></td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}
