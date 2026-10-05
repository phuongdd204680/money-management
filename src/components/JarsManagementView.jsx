import React, { useState } from 'react';
import { 
  Layers, 
  Percent, 
  RotateCcw, 
  Check, 
  AlertTriangle, 
  ArrowRightLeft, 
  Info,
  DollarSign
} from 'lucide-react';
import Icon from './Icon';
import { formatCurrency } from '../services/storage';

export default function JarsManagementView({
  jars,
  stats,
  onUpdateJars,
  onOpenTxModal
}) {
  const [editingPercents, setEditingPercents] = useState(() => {
    const p = {};
    jars.forEach(j => { p[j.id] = j.percent; });
    return p;
  });

  const [editingBudgets, setEditingBudgets] = useState(() => {
    const b = {};
    jars.forEach(j => { b[j.id] = j.defaultBudget || 0; });
    return b;
  });

  const [isSaved, setIsSaved] = useState(false);

  // Tính tổng % hiện tại
  const totalPercent = Object.values(editingPercents).reduce((acc, val) => acc + (Number(val) || 0), 0);
  const isValidPercent = totalPercent === 100;

  const handlePercentChange = (id, val) => {
    setIsSaved(false);
    const num = Math.max(0, Math.min(100, parseInt(val, 10) || 0));
    setEditingPercents(prev => ({ ...prev, [id]: num }));
  };

  const handleBudgetChange = (id, val) => {
    setIsSaved(false);
    const num = Math.max(0, parseInt(val, 10) || 0);
    setEditingBudgets(prev => ({ ...prev, [id]: num }));
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
    setIsSaved(false);
  };

  const handleSave = () => {
    if (!isValidPercent) {
      alert(`Tổng tỷ lệ các hũ phải bằng đúng 100%. Hiện tại đang là ${totalPercent}%!`);
      return;
    }

    const updatedJars = jars.map(j => ({
      ...j,
      percent: editingPercents[j.id] !== undefined ? editingPercents[j.id] : j.percent,
      defaultBudget: editingBudgets[j.id] !== undefined ? editingBudgets[j.id] : j.defaultBudget
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

      {/* 2. Bảng Tùy Chỉnh Tỷ Lệ & Ngân Sách */}
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
          {jars.map(jar => {
            const jarStat = stats.jarStats[jar.id] || {};
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
                        value={currentPct}
                        onChange={e => handlePercentChange(jar.id, e.target.value)}
                        style={{ accentColor: jar.color }}
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
