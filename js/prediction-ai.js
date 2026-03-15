/**
 * MODULE: AI PREDICTION (LINEAR REGRESSION)
 * Phương trình: y = ax + b
 */

async function calculatePrediction() {
    const predictHours = parseInt(document.getElementById('predict-slider').value);
    const resultArea = document.getElementById('predict-results');
    
    // Lấy 100 điểm dữ liệu gần nhất để làm mẫu train
    const snapshot = await database.ref('sensor_data').limitToLast(100).once('value');
    const data = snapshot.val();
    
    if (!data) return;

    const pmPoints = [];
    const tempPoints = [];
    let i = 0;

    Object.values(data).forEach(val => {
        pmPoints.push({ x: i, y: val.pm25 });
        tempPoints.push({ x: i, y: val.temp });
        i++;
    });

    const pmModel = performRegression(pmPoints);
    const tempModel = performRegression(tempPoints);

    // Dự đoán cho điểm thời gian tương lai (giả sử 1 giờ = 4 steps)
    const futureIndex = i + (predictHours * 4);
    const predPM = Math.max(0, (pmModel.a * futureIndex + pmModel.b)).toFixed(2);
    const predTemp = (tempModel.a * futureIndex + tempModel.b).toFixed(2);
    
    const aqiFuture = AQI_TOOL.calculate(parseFloat(predPM));

    resultArea.innerHTML = `
        <div class="row">
            <div class="col-md-6 mb-3">
                <div class="card bg-dark text-white p-4">
                    <h6>PM2.5 DỰ BÁO (${predictHours}H TỚI)</h6>
                    <h2 class="display-4">${predPM} µg/m³</h2>
                    <div class="d-flex align-items-center">
                        <div style="width:20px; height:20px; background:${aqiFuture.color}; margin-right:10px"></div>
                        <span>AQI Dự kiến: ${aqiFuture.val}</span>
                    </div>
                </div>
            </div>
            <div class="col-md-6 mb-3">
                <div class="card border-primary p-4">
                    <h6>NHIỆT ĐỘ DỰ BÁO</h6>
                    <h2 class="display-4 text-primary">${predTemp} °C</h2>
                    <p class="text-muted">Dựa trên phân tích hồi quy ${pmPoints.length} mẫu.</p>
                </div>
            </div>
        </div>
    `;
}

function performRegression(points) {
    const n = points.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    points.forEach(p => {
        sumX += p.x;
        sumY += p.y;
        sumXY += p.x * p.y;
        sumXX += p.x * p.x;
    });

    // Tính hệ số góc a và sai số b
    const a = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const b = (sumY - a * sumX) / n;

    return { a, b };
}
