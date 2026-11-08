const canvas = document.getElementById('mainCanvas');
    const ctx = canvas.getContext('2d');

    let currentMode = '2D'; // '2D' hoặc '3D'
    let simRunning = true;
    let pulseTick = 0;

    // ==================== BIẾN ĐIỀU KHIỂN CAD 2D ====================
    const CAD_W = 1650;
    const CAD_H = 1080;
    let camX = CAD_W / 2;
    let camY = CAD_H / 2;
    let zoom2D = 0.75;
    let selectedNet = null;
    const layers = { power: true, signal: true, fluid: true, pinout: true };

    const NET_DATABASE = {
      "NET_12V_RAW": {
        name: "12V_BAT (Nguồn Pin 3S)", color: "#ef4444",
        spec: "Điện áp: 11.1V - 12.6V DC | Dây: AWG20 Đỏ | Cực (+) Pin 3S 18650 -> Cầu chì 2A -> Công tắc SW_ON -> IN+ (LM2596) & VIN+ (MOSFET D4184)"
      },
      "NET_GND": {
        name: "GND_COMMON (Mass chung)", color: "#64748b",
        spec: "Điện áp: 0V (Mass chung toàn mạch) | Dây: AWG20/22 Đen | Pin 3S (-) <-> LM2596 <-> ESP8266 (GND) <-> MPU6050 <-> MOSFET <-> Reed Switch"
      },
      "NET_5V_BUCK": {
        name: "5V_VCC (Nguồn sau hạ áp)", color: "#f97316",
        spec: "Điện áp: 5.0V DC ổn áp | Dây: AWG22 Cam | Chân OUT+ (LM2596) -> Chân VIN (ESP8266 NodeMCU)"
      },
      "NET_3V3": {
        name: "3V3_LOGIC (Nguồn nuôi cảm biến)", color: "#fb7185",
        spec: "Điện áp: 3.3V DC | Dây: AWG24 Hồng | Chân 3V3 (ESP8266) -> Chân VCC (MPU6050) & VCC (Cảm biến mưa)"
      },
      "NET_I2C_SCL": {
        name: "I2C_SCL (Xung nhịp 400kHz)", color: "#22d3ee",
        spec: "Tín hiệu: I2C Clock (3.3V) | Dây: AWG24 Xanh Dương | Chân D1 / GPIO5 (ESP8266) -> Chân SCL (MPU6050)"
      },
      "NET_I2C_SDA": {
        name: "I2C_SDA (Dữ liệu 400kHz)", color: "#38bdf8",
        spec: "Tín hiệu: I2C Data (Địa chỉ 0x68) | Dây: AWG24 Xanh Lam | Chân D2 / GPIO4 (ESP8266) -> Chân SDA (MPU6050)"
      },
      "NET_GPIO14_PUMP": {
        name: "PWM_PUMP (Lệnh kích Bơm)", color: "#eab308",
        spec: "Tín hiệu: Digital Output (3.3V, mở 400ms/chu kỳ) | Dây: AWG24 Vàng | Chân D5 / GPIO14 (ESP8266) -> Chân PWM/SIG (MOSFET D4184)"
      },
      "NET_GPIO12_STAND": {
        name: "KICKSTAND_SW (Tín hiệu chân chống)", color: "#10b981",
        spec: "Tín hiệu: INPUT_PULLUP (LOW = Hạ chống ngắt bơm) | Dây: AWG24 Xanh Lá | Chân D6 / GPIO12 (ESP8266) -> Tiếp điểm NO (Reed Switch)"
      },
      "NET_ADC0_RAIN": {
        name: "ADC0_SENSOR2 (Cảm biến mưa)", color: "#c084fc",
        spec: "Tín hiệu: Analog 0 - 1.0V | Dây: AWG24 Tím | Chân A0 / ADC0 (ESP8266) -> Chân AO (Cảm biến nước mưa)"
      },
      "NET_PUMP_12V": {
        name: "PUMP_DRIVE_12V (Nguồn cấp Bơm)", color: "#f43f5e",
        spec: "Điện áp: 12V DC (0.12A) + Đi-ốt 1N4007 chống xung ngược | Dây: AWG20 | VOUT+/VOUT- (MOSFET) -> M+/M- (Bơm nhu động 12V)"
      },
      "NET_OIL_LINE": {
        name: "FLUID_PU_4MM (Ống dẫn nhớt)", color: "#f59e0b",
        spec: "Ống Polyurethane (PU) chịu dầu Ø4x2.5mm | Bình 300ml -> Van khóa BUC-4 -> Bơm nhu động 12V -> Gắp phải COURAGE -> Vòi Inox 45°"
      }
    };

    const WIRES = [
      { layer: 'power', net: 'NET_12V_RAW', pts: [[230, 210], [290, 210], [340, 210], [430, 210]] },
      { layer: 'power', net: 'NET_12V_RAW', pts: [[390, 210], [390, 130], [920, 130], [920, 210], [960, 210]] },
      { layer: 'power', net: 'NET_5V_BUCK', pts: [[570, 210], [640, 210]] },
      { layer: 'power', net: 'NET_3V3', pts: [[640, 390], [560, 390], [560, 560], [480, 560]] },
      { layer: 'power', net: 'NET_3V3', pts: [[560, 560], [560, 745], [480, 745]] },
      { layer: 'power', net: 'NET_GND', pts: [[230, 260], [430, 260]] },
      { layer: 'power', net: 'NET_GND', pts: [[570, 260], [605, 260], [605, 350], [640, 350]] },
      { layer: 'power', net: 'NET_GND', pts: [[605, 350], [605, 585], [480, 585]] },
      { layer: 'power', net: 'NET_GND', pts: [[605, 585], [605, 770], [480, 770]] },
      { layer: 'power', net: 'NET_GND', pts: [[605, 770], [605, 920], [480, 920]] },
      { layer: 'power', net: 'NET_GND', pts: [[605, 260], [605, 160], [890, 160], [890, 250], [960, 250]] },
      { layer: 'power', net: 'NET_GND', pts: [[890, 250], [890, 340], [960, 340]] },
      { layer: 'power', net: 'NET_PUMP_12V', pts: [[1120, 210], [1230, 210], [1230, 410], [1160, 410]] },
      { layer: 'power', net: 'NET_PUMP_12V', pts: [[1120, 250], [1200, 250], [1200, 450], [1160, 450]] },
      { layer: 'signal', net: 'NET_I2C_SCL', pts: [[840, 230], [875, 230], [875, 610], [480, 610]] },
      { layer: 'signal', net: 'NET_I2C_SDA', pts: [[840, 265], [860, 265], [860, 635], [480, 635]] },
      { layer: 'signal', net: 'NET_GPIO14_PUMP', pts: [[840, 310], [960, 310]] },
      { layer: 'signal', net: 'NET_GPIO12_STAND', pts: [[840, 355], [905, 355], [905, 885], [480, 885]] },
      { layer: 'signal', net: 'NET_ADC0_RAIN', pts: [[640, 295], [530, 295], [530, 795], [480, 795]] },
      { layer: 'fluid', net: 'NET_OIL_LINE', pts: [[1410, 250], [1410, 320]] },
      { layer: 'fluid', net: 'NET_OIL_LINE', pts: [[1410, 390], [1410, 450], [1290, 450], [1290, 520], [1160, 520]] },
      { layer: 'fluid', net: 'NET_OIL_LINE', pts: [[1160, 560], [1290, 560], [1290, 690], [1410, 690]] }
    ];

    const BLOCKS = [
      {
        id: 'BAT_3S', x: 70, y: 170, w: 160, h: 120,
        title: 'KHỐI 1: PIN 3S 18650', sub: '11.1V - 12.6V DC (2600mAh)', net: 'NET_12V_RAW',
        pins: [
          { x: 230, y: 210, label: 'BAT+ (12V)', side: 'right', col: '#ef4444' },
          { x: 230, y: 260, label: 'BAT- (GND)', side: 'right', col: '#94a3b8' }
        ]
      },
      {
        id: 'BUCK_LM2596', x: 430, y: 170, w: 140, h: 120,
        title: 'KHỐI 2: HẠ ÁP LM2596', sub: 'Buck DC-DC 12V -> 5.0V (3A)', net: 'NET_5V_BUCK',
        pins: [
          { x: 430, y: 210, label: 'IN+', side: 'left', col: '#ef4444' },
          { x: 430, y: 260, label: 'IN-', side: 'left', col: '#94a3b8' },
          { x: 570, y: 210, label: 'OUT+ (5V)', side: 'right', col: '#f97316' },
          { x: 570, y: 260, label: 'OUT- (GND)', side: 'right', col: '#94a3b8' }
        ]
      },
      {
        id: 'MCU_ESP8266', x: 640, y: 170, w: 200, h: 260,
        title: 'KHỐI 3: ESP8266 (ESP-12E)', sub: 'NodeMCU 1.0 • AP: 192.168.4.1', net: 'NET_GPIO14_PUMP',
        pins: [
          { x: 640, y: 210, label: 'VIN (5V)', side: 'left', col: '#f97316' },
          { x: 640, y: 295, label: 'A0 (ADC0)', side: 'left', col: '#c084fc' },
          { x: 640, y: 350, label: 'GND', side: 'left', col: '#94a3b8' },
          { x: 640, y: 390, label: '3V3 (Out)', side: 'left', col: '#fb7185' },
          { x: 840, y: 230, label: 'D1 (GPIO5/SCL)', side: 'right', col: '#22d3ee' },
          { x: 840, y: 265, label: 'D2 (GPIO4/SDA)', side: 'right', col: '#38bdf8' },
          { x: 840, y: 310, label: 'D5 (GPIO14)', side: 'right', col: '#eab308' },
          { x: 840, y: 355, label: 'D6 (GPIO12)', side: 'right', col: '#10b981' }
        ]
      },
      {
        id: 'MOSFET_D4184', x: 960, y: 170, w: 160, h: 200,
        title: 'KHỐI 4: MOSFET D4184', sub: 'Cách ly & Kích tải 12V (15A)', net: 'NET_PUMP_12V',
        pins: [
          { x: 960, y: 210, label: 'VIN+ (12V)', side: 'left', col: '#ef4444' },
          { x: 960, y: 250, label: 'VIN- (GND)', side: 'left', col: '#94a3b8' },
          { x: 960, y: 310, label: 'PWM (SIG)', side: 'left', col: '#eab308' },
          { x: 960, y: 340, label: 'GND (Logic)', side: 'left', col: '#94a3b8' },
          { x: 1120, y: 210, label: 'VOUT+ (M+)', side: 'right', col: '#f43f5e' },
          { x: 1120, y: 250, label: 'VOUT- (M-)', side: 'right', col: '#94a3b8' }
        ]
      },
      {
        id: 'SENS_MPU6050', x: 270, y: 530, w: 210, h: 135,
        title: 'KHỐI 5: CẢM BIẾN MPU6050', sub: 'Gia tốc 3 trục I2C (Địa chỉ 0x68)', net: 'NET_I2C_SDA',
        pins: [
          { x: 480, y: 560, label: 'VCC (3.3V)', side: 'right', col: '#fb7185' },
          { x: 480, y: 585, label: 'GND', side: 'right', col: '#94a3b8' },
          { x: 480, y: 610, label: 'SCL (D1)', side: 'right', col: '#22d3ee' },
          { x: 480, y: 635, label: 'SDA (D2)', side: 'right', col: '#38bdf8' }
        ]
      },
      {
        id: 'SENS_RAIN', x: 270, y: 715, w: 210, h: 105,
        title: 'KHỐI 6: CẢM BIẾN PHỤ (MƯA)', sub: 'Slot cảm biến thứ 2 (Tùy chọn)', net: 'NET_ADC0_RAIN',
        pins: [
          { x: 480, y: 745, label: 'VCC (3.3V)', side: 'right', col: '#fb7185' },
          { x: 480, y: 770, label: 'GND', side: 'right', col: '#94a3b8' },
          { x: 480, y: 795, label: 'AO (A0)', side: 'right', col: '#c084fc' }
        ]
      },
      {
        id: 'SENS_REED', x: 270, y: 855, w: 210, h: 95,
        title: 'KHỐI 7: CÔNG TẮC TỪ CHÂN CHỐNG', sub: 'Reed Switch + Nam châm (Gắp trái)', net: 'NET_GPIO12_STAND',
        pins: [
          { x: 480, y: 885, label: 'NO (Về D6)', side: 'right', col: '#10b981' },
          { x: 480, y: 920, label: 'COM (GND)', side: 'right', col: '#94a3b8' }
        ]
      },
      {
        id: 'PUMP_G168', x: 960, y: 390, w: 200, h: 200,
        title: 'KHỐI 8: BƠM NHU ĐỘNG 12V', sub: 'G168 Peristaltic 0.12A (Tự khóa kín)', net: 'NET_OIL_LINE',
        pins: [
          { x: 1160, y: 410, label: 'M+ (12V Đỏ)', side: 'right', col: '#f43f5e' },
          { x: 1160, y: 450, label: 'M- (GND Đen)', side: 'right', col: '#94a3b8' },
          { x: 1160, y: 520, label: 'INLET Ø3.9mm', side: 'right', col: '#f59e0b' },
          { x: 1160, y: 560, label: 'OUTLET Ø3.9mm', side: 'right', col: '#f59e0b' }
        ]
      }
    ];

    // ==================== BIẾN ĐIỀU KHIỂN MÔ HÌNH 3D REP 1:1 ====================
    let rotY = -0.35, rotX = 0.16;
    let zoom3D = 1.0, targetZoom3D = 1.0;
    let baseScale3D = 1.0;
    let pan3DX = 0, pan3DY = 0, targetPan3DX = 0, targetPan3DY = 0;
    let autoRotate3D = true;
    let showLabels3D = true;
    let focusKit3D = false;
    let wheelAngle = 0;
    let dropProg = 0;
    let renderQueue3D = [];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      baseScale3D = Math.max(0.58, Math.min(1.35, Math.min(window.innerWidth / 450, window.innerHeight / 360)));
    }
    window.addEventListener('resize', () => { resize(); fitAll(); });
    resize();

    function fitAll() {
      if (currentMode === '2D') {
        const pad = 40;
        const w = window.innerWidth - pad * 2;
        const h = window.innerHeight - 110;
        zoom2D = Math.max(0.22, Math.min(1.5, Math.min(w / CAD_W, h / CAD_H)));
        camX = CAD_W / 2;
        camY = CAD_H / 2;
      } else {
        targetZoom3D = 1.0;
        targetPan3DX = 0;
        targetPan3DY = 0;
        focusKit3D = false;
      }
    }
    fitAll();

    function worldToScreen(wx, wy) {
      return {
        x: window.innerWidth / 2 + (wx - camX) * zoom2D,
        y: window.innerHeight / 2 + (wy - camY) * zoom2D
      };
    }

    function screenToWorld(sx, sy) {
      return {
        x: camX + (sx - window.innerWidth / 2) / zoom2D,
        y: camY + (sy - window.innerHeight / 2) / zoom2D
      };
    }

    // ==================== CÁC HÀM VẼ CAD 2D ====================
    function drawGrid2D() {
      const stepMinor = 25, stepMajor = 100;
      const tl = screenToWorld(0, 0);
      const br = screenToWorld(window.innerWidth, window.innerHeight);
      const startX = Math.floor(tl.x / stepMinor) * stepMinor;
      const endX = Math.ceil(br.x / stepMinor) * stepMinor;
      const startY = Math.floor(tl.y / stepMinor) * stepMinor;
      const endY = Math.ceil(br.y / stepMinor) * stepMinor;

      ctx.lineWidth = 1;
      for (let x = startX; x <= endX; x += stepMinor) {
        const sx = worldToScreen(x, 0).x;
        ctx.strokeStyle = (x % stepMajor === 0) ? 'rgba(56, 189, 248, 0.14)' : 'rgba(30, 58, 138, 0.16)';
        ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, window.innerHeight); ctx.stroke();
      }
      for (let y = startY; y <= endY; y += stepMinor) {
        const sy = worldToScreen(0, y).y;
        ctx.strokeStyle = (y % stepMajor === 0) ? 'rgba(56, 189, 248, 0.14)' : 'rgba(30, 58, 138, 0.16)';
        ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(window.innerWidth, sy); ctx.stroke();
      }
    }

    function renderCAD2D() {
      drawGrid2D();
      ctx.save();
      ctx.translate(window.innerWidth / 2, window.innerHeight / 2);
      ctx.scale(zoom2D, zoom2D);
      ctx.translate(-camX, -camY);

      // Khung bản vẽ tiêu chuẩn
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, CAD_W - 40, CAD_H - 40);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(32, 32, CAD_W - 64, CAD_H - 64);

      // Khung tên kỹ thuật góc dưới phải
      const tbX = 960, tbY = 895, tbW = 658, tbH = 153;
      ctx.fillStyle = 'rgba(11, 18, 32, 0.94)';
      ctx.fillRect(tbX, tbY, tbW, tbH);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.6;
      ctx.strokeRect(tbX, tbY, tbW, tbH);
      ctx.beginPath();
      ctx.moveTo(tbX, tbY + 42); ctx.lineTo(tbX + tbW, tbY + 42);
      ctx.moveTo(tbX, tbY + 85); ctx.lineTo(tbX + tbW, tbY + 85);
      ctx.moveTo(tbX, tbY + 120); ctx.lineTo(tbX + tbW, tbY + 120);
      ctx.moveTo(tbX + 430, tbY + 42); ctx.lineTo(tbX + 430, tbY + tbH);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('BẢN VẼ CAD 2D: HỆ THỐNG TRA NHỚT SÊN TỰ ĐỘNG ESP8266 (REP 1:1)', tbX + 14, tbY + 26);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '11.5px monospace';
      ctx.fillText('MẪU XE THỬ NGHIỆM: XE ĐẠP ĐỊA HÌNH TRIOBLADE RC750', tbX + 14, tbY + 67);
      ctx.fillText('VI ĐIỀU KHIỂN: NodeMCU ESP8266 (ESP-12E) + Cảm biến MPU6050', tbX + 14, tbY + 107);
      ctx.fillText('CƠ CẤU CHẤP HÀNH: Bơm nhu động 12V 0.12A + MOSFET D4184 + Reed Switch', tbX + 14, tbY + 141);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('MÃ BẢN VẼ: CAD-OILER-2D-V1', tbX + 442, tbY + 67);
      ctx.fillText('TỶ LỆ: 1:1  | ĐƠN VỊ: mm', tbX + 442, tbY + 107);
      ctx.fillStyle = '#10b981';
      ctx.fillText('NGÂN SÁCH: < 400.000 VNĐ', tbX + 442, tbY + 141);

      // Bảng Pinout
      if (layers.pinout) {
        const tx = 70, ty = 335, tw = 445, th = 165;
        ctx.fillStyle = 'rgba(11, 18, 32, 0.94)';
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1.5;
        ctx.fillRect(tx, ty, tw, th);
        ctx.strokeRect(tx, ty, tw, th);
        ctx.fillStyle = '#c084fc';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('BẢNG ĐẤU NỐI CHÂN TIẾP XÚC VI ĐIỀU KHIỂN ESP8266 (PINOUT)', tx + 12, ty + 20);
        const rows = [
          ['CHÂN BOARD', 'GPIO', 'ĐIỂM ĐẤU NỐI TIẾP XÚC', 'ĐIỆN ÁP / LOGIC'],
          ['VIN / GND', 'PWR', 'OUT+ / OUT- Mạch Buck LM2596', '5.0V DC ổn áp'],
          ['D1 / D2', 'GPIO5/4', 'Chân SCL / SDA Cảm biến MPU6050', '3.3V I2C (400kHz)'],
          ['D5', 'GPIO14', 'Chân PWM Module MOSFET D4184', 'HIGH (400ms) = Bơm'],
          ['D6', 'GPIO12', 'Chân NO Công tắc từ Chân chống trái', 'LOW (GND) = Ngắt'],
          ['A0', 'ADC0', 'Chân AO Cảm biến mưa (Tùy chọn)', 'Analog 0 - 1.0V']
        ];
        rows.forEach((r, idx) => {
          const ry = ty + 46 + idx * 21;
          ctx.fillStyle = idx === 0 ? '#38bdf8' : '#e2e8f0';
          ctx.font = idx === 0 ? 'bold 9.5px monospace' : '9.5px monospace';
          ctx.fillText(r[0], tx + 10, ry);
          ctx.fillText(r[1], tx + 92, ry);
          ctx.fillText(r[2], tx + 155, ry);
          ctx.fillText(r[3], tx + 345, ry);
        });
      }

      // Hệ thống thủy lực
      if (layers.fluid) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(1340, 110, 140, 140, 12); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
        ctx.fillRect(1346, 145, 128, 98);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(1385, 92, 50, 18);
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('BÌNH NHỚT 300ML', 1354, 134);

        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#f59e0b';
        ctx.fillRect(1360, 320, 100, 70);
        ctx.strokeRect(1360, 320, 100, 70);
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('VAN KHÓA TỔNG', 1368, 348);

        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = '#f472b6';
        ctx.fillRect(1335, 640, 245, 195);
        ctx.strokeRect(1335, 640, 245, 195);
        ctx.fillStyle = '#f472b6';
        ctx.fillText('CỤM NHÔNG XÍCH (BÊN PHẢI)', 1348, 662);

        const sx = 1495, sy = 745;
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(sx, sy, 38, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#dc2626';
        ctx.beginPath(); ctx.arc(sx - 25, sy + 52, 12, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(1410, 690); ctx.lineTo(1455, 725); ctx.stroke();
        if (simRunning) {
          const dy = (pulseTick % 30) * 0.9;
          ctx.fillStyle = '#facc15';
          ctx.beginPath(); ctx.arc(1458, 730 + dy, 4.5, 0, Math.PI * 2); ctx.fill();
        }
      }

      // Dây dẫn
      WIRES.forEach(w => {
        if (!layers[w.layer]) return;
        const netObj = NET_DATABASE[w.net];
        const isSelected = (selectedNet === w.net);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(w.pts[0][0], w.pts[0][1]);
        for (let i = 1; i < w.pts.length; i++) ctx.lineTo(w.pts[i][0], w.pts[i][1]);

        if (w.layer === 'fluid') {
          ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(56, 189, 248, 0.55)';
          ctx.lineWidth = isSelected ? 9 : 7;
          ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 3.5;
          ctx.setLineDash([10, 6]);
          ctx.lineDashOffset = simRunning ? -pulseTick * 0.8 : 0;
          ctx.stroke();
        } else {
          ctx.strokeStyle = netObj ? netObj.color : '#38bdf8';
          ctx.lineWidth = isSelected ? 3.8 : (w.layer === 'power' ? 2.6 : 2.0);
          ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
        }
        ctx.restore();
      });

      // Cầu chì, Công tắc, Diode
      if (layers.power) {
        ctx.fillStyle = '#0f172a'; ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.6;
        ctx.fillRect(262, 198, 46, 24); ctx.strokeRect(262, 198, 46, 24);
        ctx.fillStyle = '#fca5a5'; ctx.font = 'bold 9.5px monospace'; ctx.fillText('FUSE 2A', 265, 213);

        ctx.fillStyle = '#0f172a'; ctx.strokeStyle = '#38bdf8';
        ctx.fillRect(328, 198, 48, 24); ctx.strokeRect(328, 198, 48, 24);
        ctx.fillStyle = '#38bdf8'; ctx.fillText('SW_ON', 336, 213);

        ctx.fillStyle = '#0f172a'; ctx.strokeStyle = '#f43f5e';
        ctx.fillRect(1182, 310, 78, 36); ctx.strokeRect(1182, 310, 78, 36);
        ctx.fillStyle = '#fda4af'; ctx.fillText('DIODE 1N4007', 1187, 328);
      }

      // Khối linh kiện
      BLOCKS.forEach(b => {
        const isSelected = (selectedNet === b.net);
        ctx.save();
        ctx.fillStyle = 'rgba(11, 18, 32, 0.95)';
        ctx.strokeStyle = isSelected ? '#ffffff' : '#38bdf8';
        ctx.lineWidth = isSelected ? 2.6 : 1.8;
        ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 6); ctx.fill(); ctx.stroke();

        ctx.fillStyle = 'rgba(14, 165, 233, 0.18)';
        ctx.fillRect(b.x + 1, b.y + 1, b.w - 2, 36);
        ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 11px monospace'; ctx.fillText(b.title, b.x + 10, b.y + 16);
        ctx.fillStyle = '#94a3b8'; ctx.font = '9.5px monospace'; ctx.fillText(b.sub, b.x + 10, b.y + 31);

        b.pins.forEach(p => {
          ctx.fillStyle = p.col;
          ctx.fillRect(p.x - 5, p.y - 5, 10, 10);
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 9.5px monospace';
          ctx.textAlign = p.side === 'left' ? 'left' : 'right';
          ctx.fillText(p.label, p.side === 'left' ? p.x + 9 : p.x - 9, p.y + 3);
        });
        ctx.restore();
      });

      ctx.restore();
    }

    // ==================== CÁC HÀM VẼ MÔ HÌNH 3D REP 1:1 ====================
    function project3D(x, y, z) {
      const x0 = x + pan3DX, y0 = y + pan3DY;
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const x1 = x0 * cosY - z * sinY;
      const z1 = z * cosY + x0 * sinY;
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      const y2 = y0 * cosX - z1 * sinX;
      const z2 = z1 * cosX + y0 * sinX;
      const fov = 720 * zoom3D * baseScale3D;
      const p = fov / Math.max(120, 680 + z2);
      return { x: window.innerWidth / 2 + x1 * p, y: window.innerHeight / 2 + y2 * p, z: z2, scale: p };
    }

    function pushSeg3D(p1, p2, r, col, innerCol = null, dashed = false) {
      const a = project3D(p1.x, p1.y, p1.z), b = project3D(p2.x, p2.y, p2.z);
      const w = Math.max(1.2, r * (a.scale + b.scale));
      renderQueue3D.push({
        z: (a.z + b.z) * 0.5,
        draw: () => {
          ctx.save();
          if (dashed) ctx.setLineDash([4, 3]);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.stroke();
          if (innerCol) {
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = innerCol; ctx.lineWidth = Math.max(0.8, w * 0.5); ctx.stroke();
          }
          ctx.restore();
        }
      });
    }

    function pushCircle3D(cx, cy, cz, radius, segs, fillCol, strokeCol, sw = 1.5) {
      const pts = [];
      for (let i = 0; i < segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        pts.push(project3D(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, cz));
      }
      const avgZ = pts.reduce((s, p) => s + p.z, 0) / pts.length;
      renderQueue3D.push({
        z: avgZ,
        draw: () => {
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
          ctx.closePath();
          if (fillCol) { ctx.fillStyle = fillCol; ctx.fill(); }
          if (strokeCol) { ctx.strokeStyle = strokeCol; ctx.lineWidth = Math.max(1, sw * pts[0].scale); ctx.stroke(); }
        }
      });
    }

    function drawMicroLabel3D(x, y, z, num, text, color, offsetSide = 1, offsetY = -12) {
      const p = project3D(x, y, z);
      const lx = p.x + offsetSide * 16, ly = p.y + offsetY;
      ctx.save();
      ctx.font = '600 9.5px sans-serif';
      const tw = ctx.measureText(text).width;
      const bw = tw + 20, bh = 16;
      const bx = offsetSide > 0 ? lx : lx - bw, by = ly - bh / 2;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(lx, ly); ctx.strokeStyle = color; ctx.stroke();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'; ctx.strokeStyle = color;
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f8fafc'; ctx.textBaseline = 'middle';
      ctx.fillText(num + '. ' + text, bx + 6, by + 8.5);
      ctx.restore();
    }

    function renderModel3D() {
      zoom3D += (targetZoom3D - zoom3D) * 0.12;
      pan3DX += (targetPan3DX - pan3DX) * 0.12;
      pan3DY += (targetPan3DY - pan3DY) * 0.12;
      if (autoRotate3D && !isPanning) rotY += 0.0065;
      if (simRunning) { wheelAngle += 0.035; dropProg = (dropProg + 0.025) % 1; }

      renderQueue3D = [];
      const rearAxle = { x: -135, y: 65, z: 0 }, frontAxle = { x: 140, y: 65, z: 0 };
      const bb = { x: -22, y: 68, z: 0 }, seatTop = { x: -62, y: -48, z: 0 };
      const headTop = { x: 84, y: -66, z: 0 }, headBot = { x: 96, y: -30, z: 0 };
      const pinkMain = '#f9a8d4', pinkCore = '#fbcfe8', driveZ = 18;

      // 2 Bánh xe
      [rearAxle, frontAxle].forEach(ax => {
        pushCircle3D(ax.x, ax.y, ax.z, 76, 28, null, '#111827', 8);
        pushCircle3D(ax.x, ax.y, ax.z, 70, 28, null, '#cbd5e1', 1);
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2 + wheelAngle;
          pushSeg3D({ x: ax.x, y: ax.y, z: (i % 2 ? -8 : 8) }, { x: ax.x + Math.cos(a) * 70, y: ax.y + Math.sin(a) * 70, z: 0 }, 0.5, '#94a3b8');
        }
      });

      // Khung TRIOBLADE RC750
      pushSeg3D(seatTop, headTop, 5.2, pinkMain, pinkCore);
      pushSeg3D(bb, headBot, 6.8, pinkMain, pinkCore);
      pushSeg3D(bb, seatTop, 5.5, pinkMain, pinkCore);
      pushSeg3D(headTop, headBot, 6.2, pinkMain, pinkCore);
      [-15, 15].forEach(zS => {
        pushSeg3D({ x: seatTop.x, y: seatTop.y + 8, z: 0 }, { x: rearAxle.x, y: rearAxle.y, z: zS }, 3.6, pinkMain);
        pushSeg3D({ x: bb.x, y: bb.y, z: zS * 0.5 }, { x: rearAxle.x, y: rearAxle.y, z: zS }, 4.2, pinkMain);
      });
      // Phuộc trước & Ghi đông
      [-14, 14].forEach(zS => pushSeg3D({ x: 102, y: -12, z: zS }, { x: frontAxle.x, y: frontAxle.y, z: zS }, 4.2, '#1e293b'));
      pushSeg3D(headTop, { x: 96, y: -88, z: 0 }, 4.5, '#0f172a');
      pushSeg3D({ x: 92, y: -90, z: -45 }, { x: 92, y: -90, z: 45 }, 3.8, '#1e293b');
      // Yên xe
      pushSeg3D(seatTop, { x: -72, y: -86, z: 0 }, 4, '#0f172a');
      pushSeg3D({ x: -90, y: -88, z: 0 }, { x: -50, y: -86, z: 0 }, 7, '#111827');

      // Xích líp phải + Củ đề đỏ
      pushCircle3D(rearAxle.x, rearAxle.y, driveZ, 18, 16, '#78350f', '#d97706', 2);
      pushCircle3D(bb.x, bb.y, driveZ, 26, 20, '#0f172a', '#334155', 3);
      const pulleyRed = { x: rearAxle.x - 4, y: rearAxle.y + 34, z: driveZ };
      pushCircle3D(pulleyRed.x, pulleyRed.y, pulleyRed.z, 7, 12, '#dc2626', '#f87171', 1.5);
      pushSeg3D({ x: bb.x, y: bb.y - 23, z: driveZ }, { x: rearAxle.x, y: rearAxle.y - 14, z: driveZ }, 2.2, '#a16207', '#facc15', true);
      pushSeg3D({ x: bb.x, y: bb.y + 23, z: driveZ }, pulleyRed, 2.2, '#a16207', '#facc15', true);

      // Bộ Kit Tra Nhớt ESP8266
      const manualValvePos = { x: 10, y: 34, z: 4 }, pumpPos = { x: -16, y: 38, z: 8 }, boxPos = { x: -34, y: -22, z: 0 };
      const standPivot = { x: -48, y: 68, z: -18 };
      const standTip = simRunning ? { x: -108, y: 76, z: -22 } : { x: -68, y: 142, z: -34 };
      const nozzleMount = { x: rearAxle.x + 12, y: rearAxle.y + 16, z: driveZ + 2 };
      const nozzleTip = { x: rearAxle.x + 2, y: rearAxle.y + 20, z: driveZ };

      pushSeg3D({ x: 34, y: -4, z: 0 }, { x: 16, y: 24, z: 0 }, 11, 'rgba(56, 189, 248, 0.45)', '#f59e0b');
      pushCircle3D(pumpPos.x, pumpPos.y, pumpPos.z + 5, 9, 14, '#f8fafc', '#38bdf8', 2);
      pushCircle3D(boxPos.x, boxPos.y, boxPos.z, 14, 16, '#0f172a', '#38bdf8', 2);
      pushSeg3D(standPivot, standTip, 3.8, '#1e293b');
      pushSeg3D({ x: 16, y: 24, z: 0 }, manualValvePos, 2.4, 'rgba(56,189,248,0.55)', '#f59e0b');
      pushSeg3D(manualValvePos, pumpPos, 2.4, 'rgba(56,189,248,0.55)', '#f59e0b');
      pushSeg3D(pumpPos, nozzleMount, 2.4, 'rgba(56,189,248,0.55)', '#f59e0b');
      pushSeg3D(nozzleMount, nozzleTip, 1.8, '#e2e8f0');

      renderQueue3D.sort((a, b) => b.z - a.z);
      renderQueue3D.forEach(it => it.draw());

      if (showLabels3D) {
        drawMicroLabel3D(26, 8, 0, "1", "Bình nhớt 300ml", "#f59e0b", 1, -22);
        drawMicroLabel3D(manualValvePos.x, manualValvePos.y, manualValvePos.z, "2", "Van khóa tổng", "#facc15", 1, 12);
        drawMicroLabel3D(boxPos.x, boxPos.y, boxPos.z, "3", "Hộp ESP8266 + MPU6050", "#38bdf8", -1, -24);
        drawMicroLabel3D(pumpPos.x, pumpPos.y, pumpPos.z, "4", "Bơm nhu động 12V", "#38bdf8", 1, -14);
        drawMicroLabel3D(standPivot.x, standPivot.y, standPivot.z, "5", "Cảm biến chân chống (Trái)", "#10b981", -1, 22);
        drawMicroLabel3D(nozzleTip.x, nozzleTip.y, nozzleTip.z, "6", "Vòi nhỏ 45° & Xích (Phải)", "#f472b6", -1, 20);
      }
    }

    function mainLoop() {
      pulseTick++;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (currentMode === '2D') {
        renderCAD2D();
      } else {
        renderModel3D();
      }
      requestAnimationFrame(mainLoop);
    }
    mainLoop();

    // ==================== TƯƠNG TÁC CHUỘT & CẢM ỨNG ====================
    let isPanning = false, startPanX = 0, startPanY = 0, downPos = { x: 0, y: 0 };

    canvas.addEventListener('pointerdown', (e) => {
      isPanning = true;
      startPanX = e.clientX;
      startPanY = e.clientY;
      downPos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('pointermove', (e) => {
      if (currentMode === '2D') {
        const mc = screenToWorld(e.clientX, e.clientY);
        document.getElementById('coordDisplay').textContent =
          `X: ${mc.x.toFixed(1)} | Y: ${mc.y.toFixed(1)} mm • Zoom: ${Math.round(zoom2D * 100)}%`;
        if (!isPanning) return;
        camX -= (e.clientX - startPanX) / zoom2D;
        camY -= (e.clientY - startPanY) / zoom2D;
      } else {
        if (!isPanning) return;
        rotY += (e.clientX - startPanX) * 0.008;
        rotX = Math.max(-0.65, Math.min(0.75, rotX + (e.clientY - startPanY) * 0.006));
      }
      startPanX = e.clientX;
      startPanY = e.clientY;
    });

    window.addEventListener('pointerup', (e) => {
      if (isPanning && currentMode === '2D' && Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) < 6) {
        const pt = screenToWorld(e.clientX, e.clientY);
        pickElementAt(pt.x, pt.y);
      }
      isPanning = false;
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (currentMode === '2D') {
        const before = screenToWorld(e.clientX, e.clientY);
        zoom2D = Math.max(0.2, Math.min(3.5, zoom2D * (e.deltaY < 0 ? 1.12 : 0.89)));
        const after = screenToWorld(e.clientX, e.clientY);
        camX += before.x - after.x;
        camY += before.y - after.y;
      } else {
        targetZoom3D = Math.max(0.65, Math.min(2.6, targetZoom3D - e.deltaY * 0.0012));
      }
    }, { passive: false });

    function pickElementAt(wx, wy) {
      for (const b of BLOCKS) {
        if (wx >= b.x && wx <= b.x + b.w && wy >= b.y && wy <= b.y + b.h) {
          selectNet(b.net); return;
        }
      }
      for (const w of WIRES) {
        if (!layers[w.layer]) continue;
        for (let i = 0; i < w.pts.length - 1; i++) {
          const ax = w.pts[i][0], ay = w.pts[i][1], bx = w.pts[i + 1][0], by = w.pts[i + 1][1];
          const l2 = (bx - ax) ** 2 + (by - ay) ** 2;
          let t = Math.max(0, Math.min(1, ((wx - ax) * (bx - ax) + (wy - ay) * (by - ay)) / (l2 || 1)));
          if (Math.hypot(wx - (ax + t * (bx - ax)), wy - (ay + t * (by - ay))) < 14) {
            selectNet(w.net); return;
          }
        }
      }
      selectedNet = null;
    }

    function selectNet(netKey) {
      selectedNet = netKey;
      const info = NET_DATABASE[netKey];
      if (info) {
        const badge = document.getElementById('netName');
        badge.textContent = info.name;
        badge.style.background = info.color;
        document.getElementById('netDesc').textContent = info.spec;
      }
    }

    // ==================== SỰ KIỆN NÚT ĐIỀU KHIỂN ====================
    const btnMode2D = document.getElementById('btnMode2D');
    const btnMode3D = document.getElementById('btnMode3D');
    const layerBar2D = document.getElementById('layerBar2D');
    const layerBar3D = document.getElementById('layerBar3D');

    btnMode2D.onclick = () => {
      currentMode = '2D';
      btnMode2D.classList.add('active');
      btnMode3D.classList.remove('active');
      layerBar2D.style.display = 'flex';
      layerBar3D.style.display = 'none';
      document.getElementById('netName').textContent = 'CHẾ ĐỘ CAD 2D';
      document.getElementById('netDesc').textContent = 'Chạm vào đường dây hoặc linh kiện để xem chi tiết chân tiếp xúc (Pinout).';
      fitAll();
    };

    btnMode3D.onclick = () => {
      currentMode = '3D';
      btnMode3D.classList.add('active');
      btnMode2D.classList.remove('active');
      layerBar2D.style.display = 'none';
      layerBar3D.style.display = 'flex';
      document.getElementById('netName').textContent = 'MÔ HÌNH 3D REP 1:1';
      document.getElementById('netDesc').textContent = 'Vuốt để xoay 360° toàn bộ xe đạp TRIOBLADE RC750 và hệ thống tra nhớt tự động.';
      fitAll();
    };

    document.getElementById('btnFit').onclick = fitAll;

    const btnSim = document.getElementById('btnSim');
    btnSim.onclick = () => {
      simRunning = !simRunning;
      btnSim.textContent = simRunning ? '⚡ Trạng thái: CHẠY' : '🛑 Trạng thái: HẠ CHỐNG (NGẮT)';
      btnSim.classList.toggle('active', !simRunning);
    };

    document.querySelectorAll('#layerBar2D [data-layer]').forEach(btn => {
      btn.onclick = () => {
        const k = btn.getAttribute('data-layer');
        layers[k] = !layers[k];
        btn.classList.toggle('active', layers[k]);
      };
    });

    document.getElementById('btn3DLabels').onclick = function () {
      showLabels3D = !showLabels3D;
      this.textContent = showLabels3D ? '🏷 Nhãn: Bật' : '🏷 Nhãn: Tắt';
      this.classList.toggle('active', showLabels3D);
    };

    document.getElementById('btn3DFocus').onclick = function () {
      focusKit3D = !focusKit3D;
      targetZoom3D = focusKit3D ? 1.75 : 1.0;
      targetPan3DX = focusKit3D ? 25 : 0;
      targetPan3DY = focusKit3D ? -20 : 0;
      this.classList.toggle('active', focusKit3D);
    };

    document.getElementById('btn3DSpin').onclick = function () {
      autoRotate3D = !autoRotate3D;
      this.classList.toggle('active', autoRotate3D);
    };

    // Xuất file AutoCAD .DXF
    document.getElementById('btnExportDXF').onclick = () => {
      let dxf = "0\nSECTION\n2\nENTITIES\n";
      const addLine = (x1, y1, x2, y2, layer) => {
        dxf += `0\nLINE\n8\n${layer}\n10\n${x1}\n20\n${-y1}\n11\n${x2}\n21\n${-y2}\n`;
      };
      const addRect = (x, y, w, h, layer) => {
        addLine(x, y, x + w, y, layer); addLine(x + w, y, x + w, y + h, layer);
        addLine(x + w, y + h, x, y + h, layer); addLine(x, y + h, x, y, layer);
      };
      addRect(20, 20, CAD_W - 40, CAD_H - 40, "BORDER");
      BLOCKS.forEach(b => addRect(b.x, b.y, b.w, b.h, "COMPONENTS"));
      WIRES.forEach(w => {
        for (let i = 0; i < w.pts.length - 1; i++) {
          addLine(w.pts[i][0], w.pts[i][1], w.pts[i + 1][0], w.pts[i + 1][1], w.net);
        }
      });
      dxf += "0\nENDSEC\n0\nEOF\n";
      downloadFile('So_Do_CAD_2D_ESP8266.dxf', dxf, 'application/dxf');
    };

    function downloadFile(filename, content, mime) {
      const blob = new Blob([content], { type: mime });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
    }

    // Tách & tải trọn bộ 3 file rời (index.html, style.css, app.js) để đưa lên GitHub / Vercel
    document.getElementById('btnDownloadSplit').onclick = () => {
      const cssContent = document.querySelector('style').innerHTML.trim();
      const jsContent = document.querySelector('script').innerHTML.trim();
      const bodyControls = `
  <div class="cad-topbar">
    <div class="cad-group">
      <button class="cad-btn mode-btn active" id="btnMode2D">📐 BẢN VẼ CAD 2D</button>
      <button class="cad-btn mode-btn" id="btnMode3D">🚲 MÔ HÌNH 3D REP 1:1</button>
      <button class="cad-btn" id="btnFit">⛶ Căn Giữa</button>
      <button class="cad-btn" id="btnSim">⚡ Trạng thái: CHẠY</button>
    </div>
    <div class="cad-group" id="layerBar2D">
      <button class="cad-btn active" data-layer="power"><span class="dot" style="background:#ef4444"></span>Nguồn 12V/5V</button>
      <button class="cad-btn active" data-layer="signal"><span class="dot" style="background:#22d3ee"></span>GPIO/I2C</button>
      <button class="cad-btn active" data-layer="fluid"><span class="dot" style="background:#f59e0b"></span>Ống nhớt PU</button>
      <button class="cad-btn active" data-layer="pinout"><span class="dot" style="background:#a855f7"></span>Bảng Pinout</button>
      <button class="cad-btn export" id="btnExportDXF">⬇ File .DXF</button>
      <button class="cad-btn export" id="btnDownloadSplit" style="display:none"></button>
    </div>
    <div class="cad-group" id="layerBar3D" style="display:none">
      <button class="cad-btn active" id="btn3DLabels">🏷 Nhãn: Bật</button>
      <button class="cad-btn" id="btn3DFocus">🔍 Cận cảnh Kit</button>
      <button class="cad-btn active" id="btn3DSpin">🔄 Tự xoay 360°</button>
    </div>
  </div>
  <canvas id="mainCanvas"></canvas>
  <div class="cad-statusbar">
    <div class="net-info">
      <span class="net-badge" id="netName">CHẾ ĐỘ CAD 2D</span>
      <span id="netDesc">Chạm vào đường dây hoặc khối linh kiện để kiểm tra chân tiếp xúc (Pinout).</span>
    </div>
    <div class="coords" id="coordDisplay">X: 0.0 | Y: 0.0 mm • Tỷ lệ 1:1</div>
  </div>`;

      const htmlClean = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>KHKT - Hệ Thống Tra Nhớt Sên Tự Động ESP8266</title>
  <link rel="stylesheet" href="./style.css">
</head>
<body>${bodyControls}
  <script src="./app.js"><\/script>
</body>
</html>`;

      downloadFile('index.html', htmlClean, 'text/html');
      setTimeout(() => downloadFile('style.css', cssContent, 'text/css'), 350);
      setTimeout(() => downloadFile('app.js', jsContent, 'application/javascript'), 700);
    };