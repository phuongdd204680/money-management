import React, { useState } from 'react';
import { 
  Layers, 
  Percent, 
  RotateCcw, 
  Check, 
  AlertTriangle, 
  ArrowRightLeft, 
  Info,
  DollarSign,
  Sparkles,
  Briefcase,
  Laptop,
  PlusCircle,
  TrendingUp
} from 'lucide-react';
import Icon from './Icon';
import { formatCurrency } from '../services/storage';

export default function JarsManagementView({
  jars = [],
  stats,
  settings = {},
  categories = [],
  monthlyIncomeTarget = 0,
  onUpdateJars,
  onUpdateIncomeSettings,
  onOpenTxModal,
  onQuickAllocateIncome
}) {
  const safeJars = Array.isArray(jars) ? jars : [];

  const [editingPercents, setEditingPercents] = useState(() => {
    const p = {};
    safeJars.forEach(j => { if (j && j.id) p[j.id] = j.percent ?? 0; });
    return p;
  });

  const [editingBudgets, setEditingBudgets] = useState(() => {
    const b = {};
    safeJars.forEach(j => { if (j && j.id) b[j.id] = j.defaultBudget ?? 0; });
    return b;
  });

  // State lương cố định & thu nhập ngoài lương dự kiến
  const [salaryInput, setSalaryInput] = useState(() => {
    if (settings?.salaryAmount !== undefined && settings?.salaryAmount !== null && settings?.salaryAmount > 0) {
      return String(settings.salaryAmount);
    }
    if (monthlyIncomeTarget > 0) return String(monthlyIncomeTarget);
    return '';
  });

  const [extraIncomeInput, setExtraIncomeInput] = useState(() => {
    if (settings?.extraIncomeTarget !== undefined && settings?.extraIncomeTarget !== null && settings?.extraIncomeTarget > 0) {
      return String(settings.extraIncomeTarget);
    }
    return '';
  });

  const [selectedExtraCatId, setSelectedExtraCatId] = useState('cat-freelance');
  const [isSaved, setIsSaved] = useState(false);
  const [incomeTargetSaved, setIncomeTargetSaved] = useState(false);

  // Cập nhật lại input nếu settings từ bên ngoài thay đổi
  React.useEffect(() => {
    if (settings?.salaryAmount !== undefined && settings?.salaryAmount !== null) {
      setSalaryInput(settings.salaryAmount > 0 ? String(settings.salaryAmount) : '');
    } else if (monthlyIncomeTarget > 0) {
      setSalaryInput(String(monthlyIncomeTarget));
    }
    if (settings?.extraIncomeTarget !== undefined && settings?.extraIncomeTarget !== null) {
      setExtraIncomeInput(settings.extraIncomeTarget > 0 ? String(settings.extraIncomeTarget) : '');
    }
  }, [settings, monthlyIncomeTarget]);

  // Danh sách các danh mục thu nhập ngoài lương
  const incomeCategories = categories.filter(c => c.type === 'income');
  const extraIncomeCategories = incomeCategories.filter(c => c.id !== 'cat-salary');

  const parsedSalary = Math.max(0, Number(salaryInput) || 0);
  const parsedExtraIncome = Math.max(0, Number(extraIncomeInput) || 0);
  const totalTargetIncome = parsedSalary + parsedExtraIncome;
  const activeIncomeBase = totalTargetIncome > 0 ? totalTargetIncome : parsedSalary;

  // Tổng hạn mức của các hũ hiện tại (dùng làm cơ sở khi chưa có thông tin thu nhập dự kiến)
  const totalBudgetsSum = safeJars.reduce((acc, j) => {
    const b = editingBudgets[j.id] !== undefined ? editingBudgets[j.id] : (j.defaultBudget || 0);
    return acc + (Number(b) || 0);
  }, 0);

  const baseIncome = activeIncomeBase > 0 
    ? activeIncomeBase 
    : (monthlyIncomeTarget > 0 ? monthlyIncomeTarget : totalBudgetsSum);

  // Tính tổng % hiện tại
  const totalPercent = Object.values(editingPercents).reduce((acc, val) => acc + (Number(val) || 0), 0);
  const isValidPercent = totalPercent === 100;

  const handlePercentChange = (id, val) => {
    setIsSaved(false);
    const num = val === '' ? '' : Math.max(0, Math.min(100, parseInt(val, 10) || 0));
    setEditingPercents(prev => ({ ...prev, [id]: num }));

    if (baseIncome > 0) {
      const numForCalc = Number(num) || 0;
      const calculatedBudget = Math.round((baseIncome * numForCalc) / 100);
      setEditingBudgets(prev => ({ ...prev, [id]: calculatedBudget }));
    }
  };

  const handleBudgetChange = (id, val) => {
    setIsSaved(false);
    const num = val === '' ? '' : Math.max(0, parseInt(val, 10) || 0);
    setEditingBudgets(prev => ({ ...prev, [id]: num }));

    const numForCalc = Number(num) || 0;
    const calcBase = activeIncomeBase > 0 
      ? activeIncomeBase 
      : (monthlyIncomeTarget > 0 
          ? monthlyIncomeTarget 
          : safeJars.reduce((acc, j) => {
              if (j.id === id) return acc + numForCalc;
              const b = editingBudgets[j.id] !== undefined ? editingBudgets[j.id] : (j.defaultBudget || 0);
              return acc + (Number(b) || 0);
            }, 0)
        );

    if (calcBase > 0) {
      const calculatedPct = Math.min(100, Math.max(0, Math.round((numForCalc / calcBase) * 100)));
      setEditingPercents(prev => ({ ...prev, [id]: calculatedPct }));
    }
  };

  // Tự động tính lại hạn mức ngân sách của 6 hũ dựa trên thu nhập dự kiến
  const handleApplyIncomeToBudgets = () => {
    if (activeIncomeBase <= 0) {
      alert('Vui lòng nhập mức lương hoặc thu nhập dự kiến lớn hơn 0 để tính ngân sách');
      return;
    }

    const newBudgets = {};
    jars.forEach(j => {
      const pct = editingPercents[j.id] ?? j.percent;
      newBudgets[j.id] = Math.round((activeIncomeBase * pct) / 100);
    });

    setEditingBudgets(newBudgets);

    // Cập nhật cả jars và settings
    const updatedJars = jars.map(j => ({
      ...j,
      defaultBudget: newBudgets[j.id]
    }));

    onUpdateJars(updatedJars);
    if (onUpdateIncomeSettings) {
      onUpdateIncomeSettings({
        salaryAmount: parsedSalary,
        extraIncomeTarget: parsedExtraIncome,
        monthlyIncomeTarget: totalTargetIncome
      });
    }

    setIncomeTargetSaved(true);
    setTimeout(() => setIncomeTargetSaved(false), 3000);
  };

  // Khôi phục mặc định 55-10-10-10-10-5
  const handleResetDefault = () => {
    const def = {
      nec: 55,
      ltss: 10,
      ffa: 10,
      edu: 10,
      play: 10,
      give: 5
    };
    setEditingPercents(def);
    if (baseIncome > 0) {
      const newBudgets = {};
      Object.entries(def).forEach(([jarId, pct]) => {
        newBudgets[jarId] = Math.round((baseIncome * pct) / 100);
      });
      setEditingBudgets(newBudgets);
    }
    setIsSaved(false);
  };

  const handleSave = () => {
    if (!isValidPercent) {
      alert(`Tổng tỷ lệ các hũ phải bằng đúng 100%. Hiện tại đang là ${totalPercent}%!`);
      return;
    }

    const updatedJars = jars.map(j => ({
      ...j,
      percent: Number(editingPercents[j.id] !== undefined ? editingPercents[j.id] : j.percent) || 0,
      defaultBudget: Number(editingBudgets[j.id] !== undefined ? editingBudgets[j.id] : j.defaultBudget) || 0
    }));

    onUpdateJars(updatedJars);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="jars-view-container">
      {/* 1. Header Banner & Methodology Info */}
      <div className="jars-intro-banner card">
        <div className="intro-content">
          <div className="intro-badge">
            <Layers size={16} />
            <span>Phương Pháp Quản Lý Tài Chính 6 Chiếc Hũ (6 Jars)</span>
          </div>
          <h2 className="intro-title">Phân Bổ Thu Nhập & Làm Chủ Dòng Tiền</h2>
          <p className="intro-desc text-muted">
            Theo chuyên gia T. Harv Eker, chia tiền thành 6 hũ giúp bạn đảm bảo cuộc sống thiết yếu, 
            đồng thời không bao giờ quên đầu tư cho tương lai, phát triển bản thân và tận hưởng cuộc sống một cách có kỷ luật.
          </p>
        </div>

        <div className="intro-actions">
          <button 
            id="btn-open-transfer"
            className="btn btn-secondary"
            onClick={() => onOpenTxModal({ defaultType: 'transfer' })}
          >
            <ArrowRightLeft size={16} />
            <span>Chuyển tiền giữa các hũ</span>
          </button>
        </div>
      </div>

      {/* 2. KHỐI KHAI BÁO THU NHẬP ĐA NGUỒN (LƯƠNG + NGOÀI LƯƠNG) */}
      <div className="card mb-4 income-setup-banner">
        <div className="income-setup-header flex-between flex-wrap gap-2 mb-3">
          <div className="flex-center gap-2">
            <Sparkles size={20} className="text-warning" />
            <h3 className="card-subheading">Khai Báo Thu Nhập Hàng Tháng (Lương & Nguồn Khác)</h3>
          </div>
          <span className="text-xs text-muted">
            Tự do cấu hình mức lương và thu nhập phụ để hệ thống tính hạn mức 6 hũ
          </span>
        </div>

        {/* Lưới 2 cột: Lương chính thức và Thu nhập ngoài lương */}
        <div className="income-sources-grid mb-3">
          {/* Cột 1: Lương cố định */}
          <div className="income-source-card">
            <div className="income-source-title">
              <div className="flex-center gap-2">
                <Briefcase size={16} className="text-success" />
                <span className="font-semibold text-sm">Lương Cố Định Hàng Tháng</span>
              </div>
              <span className="badge badge-salary">
                <span className="badge-dot"></span>
                Lương chính
              </span>
            </div>
            <p className="text-xs text-muted mb-2">Mức lương thực nhận định kỳ mỗi tháng</p>
            <div className="input-with-currency">
              <input
                id="input-monthly-salary"
                type="number"
                step="500000"
                min="0"
                className="form-control income-target-field"
                placeholder="VD: 25000000"
                value={salaryInput}
                onChange={e => {
                  setSalaryInput(e.target.value);
                  setIncomeTargetSaved(false);
                }}
              />
              <span className="currency-tag">VNĐ / tháng</span>
            </div>
            {parsedSalary > 0 && (
              <div className="mt-2 flex-between">
                <span className="text-xs text-muted">Đang đặt: <b>{formatCurrency(parsedSalary)}</b></span>
                <button
                  type="button"
                  className="btn-link text-xs text-success"
                  onClick={() => onQuickAllocateIncome && onQuickAllocateIncome(parsedSalary, 'cat-salary', 'Lương cố định')}
                  title="Nạp ngay khoản lương này vào tháng hiện tại"
                >
                  + Nạp Lương ngay
                </button>
              </div>
            )}
          </div>

          {/* Cột 2: Thu nhập ngoài lương */}
          <div className="income-source-card">
            <div className="income-source-title">
              <div className="flex-center gap-2">
                <Laptop size={16} className="text-warning" />
                <span className="font-semibold text-sm">Thu Nhập Ngoài Lương Dự Kiến</span>
              </div>
              <span className="badge badge-extra">
                <span className="badge-dot"></span>
                Ngoài lương
              </span>
            </div>
            <p className="text-xs text-muted mb-2">Thù lao freelance, kinh doanh nghề tay trái, đầu tư...</p>
            <div className="input-with-currency">
              <input
                id="input-extra-income-target"
                type="number"
                step="500000"
                min="0"
                className="form-control income-target-field"
                placeholder="VD: 5000000 (nếu có)"
                value={extraIncomeInput}
                onChange={e => {
                  setExtraIncomeInput(e.target.value);
                  setIncomeTargetSaved(false);
                }}
              />
              <span className="currency-tag">VNĐ / tháng</span>
            </div>
            <div className="mt-2 flex-between flex-wrap gap-2">
              <span className="text-xs text-muted">
                {parsedExtraIncome > 0 ? (
                  <>Dự kiến: <b>{formatCurrency(parsedExtraIncome)}</b></>
                ) : (
                  <span>Tùy chọn, để trống nếu không có</span>
                )}
              </span>
              {parsedExtraIncome > 0 && (
                <div className="flex-center gap-1">
                  {extraIncomeCategories.length > 0 && (
                    <select
                      className="form-control form-control-xs select-quick-cat"
                      value={selectedExtraCatId}
                      onChange={e => setSelectedExtraCatId(e.target.value)}
                    >
                      {extraIncomeCategories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    className="btn-link text-xs text-warning"
                    onClick={() => {
                      const selectedCat = extraIncomeCategories.find(c => c.id === selectedExtraCatId);
                      const catName = selectedCat ? selectedCat.name : 'Thu nhập ngoài';
                      onQuickAllocateIncome && onQuickAllocateIncome(parsedExtraIncome, selectedExtraCatId, catName);
                    }}
                    title="Nạp ngay khoản thu nhập ngoài này vào tháng"
                  >
                    + Nạp ngay
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Thanh Tổng Hợp Thu Nhập & Nút Hành Động */}
        <div className="income-summary-bar flex-between flex-wrap gap-3">
          <div className="income-total-stat">
            <span className="text-xs text-muted">Tổng Thu Nhập Dự Kiến:</span>
            <div className="total-target-highlight">
              {formatCurrency(totalTargetIncome)}
              <span className="text-xs text-muted font-normal"> / tháng</span>
            </div>
          </div>

          <div className="income-actions-wrap flex-center flex-wrap gap-2">
            <button
              id="btn-apply-income-budgets"
              className="btn btn-primary btn-sm"
              onClick={handleApplyIncomeToBudgets}
              disabled={activeIncomeBase <= 0}
            >
              <Check size={16} />
              <span>{incomeTargetSaved ? 'Đã lưu & áp dụng thành công!' : 'Tự động tính ngân sách 6 hũ'}</span>
            </button>

            <button
              id="btn-open-income-modal"
              className="btn btn-ghost btn-sm"
              onClick={() => onOpenTxModal({ defaultType: 'income' })}
            >
              <PlusCircle size={16} />
              <span>Ghi khoản thu nhập khác</span>
            </button>
          </div>
        </div>

        {/* Dải gợi ý phân bổ tiền theo 6 hũ */}
        {activeIncomeBase > 0 && (
          <div className="income-split-preview-strip mt-3">
            <span className="text-xs text-muted font-semibold">Gợi ý ngân sách theo thu nhập dự kiến:</span>
            <div className="preview-jars-row">
              {safeJars.map(j => {
                const pct = editingPercents[j.id] ?? j.percent;
                const amt = Math.round((activeIncomeBase * pct) / 100);
                return (
                  <div key={j.id} className="preview-jar-chip">
                    <span className="chip-dot" style={{ backgroundColor: j.color }}></span>
                    <span className="chip-label">{j.code} ({pct}%):</span>
                    <span className="chip-amt font-bold" style={{ color: j.color }}>{formatCurrency(amt)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Bảng Tùy Chỉnh Tỷ Lệ & Ngân Sách */}
      <div className="card jars-config-card">
        <div className="config-header">
          <div>
            <h3 className="card-subheading">Tùy Chỉnh Tỷ Lệ & Hạn Mức Ngân Sách Tháng</h3>
            <p className="text-muted text-sm">
              Mỗi khi bạn ghi nhận một khoản thu nhập, số tiền sẽ được tự động phân bổ vào 6 hũ theo tỷ lệ dưới đây.
            </p>
          </div>

          <div className="config-header-actions">
            <button 
              className="btn btn-secondary btn-sm"
              onClick={handleResetDefault}
              title="Khôi phục tỷ lệ chuẩn 55-10-10-10-10-5"
            >
              <RotateCcw size={14} />
              <span>Tỷ lệ chuẩn (55-10-10-10-10-5)</span>
            </button>

            <button
              id="btn-save-jars-config"
              className={`btn btn-sm ${isValidPercent ? 'btn-primary' : 'btn-secondary'}`}
              onClick={handleSave}
              disabled={!isValidPercent}
            >
              <Check size={16} />
              <span>{isSaved ? 'Đã lưu thành công!' : 'Lưu cấu hình'}</span>
            </button>
          </div>
        </div>

        {/* Thanh cảnh báo tổng % */}
        <div className={`percent-status-bar ${isValidPercent ? 'status-valid' : 'status-invalid'}`}>
          <div className="status-text">
            {isValidPercent ? (
              <span className="text-success flex-center gap-1">
                <Check size={16} /> Tổng tỷ lệ hợp lệ: <b>100%</b>
              </span>
            ) : (
              <span className="text-danger flex-center gap-1">
                <AlertTriangle size={16} /> Tổng tỷ lệ hiện tại là <b>{totalPercent}%</b> (Cần điều chỉnh lại sao cho đúng 100%)
              </span>
            )}
          </div>
        </div>

        {/* Danh sách 6 Hũ dạng Grid thẻ cấu hình */}
        <div className="jars-settings-grid">
          {safeJars.map(jar => {
            const jarStat = (stats && stats.jarStats && stats.jarStats[jar.id]) || {};
            const currentPct = editingPercents[jar.id] ?? jar.percent;
            const currentBgt = editingBudgets[jar.id] ?? (jar.defaultBudget || 0);

            return (
              <div 
                key={jar.id} 
                className="jar-setting-card"
                style={{ borderLeft: `5px solid ${jar.color}` }}
              >
                <div className="jar-setting-top">
                  <div className="jar-info-left">
                    <div className="jar-mini-icon" style={{ backgroundColor: `${jar.color}20`, color: jar.color }}>
                      <Icon name={jar.icon} size={18} color={jar.color} />
                    </div>
                    <div>
                      <h4 className="jar-name-h4">{jar.name}</h4>
                      <span className="jar-code-text text-muted">{jar.code} • {jar.description}</span>
                    </div>
                  </div>
                </div>

                <div className="jar-setting-controls">
                  {/* Slider & Input % */}
                  <div className="form-group mb-2">
                    <div className="flex-between">
                      <label className="form-label text-xs">Tỷ lệ phân bổ:</label>
                      <span className="font-bold" style={{ color: jar.color }}>{currentPct}%</span>
                    </div>
                    <div className="slider-input-row">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        className="custom-range"
                        value={currentPct === '' ? 0 : currentPct}
                        onChange={e => handlePercentChange(jar.id, e.target.value)}
                        style={{
                          color: jar.color,
                          background: `linear-gradient(to right, ${jar.color} 0%, ${jar.color} ${currentPct === '' ? 0 : currentPct}%, var(--range-track-bg) ${currentPct === '' ? 0 : currentPct}%, var(--range-track-bg) 100%)`
                        }}
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="form-control pct-number-input"
                        value={currentPct}
                        onChange={e => handlePercentChange(jar.id, e.target.value)}
                      />
                      <span className="text-muted">%</span>
                    </div>
                  </div>

                  {/* Input Hạn mức ngân sách tháng */}
                  <div className="form-group mb-0">
                    <label className="form-label text-xs">Hạn mức chi tiêu / tháng (VNĐ):</label>
                    <input
                      type="number"
                      step="500000"
                      min="0"
                      className="form-control budget-number-input"
                      value={currentBgt}
                      onChange={e => handleBudgetChange(jar.id, e.target.value)}
                    />
                  </div>
                </div>

                {/* Số liệu thống kê trong tháng */}
                <div className="jar-current-stat-row">
                  <div>
                    <span className="text-muted text-xs">Đã nạp tháng này:</span>
                    <div className="font-semibold text-sm">{formatCurrency(jarStat.incomeAllocated || 0)}</div>
                  </div>
                  <div>
                    <span className="text-muted text-xs">Đã chi tháng này:</span>
                    <div className="font-semibold text-sm text-danger">{formatCurrency(jarStat.totalSpent || 0)}</div>
                  </div>
                  <div>
                    <span className="text-muted text-xs">Số dư khả dụng:</span>
                    <div className={`font-bold text-sm ${(jarStat.balance || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                      {formatCurrency(jarStat.balance || 0)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
