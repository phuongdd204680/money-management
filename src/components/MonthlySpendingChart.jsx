/* eslint-disable react/prop-types */
import { useState, useMemo, useRef } from 'react';
import { 
  BarChart3, 
  LineChart as LineChartIcon, 
  Flame, 
  Calendar, 
  Sparkles, 
  ArrowRight
} from 'lucide-react';
import Icon from './Icon';
import { formatCurrency } from '../services/storage';

// Helper tạo đường cong mượt Cubic Bezier cho Line Chart
function generateSmoothPath(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
}

// Rút gọn số tiền cho trục Y (vd: 1.5tr, 500k, 0)
function formatShortCurrency(val) {
  if (!val || val === 0) return '0đ';
  if (val >= 1000000) {
    const tr = val / 1000000;
    return `${tr % 1 === 0 ? tr : tr.toFixed(1)}tr`;
  }
  if (val >= 1000) {
    const k = Math.round(val / 1000);
    return `${k}k`;
  }
  return `${val}đ`;
}

export default function MonthlySpendingChart({
  transactions = [],
  selectedMonth = '',
  categories = [],
  jars = [],
  isCompact = false,
  onNavigateAnalytics
}) {
  // Loại biểu đồ: 'bar' (Cột) hoặc 'line' (Đường)
  const [chartType, setChartType] = useState('bar');
  
  // Chế độ xem dữ liệu: 'all' (Tất cả chi), 'fixed_variable' (Cố định & Biến đổi), 'income_expense' (Thu & Chi)
  const [viewMode, setViewMode] = useState('all');

  // Bật/tắt đường mức chi trung bình
  const [showAvgLine, setShowAvgLine] = useState(true);

  // Trạng thái hover trên ngày nào (0-indexed day index)
  const [hoveredDayIndex, setHoveredDayIndex] = useState(null);
  const containerRef = useRef(null);

  // Danh mục map
  const catMap = useMemo(() => {
    const map = {};
    categories.forEach(c => { map[c.id] = c; });
    return map;
  }, [categories]);

  // Hũ map
  const jarMap = useMemo(() => {
    const map = {};
    jars.forEach(j => { map[j.id] = j; });
    return map;
  }, [jars]);

  // Tính số ngày trong tháng đang chọn
  const { year, month, daysInMonth, monthLabel } = useMemo(() => {
    let y, m;
    if (selectedMonth && selectedMonth.includes('-')) {
      const parts = selectedMonth.split('-');
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
    } else {
      const now = new Date();
      y = now.getFullYear();
      m = now.getMonth() + 1;
    }
    const totalDays = new Date(y, m, 0).getDate();
    return {
      year: y,
      month: m,
      daysInMonth: totalDays,
      monthLabel: `Tháng ${String(m).padStart(2, '0')}/${y}`
    };
  }, [selectedMonth]);

  // Tổng hợp dữ liệu chi tiêu & thu nhập theo từng ngày
  const {
    dailyData,
    totalMonthlyExpense,
    totalMonthlyIncome,
    totalFixedExpense,
    totalVariableExpense,
    maxDailyExpense,
    maxDailyIncome,
    peakExpenseDay,
    avgDailyExpense,
    activeDaysCount
  } = useMemo(() => {
    // Khởi tạo mảng cho toàn bộ các ngày từ 1 đến daysInMonth
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      return {
        day: dayNum,
        dateStr,
        expense: 0,
        income: 0,
        fixedExpense: 0,
        variableExpense: 0,
        txCount: 0,
        transactions: []
      };
    });

    let totalExp = 0;
    let totalInc = 0;
    let fixedExp = 0;
    let varExp = 0;

    transactions.forEach(tx => {
      // Bỏ qua chuyển hũ nội bộ
      const isTransfer = tx.categoryId === 'cat-transfer' || 
                         tx.type === 'transfer' || 
                         (tx.id && (tx.id.startsWith('tx-tf-out-') || tx.id.startsWith('tx-tf-in-')));
      if (isTransfer) return;

      if (!tx.date) return;
      const txDay = parseInt(tx.date.split('-')[2], 10);
      if (isNaN(txDay) || txDay < 1 || txDay > daysInMonth) return;

      const amt = Number(tx.amount) || 0;
      const targetDay = days[txDay - 1];

      if (tx.type === 'expense') {
        targetDay.expense += amt;
        totalExp += amt;
        targetDay.txCount += 1;
        targetDay.transactions.push(tx);

        if (tx.isFixed) {
          targetDay.fixedExpense += amt;
          fixedExp += amt;
        } else {
          targetDay.variableExpense += amt;
          varExp += amt;
        }
      } else if (tx.type === 'income') {
        targetDay.income += amt;
        totalInc += amt;
      }
    });

    let maxExp = 0;
    let maxInc = 0;
    let peakDay = null;
    let activeDays = 0;

    days.forEach(d => {
      if (d.expense > maxExp) {
        maxExp = d.expense;
        peakDay = d;
      }
      if (d.income > maxInc) {
        maxInc = d.income;
      }
      if (d.expense > 0) {
        activeDays++;
      }
    });

    // Trung bình ngày: chia cho số ngày trong tháng
    const avgDaily = daysInMonth > 0 ? Math.round(totalExp / daysInMonth) : 0;

    return {
      dailyData: days,
      totalMonthlyExpense: totalExp,
      totalMonthlyIncome: totalInc,
      totalFixedExpense: fixedExp,
      totalVariableExpense: varExp,
      maxDailyExpense: maxExp,
      maxDailyIncome: maxInc,
      peakExpenseDay: peakDay,
      avgDailyExpense: avgDaily,
      activeDaysCount: activeDays
    };
  }, [transactions, daysInMonth, year, month]);

  // Cấu hình kích thước SVG
  const svgWidth = 840;
  const svgHeight = isCompact ? 240 : 310;
  const paddingLeft = 58;
  const paddingRight = 24;
  const paddingTop = 26;
  const paddingBottom = 42;

  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  // Xác định trần Y-Axis cao nhất (làm tròn lên để biểu đồ đẹp)
  const maxY = useMemo(() => {
    let top = maxDailyExpense;
    if (viewMode === 'income_expense') {
      top = Math.max(maxDailyExpense, maxDailyIncome);
    }
    if (top <= 0) return 500000;
    // Thêm khoảng đệm 15% phía trên để đỉnh cột không chạm sát viền
    const padded = top * 1.18;
    // Làm tròn theo cấp số đẹp
    if (padded > 5000000) return Math.ceil(padded / 1000000) * 1000000;
    if (padded > 1000000) return Math.ceil(padded / 500000) * 500000;
    if (padded > 200000) return Math.ceil(padded / 100000) * 100000;
    return Math.ceil(padded / 50000) * 50000;
  }, [maxDailyExpense, maxDailyIncome, viewMode]);

  // Các mốc lưới trục Y (4 khoảng = 5 đường mốc)
  const yTicks = useMemo(() => {
    return [0, maxY * 0.25, maxY * 0.5, maxY * 0.75, maxY];
  }, [maxY]);

  // Toạ độ điểm cho biểu đồ đường
  const linePoints = useMemo(() => {
    const step = plotWidth / daysInMonth;
    return dailyData.map((d, i) => {
      const cx = paddingLeft + (i + 0.5) * step;
      const ratio = Math.min(d.expense / maxY, 1);
      const cy = paddingTop + plotHeight - (ratio * plotHeight);
      return { x: cx, y: cy, day: d };
    });
  }, [dailyData, plotWidth, plotHeight, paddingLeft, paddingTop, daysInMonth, maxY]);

  // Đường thu nhập nếu ở chế độ so sánh Thu - Chi
  const incomeLinePoints = useMemo(() => {
    if (viewMode !== 'income_expense') return [];
    const step = plotWidth / daysInMonth;
    return dailyData.map((d, i) => {
      const cx = paddingLeft + (i + 0.5) * step;
      const ratio = Math.min(d.income / maxY, 1);
      const cy = paddingTop + plotHeight - (ratio * plotHeight);
      return { x: cx, y: cy, day: d };
    });
  }, [dailyData, plotWidth, plotHeight, paddingLeft, paddingTop, daysInMonth, maxY, viewMode]);

  // SVG Paths cho Line & Area
  const expenseLinePath = useMemo(() => generateSmoothPath(linePoints), [linePoints]);
  const expenseAreaPath = useMemo(() => {
    if (linePoints.length < 2) return '';
    const first = linePoints[0];
    const last = linePoints[linePoints.length - 1];
    const baseline = paddingTop + plotHeight;
    return `${expenseLinePath} L ${last.x.toFixed(1)} ${baseline} L ${first.x.toFixed(1)} ${baseline} Z`;
  }, [expenseLinePath, linePoints, paddingTop, plotHeight]);

  const incomeLinePath = useMemo(() => {
    if (incomeLinePoints.length === 0) return '';
    return generateSmoothPath(incomeLinePoints);
  }, [incomeLinePoints]);

  // Đường trung bình ngày
  const avgY = useMemo(() => {
    if (!avgDailyExpense || avgDailyExpense <= 0) return null;
    const ratio = Math.min(avgDailyExpense / maxY, 1);
    return paddingTop + plotHeight - (ratio * plotHeight);
  }, [avgDailyExpense, maxY, paddingTop, plotHeight]);

  // Dữ liệu ngày đang được hover
  const activeDay = hoveredDayIndex !== null ? dailyData[hoveredDayIndex] : null;

  return (
    <div className={`monthly-spending-chart-card card ${isCompact ? 'compact-chart' : 'full-chart'}`} ref={containerRef}>
      {/* 1. Header & Controls */}
      <div className="chart-header-bar">
        <div className="chart-title-wrap">
          <div className="flex-center gap-2">
            <span className="chart-badge-icon">
              {chartType === 'bar' ? <BarChart3 size={18} className="text-danger" /> : <LineChartIcon size={18} className="text-primary-color" />}
            </span>
            <h3 className="section-title chart-main-heading">
              {isCompact ? 'Xu Hướng Chi Tiêu Tháng' : 'Biểu Đồ Chi Tiêu Theo Ngày Trong Tháng'}
            </h3>
            <span className="badge badge-neutral">{monthLabel}</span>
          </div>
          <p className="chart-subtitle text-muted">
            {isCompact 
              ? 'Theo dõi nhịp độ chi tiêu thực tế từng ngày'
              : 'Phân tích biến động chi tiêu, nhận diện các ngày chi vượt ngưỡng và kiểm soát dòng tiền'}
          </p>
        </div>

        {/* Nút chuyển đổi & Tuỳ chọn */}
        <div className="chart-controls-wrap">
          {/* Chế độ xem lọc dữ liệu (Chỉ hiển thị ở Full view) */}
          {!isCompact && (
            <div className="chart-view-toggles" role="group" aria-label="Chế độ phân tích">
              <button 
                className={`chart-pill-btn ${viewMode === 'all' ? 'active' : ''}`}
                onClick={() => setViewMode('all')}
                title="Tất cả các khoản chi"
              >
                Tất cả chi
              </button>
              <button 
                className={`chart-pill-btn ${viewMode === 'fixed_variable' ? 'active' : ''}`}
                onClick={() => setViewMode('fixed_variable')}
                title="Tách bạch Cố định vs Phát sinh"
              >
                Cố định vs Biến đổi
              </button>
              <button 
                className={`chart-pill-btn ${viewMode === 'income_expense' ? 'active' : ''}`}
                onClick={() => setViewMode('income_expense')}
                title="So sánh Thu vs Chi theo ngày"
              >
                Thu vs Chi
              </button>
            </div>
          )}

          {/* Nút Toggle Cột / Đường */}
          <div className="chart-type-switcher">
            <button
              id={`btn-chart-bar-${isCompact ? 'compact' : 'full'}`}
              className={`type-switch-btn ${chartType === 'bar' ? 'active' : ''}`}
              onClick={() => setChartType('bar')}
              title="Xem biểu đồ cột"
              aria-label="Biểu đồ cột"
            >
              <BarChart3 size={16} />
              <span>Cột</span>
            </button>
            <button
              id={`btn-chart-line-${isCompact ? 'compact' : 'full'}`}
              className={`type-switch-btn ${chartType === 'line' ? 'active' : ''}`}
              onClick={() => setChartType('line')}
              title="Xem biểu đồ đường"
              aria-label="Biểu đồ đường"
            >
              <LineChartIcon size={16} />
              <span>Đường</span>
            </button>
          </div>

          {/* Nút chuyển nhanh sang trang Analytics (ở compact mode) */}
          {isCompact && onNavigateAnalytics && (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={onNavigateAnalytics}
              title="Mở tab Báo cáo & Phân tích chuyên sâu"
            >
              <span>Chi tiết</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Key Stats Strip (Thanh tóm tắt nhanh) */}
      <div className="chart-stats-strip">
        <div className="stat-pill-item">
          <span className="stat-pill-label text-muted">Tổng chi tháng:</span>
          <span className="stat-pill-val font-bold text-danger">{formatCurrency(totalMonthlyExpense)}</span>
        </div>

        <div className="stat-pill-item">
          <span className="stat-pill-label text-muted">TB mỗi ngày:</span>
          <span className="stat-pill-val font-bold text-warning">{formatCurrency(avgDailyExpense)}/ngày</span>
        </div>

        {peakExpenseDay && peakExpenseDay.expense > 0 && (
          <div className="stat-pill-item peak-pill" title={`Ngày ${peakExpenseDay.day} chi nhiều nhất trong tháng`}>
            <Flame size={14} className="text-danger animate-pulse" />
            <span className="stat-pill-label text-muted">Đỉnh chi tiêu:</span>
            <span className="stat-pill-val font-bold text-danger-light">
              Ngày {peakExpenseDay.day} ({formatCurrency(peakExpenseDay.expense)})
            </span>
          </div>
        )}

        <div className="stat-pill-item">
          <span className="stat-pill-label text-muted">Ngày có chi tiêu:</span>
          <span className="stat-pill-val font-semibold text-secondary">
            {activeDaysCount}/{daysInMonth} ngày
          </span>
        </div>

        {viewMode === 'fixed_variable' && (
          <>
            <div className="stat-pill-item">
              <span className="stat-pill-label text-muted">Cố định:</span>
              <span className="stat-pill-val font-bold text-primary-light">{formatCurrency(totalFixedExpense)}</span>
            </div>
            <div className="stat-pill-item">
              <span className="stat-pill-label text-muted">Phát sinh:</span>
              <span className="stat-pill-val font-bold text-danger-light">{formatCurrency(totalVariableExpense)}</span>
            </div>
          </>
        )}

        {viewMode === 'income_expense' && (
          <div className="stat-pill-item">
            <span className="stat-pill-label text-muted">Tổng thu:</span>
            <span className="stat-pill-val font-bold text-success">+{formatCurrency(totalMonthlyIncome)}</span>
          </div>
        )}

        {!isCompact && (
          <label className="toggle-avg-line-label text-xs text-muted" title="Bật/tắt đường mức chi trung bình ngày">
            <input 
              type="checkbox" 
              checked={showAvgLine} 
              onChange={e => setShowAvgLine(e.target.checked)} 
            />
            <span>Đường TB ({formatShortCurrency(avgDailyExpense)})</span>
          </label>
        )}
      </div>

      {/* 3. Khung Vẽ SVG Biểu Đồ */}
      <div className="chart-canvas-wrapper">
        {totalMonthlyExpense === 0 && totalMonthlyIncome === 0 ? (
          <div className="chart-empty-state">
            <Sparkles size={32} className="text-muted mb-2" />
            <p className="text-muted font-medium">Chưa có dữ liệu giao dịch trong {monthLabel}</p>
            <span className="text-xs text-muted">Thêm giao dịch thu/chi để xem biểu đồ biến động từng ngày</span>
          </div>
        ) : (
          <div className="chart-interactive-svg-container">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="spending-svg-chart"
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="Biểu đồ thống kê chi tiêu trong tháng"
            >
              <defs>
                {/* Gradient cột chi tiêu mặc định */}
                <linearGradient id="barExpenseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#be123c" stopOpacity="0.65" />
                </linearGradient>

                {/* Gradient cột chi tiêu đỉnh (Peak Day) */}
                <linearGradient id="barPeakGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fb7185" stopOpacity="1" />
                  <stop offset="100%" stopColor="#e11d48" stopOpacity="0.85" />
                </linearGradient>

                {/* Gradient chi phí cố định */}
                <linearGradient id="barFixedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#4338ca" stopOpacity="0.7" />
                </linearGradient>

                {/* Gradient thu nhập */}
                <linearGradient id="barIncomeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#047857" stopOpacity="0.7" />
                </linearGradient>

                {/* Gradient nền vùng Line Chart */}
                <linearGradient id="areaExpenseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
                  <stop offset="80%" stopColor="#f43f5e" stopOpacity="0.04" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                </linearGradient>

                {/* Gradient nét vẽ Line Chart */}
                <linearGradient id="lineExpenseStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#fb7185" />
                  <stop offset="50%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#fda4af" />
                </linearGradient>

                {/* Drop shadow cho điểm hover */}
                <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f43f5e" floodOpacity="0.6" />
                </filter>
              </defs>

              {/* Lưới trục Y (Grid Lines & Labels) */}
              <g className="chart-grid-y">
                {yTicks.map((val, idx) => {
                  const yPos = paddingTop + plotHeight - (val / maxY) * plotHeight;
                  return (
                    <g key={idx} className="grid-line-group">
                      <line
                        x1={paddingLeft}
                        y1={yPos}
                        x2={svgWidth - paddingRight}
                        y2={yPos}
                        stroke="var(--border-color)"
                        strokeDasharray={val === 0 ? 'none' : '3,4'}
                        strokeWidth={val === 0 ? '1.2' : '0.8'}
                        opacity={val === 0 ? 0.8 : 0.45}
                      />
                      <text
                        x={paddingLeft - 8}
                        y={yPos + 4}
                        textAnchor="end"
                        className="y-axis-label"
                        fill="var(--text-muted)"
                        fontSize="11"
                        fontFamily="var(--font-main)"
                      >
                        {formatShortCurrency(val)}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* Đường chuẩn mức chi trung bình ngày */}
              {showAvgLine && avgY !== null && (
                <g className="avg-reference-line">
                  <line
                    x1={paddingLeft}
                    y1={avgY}
                    x2={svgWidth - paddingRight}
                    y2={avgY}
                    stroke="var(--warning)"
                    strokeDasharray="5,4"
                    strokeWidth="1.5"
                    opacity="0.85"
                  />
                  <rect
                    x={svgWidth - paddingRight - 84}
                    y={avgY - 18}
                    width="84"
                    height="16"
                    rx="3"
                    fill="var(--bg-card)"
                    stroke="var(--warning)"
                    strokeWidth="0.8"
                    opacity="0.95"
                  />
                  <text
                    x={svgWidth - paddingRight - 42}
                    y={avgY - 6}
                    textAnchor="middle"
                    fill="var(--warning)"
                    fontSize="9.5"
                    fontWeight="bold"
                    fontFamily="var(--font-main)"
                  >
                    TB: {formatShortCurrency(avgDailyExpense)}
                  </text>
                </g>
              )}

              {/* ======================= DẠNG 1: BIỂU ĐỒ CỘT (BAR CHART) ======================= */}
              {chartType === 'bar' && (
                <g className="chart-bars-layer">
                  {dailyData.map((d, i) => {
                    const step = plotWidth / daysInMonth;
                    const barSlotX = paddingLeft + i * step;
                    const slotWidth = step;
                    const barWidth = Math.max(slotWidth * 0.68, 5);
                    const barX = barSlotX + (slotWidth - barWidth) / 2;

                    const isHovered = hoveredDayIndex === i;
                    const isPeak = peakExpenseDay && peakExpenseDay.day === d.day && d.expense > 0;

                    if (viewMode === 'income_expense') {
                      // Chế độ 2 cột song song: Chi (đỏ) & Thu (xanh lá)
                      const halfBarWidth = Math.max(barWidth * 0.48, 3);
                      const expHeight = Math.max((d.expense / maxY) * plotHeight, d.expense > 0 ? 3 : 0);
                      const expY = paddingTop + plotHeight - expHeight;

                      const incHeight = Math.max((d.income / maxY) * plotHeight, d.income > 0 ? 3 : 0);
                      const incY = paddingTop + plotHeight - incHeight;

                      return (
                        <g 
                          key={d.day} 
                          className={`bar-group ${isHovered ? 'hovered' : ''}`}
                          onMouseEnter={() => setHoveredDayIndex(i)}
                          onMouseLeave={() => setHoveredDayIndex(null)}
                          tabIndex={0}
                          role="button"
                          aria-label={`Ngày ${d.day}: Chi ${formatCurrency(d.expense)}, Thu ${formatCurrency(d.income)}`}
                        >
                          {/* Hover Guide Background */}
                          <rect
                            x={barSlotX}
                            y={paddingTop}
                            width={slotWidth}
                            height={plotHeight}
                            fill={isHovered ? 'var(--primary-glow)' : 'transparent'}
                            opacity={isHovered ? 0.35 : 0}
                            className="bar-hover-guide"
                          />

                          {/* Cột Chi Tiêu */}
                          {d.expense > 0 && (
                            <rect
                              x={barX}
                              y={expY}
                              width={halfBarWidth}
                              height={expHeight}
                              rx={Math.min(halfBarWidth / 2, 3)}
                              fill="url(#barExpenseGradient)"
                              className="bar-rect"
                              filter={isHovered ? 'url(#glowFilter)' : 'none'}
                            />
                          )}

                          {/* Cột Thu Nhập */}
                          {d.income > 0 && (
                            <rect
                              x={barX + halfBarWidth + 1}
                              y={incY}
                              width={halfBarWidth}
                              height={incHeight}
                              rx={Math.min(halfBarWidth / 2, 3)}
                              fill="url(#barIncomeGradient)"
                              className="bar-rect"
                            />
                          )}
                        </g>
                      );
                    }

                    if (viewMode === 'fixed_variable') {
                      // Chế độ Stacked Bar: Cố định (tím xanh) + Biến đổi (đỏ)
                      const totalHeight = Math.max((d.expense / maxY) * plotHeight, d.expense > 0 ? 3 : 0);
                      const fixedRatio = d.expense > 0 ? d.fixedExpense / d.expense : 0;
                      const fixedHeight = totalHeight * fixedRatio;
                      const variableHeight = totalHeight - fixedHeight;

                      const baseY = paddingTop + plotHeight;
                      const fixedY = baseY - fixedHeight;
                      const varY = fixedY - variableHeight;

                      return (
                        <g 
                          key={d.day} 
                          className={`bar-group ${isHovered ? 'hovered' : ''}`}
                          onMouseEnter={() => setHoveredDayIndex(i)}
                          onMouseLeave={() => setHoveredDayIndex(null)}
                          tabIndex={0}
                        >
                          {/* Hover Guide */}
                          <rect
                            x={barSlotX}
                            y={paddingTop}
                            width={slotWidth}
                            height={plotHeight}
                            fill={isHovered ? 'var(--primary-glow)' : 'transparent'}
                            opacity={isHovered ? 0.35 : 0}
                            className="bar-hover-guide"
                          />

                          {/* Phần Cố định */}
                          {fixedHeight > 0 && (
                            <rect
                              x={barX}
                              y={fixedY}
                              width={barWidth}
                              height={fixedHeight}
                              rx={variableHeight > 0 ? 0 : 3}
                              fill="url(#barFixedGradient)"
                              className="bar-rect"
                            />
                          )}

                          {/* Phần Biến đổi */}
                          {variableHeight > 0 && (
                            <rect
                              x={barX}
                              y={varY}
                              width={barWidth}
                              height={variableHeight}
                              rx="3"
                              fill="url(#barExpenseGradient)"
                              className="bar-rect"
                            />
                          )}
                        </g>
                      );
                    }

                    // Chế độ mặc định 'all': Cột chi tiêu đơn nhất
                    const barHeight = Math.max((d.expense / maxY) * plotHeight, d.expense > 0 ? 3 : 0);
                    const barY = paddingTop + plotHeight - barHeight;

                    return (
                      <g 
                        key={d.day} 
                        className={`bar-group ${isHovered ? 'hovered' : ''} ${isPeak ? 'peak-bar' : ''}`}
                        onMouseEnter={() => setHoveredDayIndex(i)}
                        onMouseLeave={() => setHoveredDayIndex(null)}
                        tabIndex={0}
                        role="button"
                        aria-label={`Ngày ${d.day}: ${formatCurrency(d.expense)}`}
                      >
                        {/* Hover Guide */}
                        <rect
                          x={barSlotX}
                          y={paddingTop}
                          width={slotWidth}
                          height={plotHeight}
                          fill={isHovered ? 'var(--primary-glow)' : 'transparent'}
                          opacity={isHovered ? 0.35 : 0}
                          className="bar-hover-guide"
                        />

                        {d.expense > 0 ? (
                          <rect
                            x={barX}
                            y={barY}
                            width={barWidth}
                            height={barHeight}
                            rx={Math.min(barWidth / 2, 4)}
                            fill={isPeak ? 'url(#barPeakGradient)' : 'url(#barExpenseGradient)'}
                            className={`bar-rect ${isHovered ? 'bar-hovered' : ''}`}
                            filter={isHovered || isPeak ? 'url(#glowFilter)' : 'none'}
                          />
                        ) : (
                          // Chấm mờ nhỏ cho ngày không có chi tiêu
                          <circle
                            cx={barX + barWidth / 2}
                            cy={paddingTop + plotHeight - 2}
                            r={1.2}
                            fill="var(--text-muted)"
                            opacity={0.3}
                          />
                        )}

                        {/* Điểm nhấn Đỉnh chi tiêu */}
                        {isPeak && (
                          <circle
                            cx={barX + barWidth / 2}
                            cy={barY - 5}
                            r={2.5}
                            fill="#fb7185"
                            className="peak-dot animate-pulse"
                          />
                        )}
                      </g>
                    );
                  })}
                </g>
              )}

              {/* ======================= DẠNG 2: BIỂU ĐỒ ĐƯỜNG (LINE & AREA CHART) ======================= */}
              {chartType === 'line' && (
                <g className="chart-line-layer">
                  {/* Vùng bóng Area Gradient */}
                  {expenseAreaPath && (
                    <path
                      d={expenseAreaPath}
                      fill="url(#areaExpenseGradient)"
                      className="area-path"
                    />
                  )}

                  {/* Đường phụ: Thu nhập (nếu ở chế độ so sánh) */}
                  {viewMode === 'income_expense' && incomeLinePath && (
                    <path
                      d={incomeLinePath}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.2"
                      strokeDasharray="4,3"
                      className="income-line-path"
                    />
                  )}

                  {/* Đường nét chính: Chi tiêu */}
                  {expenseLinePath && (
                    <path
                      d={expenseLinePath}
                      fill="none"
                      stroke="url(#lineExpenseStroke)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="expense-line-path"
                    />
                  )}

                  {/* Các điểm tròn dữ liệu trên đường (Data Dots) */}
                  {linePoints.map((pt, i) => {
                    const isHovered = hoveredDayIndex === i;
                    const hasExpense = pt.day.expense > 0;
                    const isPeak = peakExpenseDay && peakExpenseDay.day === pt.day.day && hasExpense;

                    if (!hasExpense && !isHovered) return null;

                    return (
                      <g key={pt.day.day} className="line-point-group">
                        {/* Vòng hào quang khi hover */}
                        {isHovered && (
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={10}
                            fill="#f43f5e"
                            opacity={0.25}
                            className="hover-halo"
                          />
                        )}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 6 : (isPeak ? 4.5 : 3)}
                          fill={isPeak ? '#fb7185' : '#f43f5e'}
                          stroke="var(--bg-card)"
                          strokeWidth="2"
                          className="data-dot"
                          filter={isHovered || isPeak ? 'url(#glowFilter)' : 'none'}
                        />
                      </g>
                    );
                  })}

                  {/* Đường chỉ vị trí khi rê chuột (Vertical Crosshair) */}
                  {hoveredDayIndex !== null && linePoints[hoveredDayIndex] && (
                    <line
                      x1={linePoints[hoveredDayIndex].x}
                      y1={paddingTop}
                      x2={linePoints[hoveredDayIndex].x}
                      y2={paddingTop + plotHeight}
                      stroke="var(--primary-color, #6366f1)"
                      strokeDasharray="2,3"
                      strokeWidth="1.2"
                      opacity="0.8"
                      className="crosshair-line"
                    />
                  )}

                  {/* Lớp bắt sự kiện rê chuột phủ toàn bộ các cột */}
                  {dailyData.map((d, i) => {
                    const step = plotWidth / daysInMonth;
                    const slotX = paddingLeft + i * step;
                    return (
                      <rect
                        key={`line-hit-${d.day}`}
                        x={slotX}
                        y={paddingTop}
                        width={step}
                        height={plotHeight}
                        fill="transparent"
                        onMouseEnter={() => setHoveredDayIndex(i)}
                        onMouseLeave={() => setHoveredDayIndex(null)}
                        className="line-hit-area"
                      />
                    );
                  })}
                </g>
              )}

              {/* Trục X: Nhãn các ngày trong tháng */}
              <g className="chart-axis-x">
                {dailyData.map((d, i) => {
                  const step = plotWidth / daysInMonth;
                  const xPos = paddingLeft + (i + 0.5) * step;

                  // Hiển thị nhãn có chọn lọc để tránh rối mắt:
                  // Ngày 1, ngày 5, 10, 15, 20, 25 và ngày cuối tháng
                  const isKeyDay = d.day === 1 || 
                                   d.day === 5 || 
                                   d.day === 10 || 
                                   d.day === 15 || 
                                   d.day === 20 || 
                                   d.day === 25 || 
                                   d.day === daysInMonth;

                  const isHovered = hoveredDayIndex === i;

                  if (!isKeyDay && !isHovered) return null;

                  return (
                    <text
                      key={d.day}
                      x={xPos}
                      y={svgHeight - 12}
                      textAnchor="middle"
                      className={`x-axis-day-label ${isHovered ? 'hovered-day-label' : ''}`}
                      fill={isHovered ? 'var(--primary-light, #818cf8)' : 'var(--text-muted)'}
                      fontWeight={isHovered ? 'bold' : 'normal'}
                      fontSize={isHovered ? '11.5' : '10.5'}
                      fontFamily="var(--font-main)"
                    >
                      {d.day}
                    </text>
                  );
                })}
              </g>
            </svg>

            {/* 4. Interactive Glassmorphic Floating Tooltip */}
            {activeDay && (
              <div 
                className="chart-floating-tooltip"
                style={{
                  left: `${Math.min(Math.max(((paddingLeft + (hoveredDayIndex + 0.5) * (plotWidth / daysInMonth)) / svgWidth) * 100, 16), 84)}%`
                }}
              >
                <div className="tooltip-header flex-between">
                  <div className="flex-center gap-1.5">
                    <Calendar size={13} className="text-primary-color" />
                    <span className="tooltip-date font-bold">
                      Ngày {activeDay.day}/{month}/{year}
                    </span>
                  </div>
                  {activeDay.expense > 0 && activeDay.day === peakExpenseDay?.day && (
                    <span className="tooltip-tag-peak">Đỉnh tháng</span>
                  )}
                </div>

                <div className="tooltip-body">
                  <div className="tooltip-amount-row flex-between">
                    <span className="text-muted text-xs">Tổng chi tiêu:</span>
                    <span className="font-bold text-danger">{formatCurrency(activeDay.expense)}</span>
                  </div>

                  {viewMode === 'income_expense' && activeDay.income > 0 && (
                    <div className="tooltip-amount-row flex-between">
                      <span className="text-muted text-xs">Thu nhập:</span>
                      <span className="font-bold text-success">+{formatCurrency(activeDay.income)}</span>
                    </div>
                  )}

                  {viewMode === 'fixed_variable' && activeDay.expense > 0 && (
                    <div className="tooltip-split-row text-xs text-muted flex-between mt-1">
                      <span>Cố định: {formatCurrency(activeDay.fixedExpense)}</span>
                      <span>Phát sinh: {formatCurrency(activeDay.variableExpense)}</span>
                    </div>
                  )}

                  {/* So sánh với mức chi trung bình */}
                  {avgDailyExpense > 0 && activeDay.expense > 0 && (
                    <div className="tooltip-comparison-bar mt-1">
                      {activeDay.expense >= avgDailyExpense ? (
                        <span className="text-danger text-xs font-semibold">
                          ↑ Cao hơn TB +{Math.round(((activeDay.expense - avgDailyExpense) / avgDailyExpense) * 100)}%
                        </span>
                      ) : (
                        <span className="text-success text-xs font-semibold">
                          ↓ Thấp hơn TB -{Math.round(((avgDailyExpense - activeDay.expense) / avgDailyExpense) * 100)}%
                        </span>
                      )}
                    </div>
                  )}

                  {/* Danh sách nhanh các khoản chi trong ngày */}
                  {activeDay.transactions.length > 0 ? (
                    <div className="tooltip-tx-list mt-2">
                      <div className="tooltip-tx-title text-muted text-xs">
                        {activeDay.transactions.length} khoản chi:
                      </div>
                      <div className="tooltip-tx-items">
                        {activeDay.transactions.slice(0, 3).map(tx => {
                          const cat = catMap[tx.categoryId] || { name: 'Khác', icon: 'Tag', color: '#6366f1' };
                          const jar = jarMap[tx.jarId];
                          return (
                            <div key={tx.id} className="tooltip-tx-item flex-between">
                              <div className="tooltip-tx-left flex-center gap-1.5">
                                <Icon name={cat.icon || 'Tag'} size={12} color={cat.color} />
                                <span className="text-xs truncate max-w-120">{tx.note || cat.name}</span>
                                {jar && (
                                  <span className="text-muted text-xs">({jar.code})</span>
                                )}
                              </div>
                              <span className="text-xs font-semibold">{formatCurrency(tx.amount)}</span>
                            </div>
                          );
                        })}
                        {activeDay.transactions.length > 3 && (
                          <div className="text-muted text-xs text-right mt-0.5">
                            +{activeDay.transactions.length - 3} khoản chi khác...
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="tooltip-no-tx text-muted text-xs mt-1">
                      Không có phát sinh chi tiêu trong ngày này
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Chú Thích Màu Sắc Dưới Chân Biểu Đồ */}
      <div className="chart-legend-strip flex-between text-xs text-muted">
        <div className="flex-center gap-3">
          <div className="flex-center gap-1.5">
            <span className="legend-indicator-dot" style={{ backgroundColor: '#f43f5e' }}></span>
            <span>Chi tiêu</span>
          </div>

          {viewMode === 'fixed_variable' && (
            <div className="flex-center gap-1.5">
              <span className="legend-indicator-dot" style={{ backgroundColor: '#6366f1' }}></span>
              <span>Chi phí cố định</span>
            </div>
          )}

          {viewMode === 'income_expense' && (
            <div className="flex-center gap-1.5">
              <span className="legend-indicator-dot" style={{ backgroundColor: '#10b981' }}></span>
              <span>Thu nhập</span>
            </div>
          )}

          {showAvgLine && avgDailyExpense > 0 && (
            <div className="flex-center gap-1.5">
              <span className="legend-indicator-line" style={{ borderColor: 'var(--warning)' }}></span>
              <span>Mức trung bình ngày</span>
            </div>
          )}
        </div>

        <div className="chart-hint-note">
          <span>💡 Rê chuột lên cột/điểm để xem chi tiết từng ngày</span>
        </div>
      </div>
    </div>
  );
}
