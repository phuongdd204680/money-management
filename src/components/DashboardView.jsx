import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  CalendarClock,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldAlert,
  Percent
} from 'lucide-react';
import Icon from './Icon';
import { formatCurrency, formatDate } from '../services/storage';

export default function DashboardView({
  stats,
  data,
  onOpenTxModal,
  setActiveTab,
  onPayBill
}) {
  const {
    totalIncome,
    totalExpense,
    totalFixedExpense,
    totalVariableExpense,
    netSavings,
    savingsRate,
    jarStats,
    billsWithStatus,
    pendingBillsCount
  } = stats;

  const jarsList = Object.values(jarStats);

  // Tỷ lệ chi cố định vs phát sinh
  const fixedPercent = totalExpense > 0 ? Math.round((totalFixedExpense / totalExpense) * 100) : 0;
  const variablePercent = totalExpense > 0 ? (100 - fixedPercent) : 0;

  // Lọc các cảnh báo vượt ngân sách
  const overBudgetJars = jarsList.filter(j => j.spentPercent > 90);

  // Các hóa đơn cố định chưa thanh toán
  const pendingBills = billsWithStatus.filter(b => !b.isPaid);

  // 5 giao dịch gần nhất
  const recentTransactions = [...stats.filteredTransactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const getCategory = (catId) => {
    return data.categories.find(c => c.id === catId) || { name: 'Giao dịch', icon: 'Tag', color: '#6366f1' };
  };

  return (
    <div className="dashboard-grid">
      {/* 1. Hàng Thống Kê Tổng Quan */}
      <section className="overview-stats-grid">
        {/* Thu Nhập */}
        <div className="stat-card stat-income card card-interactive">
          <div className="stat-card-header">
            <span className="stat-label">Tổng Thu Nhập</span>
            <div className="stat-icon-wrap income-icon">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="stat-value text-success">{formatCurrency(totalIncome)}</div>
          <div className="stat-footer text-muted">
            <span>Tự động phân bổ vào 6 hũ tài chính</span>
          </div>
        </div>

        {/* Tổng Chi Tiêu */}
        <div className="stat-card stat-expense card card-interactive">
          <div className="stat-card-header">
            <span className="stat-label">Tổng Chi Tiêu</span>
            <div className="stat-icon-wrap expense-icon">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="stat-value text-danger">{formatCurrency(totalExpense)}</div>
          <div className="stat-breakdown">
            <div className="breakdown-item">
              <span className="dot dot-fixed"></span>
              <span className="breakdown-text">Cố định: {formatCurrency(totalFixedExpense)} ({fixedPercent}%)</span>
            </div>
            <div className="breakdown-item">
              <span className="dot dot-variable"></span>
              <span className="breakdown-text">Phát sinh: {formatCurrency(totalVariableExpense)} ({variablePercent}%)</span>
            </div>
          </div>
        </div>

        {/* Dòng Tiền Tích Lũy / Tiết Kiệm */}
        <div className="stat-card stat-savings card card-interactive">
          <div className="stat-card-header">
            <span className="stat-label">Dòng Tiền Tích Lũy</span>
            <div className="stat-icon-wrap savings-icon">
              <Wallet size={20} />
            </div>
          </div>
          <div className={`stat-value ${netSavings >= 0 ? 'text-primary-color' : 'text-danger'}`}>
            {formatCurrency(netSavings)}
          </div>
          <div className="stat-footer">
            <span className={`badge ${netSavings >= 0 ? 'badge-income' : 'badge-expense'}`}>
              {netSavings >= 0 ? `Tích lũy ${savingsRate}% thu nhập` : 'Bội chi tháng này'}
            </span>
          </div>
        </div>

        {/* Khoản Chi Cố Định Cần Thanh Toán */}
        <div className="stat-card stat-bills card card-interactive" onClick={() => setActiveTab('recurring')}>
          <div className="stat-card-header">
            <span className="stat-label">Khoản Chi Cố Định</span>
            <div className="stat-icon-wrap bills-icon">
              <CalendarClock size={20} />
            </div>
          </div>
          <div className="stat-value">
            {pendingBillsCount > 0 ? (
              <span className="text-warning">{pendingBillsCount} khoản cần trả</span>
            ) : (
              <span className="text-success">Đã hoàn thành</span>
            )}
          </div>
          <div className="stat-footer text-muted">
            {pendingBillsCount > 0 ? (
              <span>Nhấn để xem và thanh toán định kỳ</span>
            ) : (
              <span className="text-success-light">Toàn bộ hóa đơn tháng đã nộp</span>
            )}
          </div>
        </div>
      </section>

      {/* 2. Cảnh Báo Thông Minh (Nếu Có Vượt Ngân Sách hoặc Hoá Đơn Chờ) */}
      {(overBudgetJars.length > 0 || pendingBills.length > 0) && (
        <section className="alerts-container">
          {overBudgetJars.map(jar => (
            <div key={jar.id} className="alert-card alert-warning-box">
              <AlertTriangle className="alert-icon text-warning" size={20} />
              <div className="alert-content">
                <strong>Cảnh báo ngân sách:</strong> Hũ <b>{jar.name} ({jar.code})</b> đã chi tiêu{' '}
                <span className="text-danger font-bold">{jar.spentPercent}%</span> so với hạn mức (Đã chi{' '}
                {formatCurrency(jar.totalSpent)} / Hạn mức {formatCurrency(jar.budget)}).
              </div>
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => onOpenTxModal({ prefillJarId: jar.id, defaultType: 'transfer' })}
              >
                Chuyển hũ bù tiền
              </button>
            </div>
          ))}

          {pendingBills.slice(0, 2).map(bill => (
            <div key={bill.id} className="alert-card alert-info-box">
              <CalendarClock className="alert-icon text-info" size={20} />
              <div className="alert-content">
                <strong>Khoản chi cố định chưa nộp:</strong> <b>{bill.name}</b> (Hạn ngày {bill.dueDay} hàng tháng) - Số tiền: <b>{formatCurrency(bill.amount)}</b>
              </div>
              <button 
                id={`btn-pay-quick-${bill.id}`}
                className="btn btn-sm btn-success"
                onClick={() => onPayBill(bill)}
              >
                Xác nhận đã trả
              </button>
            </div>
          ))}
        </section>
      )}

      {/* 3. Hệ Thống 6 Hũ Tài Chính (6 Jars Grid) */}
      <section className="jars-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Hệ Thống 6 Hũ Tài Chính</h2>
            <p className="section-desc">Phân bổ thu nhập và kiểm soát số dư của từng quỹ mục tiêu</p>
          </div>
          <button 
            id="btn-manage-jars"
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveTab('jars')}
          >
            <Layers size={15} />
            <span>Tùy chỉnh tỷ lệ & Ngân sách</span>
          </button>
        </div>

        <div className="jars-cards-grid">
          {jarsList.map(jar => {
            const isOver = jar.spentPercent >= 100;
            const isWarning = jar.spentPercent >= 80 && !isOver;

            return (
              <div 
                key={jar.id} 
                className="jar-card card card-interactive"
                style={{ borderTop: `4px solid ${jar.color}` }}
              >
                <div className="jar-card-top">
                  <div className="jar-badge-wrap">
                    <div className="jar-icon" style={{ backgroundColor: `${jar.color}20`, color: jar.color }}>
                      <Icon name={jar.icon} size={20} color={jar.color} />
                    </div>
                    <div>
                      <h3 className="jar-title">{jar.name}</h3>
                      <span className="jar-code-pill" style={{ color: jar.color, borderColor: `${jar.color}40` }}>
                        {jar.code} ({jar.percent}%)
                      </span>
                    </div>
                  </div>

                  <span className={`jar-balance-pill ${jar.balance >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(jar.balance)}
                  </span>
                </div>

                <p className="jar-description">{jar.description}</p>

                {/* Thanh tiến độ ngân sách */}
                <div className="jar-progress-wrap">
                  <div className="progress-labels">
                    <span className="text-muted">Đã chi: <b>{formatCurrency(jar.totalSpent)}</b></span>
                    <span className={`budget-percent ${isOver ? 'text-danger font-bold' : isWarning ? 'text-warning' : 'text-muted'}`}>
                      {jar.spentPercent}% ngân sách
                    </span>
                  </div>
                  <div className="progress-bar-bg">
                    <div 
                      className={`progress-bar-fill ${isOver ? 'fill-danger' : isWarning ? 'fill-warning' : ''}`}
                      style={{ 
                        width: `${Math.min(jar.spentPercent, 100)}%`,
                        backgroundColor: isOver ? 'var(--danger)' : isWarning ? 'var(--warning)' : jar.color
                      }}
                    ></div>
                  </div>
                  <div className="progress-footer text-muted">
                    <span>Nạp vào: {formatCurrency(jar.incomeAllocated)}</span>
                    <span>Hạn mức: {formatCurrency(jar.budget)}</span>
                  </div>
                </div>

                <div className="jar-card-actions">
                  <button 
                    id={`btn-spend-jar-${jar.id}`}
                    className="btn btn-secondary btn-sm"
                    onClick={() => onOpenTxModal({ prefillJarId: jar.id, defaultType: 'expense' })}
                  >
                    - Chi từ hũ này
                  </button>
                  <button 
                    className="btn btn-ghost btn-sm"
                    onClick={() => setActiveTab('transactions')}
                    title="Xem các giao dịch thuộc hũ này"
                  >
                    Xem GD
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. So Sánh Chi Cố Định vs Phát Sinh & Giao Dịch Gần Đây */}
      <section className="dashboard-bottom-grid">
        {/* Phân Tích Cố Định vs Phát Sinh */}
        <div className="card">
          <div className="card-header-simple">
            <h3 className="card-subheading">Cơ Cấu Chi Tiêu (Cố định vs Phát sinh)</h3>
          </div>
          <div className="fixed-variable-visual">
            <div className="ratio-bar">
              <div 
                className="ratio-segment segment-fixed" 
                style={{ width: `${fixedPercent}%` }}
                title={`Cố định: ${fixedPercent}%`}
              >
                {fixedPercent > 10 && `${fixedPercent}% Cố định`}
              </div>
              <div 
                className="ratio-segment segment-variable" 
                style={{ width: `${variablePercent}%` }}
                title={`Phát sinh: ${variablePercent}%`}
              >
                {variablePercent > 10 && `${variablePercent}% Phát sinh`}
              </div>
            </div>

            <div className="ratio-legend-grid">
              <div className="ratio-legend-card fixed-legend">
                <div className="legend-title-row">
                  <span className="dot dot-fixed"></span>
                  <span className="font-semibold">Chi Cố Định Định Kỳ</span>
                </div>
                <div className="legend-amount">{formatCurrency(totalFixedExpense)}</div>
                <p className="legend-sub text-muted">Tiền nhà, điện nước, internet, 4G, phí dịch vụ</p>
              </div>

              <div className="ratio-legend-card variable-legend">
                <div className="legend-title-row">
                  <span className="dot dot-variable"></span>
                  <span className="font-semibold">Chi Không Cố Định / Phát Sinh</span>
                </div>
                <div className="legend-amount">{formatCurrency(totalVariableExpense)}</div>
                <p className="legend-sub text-muted">Ăn uống, cafe, mua sắm, xăng xe, thuốc men</p>
              </div>
            </div>
          </div>
        </div>

        {/* Giao Dịch Mới Nhất */}
        <div className="card">
          <div className="card-header-simple flex-between">
            <h3 className="card-subheading">Giao Dịch Gần Nhất</h3>
            <button 
              className="btn btn-ghost btn-sm text-primary-color"
              onClick={() => setActiveTab('transactions')}
            >
              <span>Xem tất cả</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="recent-tx-list">
            {recentTransactions.length === 0 ? (
              <div className="empty-state text-muted py-6 text-center">
                Chưa có giao dịch nào trong tháng này.
              </div>
            ) : (
              recentTransactions.map(tx => {
                const cat = getCategory(tx.categoryId);
                const isInc = tx.type === 'income';

                return (
                  <div key={tx.id} className="recent-tx-item">
                    <div className="recent-tx-left">
                      <div 
                        className="recent-tx-icon"
                        style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                      >
                        <Icon name={cat.icon} size={18} color={cat.color} />
                      </div>
                      <div>
                        <div className="recent-tx-name">
                          {cat.name}
                          {tx.type === 'expense' && (
                            <span className={`badge ${tx.isFixed ? 'badge-fixed' : 'badge-variable'} ml-2`}>
                              {tx.isFixed ? 'Cố định' : 'Phát sinh'}
                            </span>
                          )}
                        </div>
                        <div className="recent-tx-meta text-muted">
                          {formatDate(tx.date)} • {tx.note || 'Không có ghi chú'}
                        </div>
                      </div>
                    </div>

                    <div className={`recent-tx-amount ${isInc ? 'text-success' : 'text-danger'}`}>
                      {isInc ? '+' : '-'}{formatCurrency(tx.amount)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
