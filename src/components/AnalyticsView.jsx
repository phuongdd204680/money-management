import React, { useState } from 'react';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  ShieldCheck, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import Icon from './Icon';
import { formatCurrency } from '../services/storage';

export default function AnalyticsView({
  stats,
  data
}) {
  const {
    totalIncome,
    totalExpense,
    totalFixedExpense,
    totalVariableExpense,
    netSavings,
    savingsRate,
    jarStats,
    filteredTransactions
  } = stats;

  const [activeJarHover, setActiveJarHover] = useState(null);

  const jarsList = Object.values(jarStats);

  // Tính tỷ lệ chi của từng hũ
  const jarSpendingData = jarsList.map(j => ({
    ...j,
    percentOfExpense: totalExpense > 0 ? Math.round((j.totalSpent / totalExpense) * 100) : 0
  })).sort((a, b) => b.totalSpent - a.totalSpent);

  // Top 5 Danh mục chi nhiều nhất
  const catMap = {};
  data.categories.forEach(c => { catMap[c.id] = c; });

  const categorySpending = {};
  filteredTransactions.forEach(tx => {
    if (tx.type === 'expense') {
      const catId = tx.categoryId || 'cat-other-exp';
      categorySpending[catId] = (categorySpending[catId] || 0) + (Number(tx.amount) || 0);
    }
  });

  const topCategories = Object.keys(categorySpending).map(catId => {
    const cat = catMap[catId] || { name: 'Khác', icon: 'Tag', color: '#6366f1' };
    const amount = categorySpending[catId];
    return {
      ...cat,
      amount,
      percent: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0
    };
  }).sort((a, b) => b.amount - a.amount).slice(0, 6);

  // SVG Donut Chart Calculation
  let cumulativeAngle = 0;
  const donutSlices = jarSpendingData.filter(j => j.totalSpent > 0).map(j => {
    const sliceAngle = (j.totalSpent / totalExpense) * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += sliceAngle;

    const x1 = Math.cos((startAngle - 90) * (Math.PI / 180));
    const y1 = Math.sin((startAngle - 90) * (Math.PI / 180));
    const x2 = Math.cos(((startAngle + sliceAngle) - 90) * (Math.PI / 180));
    const y2 = Math.sin(((startAngle + sliceAngle) - 90) * (Math.PI / 180));
    const largeArc = sliceAngle > 180 ? 1 : 0;

    const pathData = `M 0 0 L ${x1 * 90} ${y1 * 90} A 90 90 0 ${largeArc} 1 ${x2 * 90} ${y2 * 90} Z`;

    return {
      ...j,
      pathData,
      sliceAngle
    };
  });

  return (
    <div className="analytics-view-container">
      {/* 1. Header Banner */}
      <div className="card analytics-summary-banner">
        <div className="banner-left">
          <div className="flex-center gap-2 mb-2">
            <Sparkles className="text-warning" size={20} />
            <h2 className="section-title">Báo Cáo Cơ Cấu Dòng Tiền & Kỷ Luật Tài Chính</h2>
          </div>
          <p className="text-muted">
            Phân tích tỷ trọng chi tiêu thực tế so với mục tiêu phương pháp 6 hũ và tỷ lệ chi phí cố định vs phát sinh.
          </p>
        </div>

        <div className="discipline-score-card">
          <div className="score-number font-bold text-success">{savingsRate}%</div>
          <div className="score-label text-muted">Tỷ lệ dòng tiền tích luỹ / Thu nhập</div>
        </div>
      </div>

      {/* 2. Hàng Biểu Đồ Trực Quan */}
      <div className="analytics-grid">
        {/* Biểu Đồ Donut 6 Hũ */}
        <div className="card">
          <div className="card-header-simple">
            <h3 className="card-subheading flex-center gap-2">
              <PieIcon size={18} className="text-primary-color" />
              Cơ Cấu Chi Tiêu Theo 6 Hũ
            </h3>
          </div>

          <div className="donut-chart-wrapper">
            {totalExpense === 0 ? (
              <div className="empty-state text-muted py-12 text-center">Chưa có chi tiêu nào trong kỳ</div>
            ) : (
              <div className="donut-chart-flex">
                <div className="svg-donut-container">
                  <svg viewBox="-100 -100 200 200" className="donut-svg">
                    {donutSlices.map((slice, idx) => (
                      <path
                        key={slice.id}
                        d={slice.pathData}
                        fill={slice.color}
                        stroke="var(--bg-card)"
                        strokeWidth="3"
                        className="donut-slice"
                        onMouseEnter={() => setActiveJarHover(slice)}
                        onMouseLeave={() => setActiveJarHover(null)}
                      />
                    ))}
                    {/* Inner hole */}
                    <circle cx="0" cy="0" r="55" fill="var(--bg-card)" />
                    <text x="0" y="-5" textAnchor="middle" className="donut-center-total" fill="var(--text-primary)">
                      {totalExpense > 1000000 ? `${(totalExpense / 1000000).toFixed(1)}Tr` : `${totalExpense / 1000}k`}
                    </text>
                    <text x="0" y="15" textAnchor="middle" className="donut-center-label" fill="var(--text-muted)">
                      Tổng Chi
                    </text>
                  </svg>
                </div>

                {/* Chú thích các hũ */}
                <div className="donut-legend-list">
                  {jarSpendingData.map(jar => (
                    <div 
                      key={jar.id} 
                      className={`donut-legend-item ${activeJarHover?.id === jar.id ? 'hovered' : ''}`}
                    >
                      <div className="legend-dot" style={{ backgroundColor: jar.color }}></div>
                      <div className="legend-info">
                        <div className="legend-name">
                          <span>{jar.name} ({jar.code})</span>
                          <span className="font-bold">{jar.percentOfExpense}%</span>
                        </div>
                        <div className="legend-val text-muted">{formatCurrency(jar.totalSpent)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top 6 Danh Mục Chi Nhiều Nhất */}
        <div className="card">
          <div className="card-header-simple">
            <h3 className="card-subheading flex-center gap-2">
              <BarChart3 size={18} className="text-warning" />
              Top Danh Mục Chi Tiêu Hàng Đầu
            </h3>
          </div>

          <div className="top-categories-list">
            {topCategories.length === 0 ? (
              <div className="empty-state text-muted py-12 text-center">Chưa có giao dịch chi tiêu</div>
            ) : (
              topCategories.map((cat, idx) => (
                <div key={cat.id} className="top-cat-item">
                  <div className="top-cat-header">
                    <div className="top-cat-left">
                      <span className="top-rank font-bold">{idx + 1}</span>
                      <div 
                        className="top-cat-icon"
                        style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                      >
                        <Icon name={cat.icon} size={16} color={cat.color} />
                      </div>
                      <span className="font-semibold text-sm">{cat.name}</span>
                    </div>

                    <div className="top-cat-right">
                      <span className="font-bold text-sm">{formatCurrency(cat.amount)}</span>
                      <span className="text-muted text-xs ml-2">({cat.percent}%)</span>
                    </div>
                  </div>

                  <div className="progress-bar-bg mt-1">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
