import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  ArrowRightLeft, 
  Check, 
  AlertCircle,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatCurrency } from '../services/storage';

export default function TransactionModal({
  isOpen,
  onClose,
  data,
  onSaveTransaction,
  editingTx = null,
  initialOptions = {}
}) {
  const [tab, setTab] = useState('expense'); // 'expense' | 'income' | 'transfer'
  
  // State chung
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');

  // State chi tiêu
  const [isFixed, setIsFixed] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [jarId, setJarId] = useState('nec');

  // State thu nhập
  const [autoSplit, setAutoSplit] = useState(true);
  const [incomeSourceId, setIncomeSourceId] = useState('');
  const [splitOverrides, setSplitOverrides] = useState({});

  // State chuyển hũ
  const [fromJarId, setFromJarId] = useState('play');
  const [toJarId, setToJarId] = useState('nec');

  // Khởi tạo form khi modal mở
  useEffect(() => {
    if (!isOpen) return;

    if (editingTx) {
      setTab(editingTx.type);
      setAmount(editingTx.amount.toString());
      setDate(editingTx.date);
      setNote(editingTx.note || '');
      setIsFixed(Boolean(editingTx.isFixed));
      setCategoryId(editingTx.categoryId || '');
      setJarId(editingTx.jarId || 'nec');
      setAutoSplit(Boolean(editingTx.splitJars));
    } else {
      setTab(initialOptions.defaultType || 'expense');
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setNote('');
      setIsFixed(Boolean(initialOptions.isFixed));
      
      const defaultExpCat = data.categories.find(c => c.type === 'expense');
      setCategoryId(defaultExpCat ? defaultExpCat.id : '');
      setJarId(initialOptions.prefillJarId || 'nec');

      const defaultIncCat = data.categories.find(c => c.type === 'income');
      setIncomeSourceId(defaultIncCat ? defaultIncCat.id : '');
      setAutoSplit(true);
      setSplitOverrides({});
    }
  }, [isOpen, editingTx, initialOptions]);

  // Tự động gán Hũ và Tính chất (Cố định/Phát sinh) khi chọn Danh mục chi tiêu
  const handleCategoryChange = (e) => {
    const selectedId = e.target.value;
    setCategoryId(selectedId);
    const cat = data.categories.find(c => c.id === selectedId);
    if (cat) {
      if (cat.jarId && cat.jarId !== 'all') {
        setJarId(cat.jarId);
      }
      if (cat.isFixed !== undefined) {
        setIsFixed(cat.isFixed);
      }
    }
  };

  // Tính toán số tiền phân bổ 6 hũ khi nhập thu nhập
  const parsedAmount = Math.max(0, Number(amount) || 0);

  const calculatedSplits = data.jars.map(j => {
    const defaultSplit = Math.round((parsedAmount * (j.percent || 0)) / 100);
    const override = splitOverrides[j.id];
    return {
      jarId: j.id,
      name: j.name,
      code: j.code,
      percent: j.percent,
      color: j.color,
      amount: override !== undefined ? override : defaultSplit
    };
  });

  const totalSplit = calculatedSplits.reduce((acc, curr) => acc + curr.amount, 0);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (parsedAmount <= 0) {
      alert('Vui lòng nhập số tiền lớn hơn 0');
      return;
    }

    if (tab === 'expense') {
      const newTx = {
        id: editingTx ? editingTx.id : `tx-exp-${Date.now()}`,
        type: 'expense',
        amount: parsedAmount,
        date,
        categoryId,
        jarId,
        isFixed,
        note,
        createdAt: editingTx ? editingTx.createdAt : Date.now()
      };
      onSaveTransaction(newTx);
      onClose();
    } else if (tab === 'income') {
      const splitData = autoSplit
        ? calculatedSplits.map(s => ({ jarId: s.jarId, amount: s.amount }))
        : [{ jarId, amount: parsedAmount }];

      const newTx = {
        id: editingTx ? editingTx.id : `tx-inc-${Date.now()}`,
        type: 'income',
        amount: parsedAmount,
        date,
        categoryId: incomeSourceId,
        jarId: autoSplit ? 'all' : jarId,
        isFixed,
        note,
        splitJars: splitData,
        createdAt: editingTx ? editingTx.createdAt : Date.now()
      };

      // Kích hoạt pháo hoa hiệu ứng thu nhập
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (err) {
        // Safe fallback
      }

      onSaveTransaction(newTx);
      onClose();
    } else if (tab === 'transfer') {
      if (fromJarId === toJarId) {
        alert('Vui lòng chọn hai hũ khác nhau để chuyển tiền');
        return;
      }

      // Tạo 2 giao dịch: 1 khoản chi từ Hũ A và 1 khoản thu vào Hũ B
      const transferOut = {
        id: `tx-tf-out-${Date.now()}`,
        type: 'expense',
        amount: parsedAmount,
        date,
        categoryId: 'cat-transfer',
        jarId: fromJarId,
        isFixed: false,
        note: `Chuyển sang hũ ${data.jars.find(j => j.id === toJarId)?.name || toJarId}: ${note}`,
        createdAt: Date.now()
      };

      const transferIn = {
        id: `tx-tf-in-${Date.now()}`,
        type: 'income',
        amount: parsedAmount,
        date,
        categoryId: 'cat-transfer',
        jarId: toJarId,
        isFixed: false,
        note: `Nhận chuyển từ hũ ${data.jars.find(j => j.id === fromJarId)?.name || fromJarId}: ${note}`,
        splitJars: [{ jarId: toJarId, amount: parsedAmount }],
        createdAt: Date.now() + 1
      };

      onSaveTransaction(transferOut);
      onSaveTransaction(transferIn);
      onClose();
    }
  };

  const currentJarObj = data.jars.find(j => j.id === jarId);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="tab-pill-group">
            <button
              id="tab-modal-expense"
              type="button"
              className={`tab-pill ${tab === 'expense' ? 'active-pill expense' : ''}`}
              onClick={() => setTab('expense')}
            >
              <ArrowDownCircle size={16} />
              <span>Ghi Chi Tiêu</span>
            </button>

            <button
              id="tab-modal-income"
              type="button"
              className={`tab-pill ${tab === 'income' ? 'active-pill income' : ''}`}
              onClick={() => setTab('income')}
            >
              <ArrowUpCircle size={16} />
              <span>Ghi Thu Nhập</span>
            </button>

            <button
              id="tab-modal-transfer"
              type="button"
              className={`tab-pill ${tab === 'transfer' ? 'active-pill transfer' : ''}`}
              onClick={() => setTab('transfer')}
            >
              <ArrowRightLeft size={16} />
              <span>Chuyển Hũ</span>
            </button>
          </div>

          <button className="btn-icon btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="modal-body">
          {/* 1. Nhập Số Tiền */}
          <div className="form-group">
            <label className="form-label">Số tiền (VNĐ) *</label>
            <div className="amount-input-wrap">
              <input
                id="input-tx-amount"
                type="number"
                min="0"
                step="1000"
                className="form-control amount-input"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                autoFocus
                required
              />
              <span className="currency-unit">₫</span>
            </div>
            {parsedAmount > 0 && (
              <div className="amount-preview-text text-muted">
                = {formatCurrency(parsedAmount)}
              </div>
            )}

            {/* Quick buttons */}
            <div className="quick-amount-buttons">
              {[50000, 100000, 200000, 500000, 1000000, 2000000, 5000000].map(val => (
                <button
                  key={val}
                  type="button"
                  className="quick-amount-btn"
                  onClick={() => setAmount(val.toString())}
                >
                  +{val >= 1000000 ? `${val / 1000000}tr` : `${val / 1000}k`}
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: GHI CHI TIÊU */}
          {tab === 'expense' && (
            <>
              {/* Phân loại: Cố định vs Phát sinh */}
              <div className="form-group">
                <label className="form-label">Tính chất khoản chi *</label>
                <div className="nature-selector-grid">
                  <label className={`nature-option ${!isFixed ? 'selected-variable' : ''}`}>
                    <input
                      type="radio"
                      name="nature"
                      checked={!isFixed}
                      onChange={() => setIsFixed(false)}
                    />
                    <div>
                      <div className="nature-title">Chi Phát Sinh / Đột Xuất</div>
                      <div className="nature-desc text-muted">Ăn uống, cafe, xăng xe, mua sắm, sửa xe...</div>
                    </div>
                  </label>

                  <label className={`nature-option ${isFixed ? 'selected-fixed' : ''}`}>
                    <input
                      type="radio"
                      name="nature"
                      checked={isFixed}
                      onChange={() => setIsFixed(true)}
                    />
                    <div>
                      <div className="nature-title">Chi Cố Định Định Kỳ</div>
                      <div className="nature-desc text-muted">Tiền nhà, điện nước, internet, 4G, trả góp...</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Danh mục chi & Hũ tài chính */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Danh mục chi tiêu *</label>
                  <select
                    id="select-tx-category"
                    className="form-control"
                    value={categoryId}
                    onChange={handleCategoryChange}
                    required
                  >
                    <optgroup label="Khoản chi cố định">
                      {data.categories.filter(c => c.type === 'expense' && c.isFixed).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Khoản chi không cố định / phát sinh">
                      {data.categories.filter(c => c.type === 'expense' && !c.isFixed).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Trừ vào Hũ tài chính *</label>
                  <select
                    id="select-tx-jar"
                    className="form-control"
                    value={jarId}
                    onChange={e => setJarId(e.target.value)}
                    required
                  >
                    {data.jars.map(j => (
                      <option key={j.id} value={j.id}>
                        {j.name} ({j.code} - {j.percent}%)
                      </option>
                    ))}
                  </select>
                  {currentJarObj && (
                    <span className="form-hint text-muted">
                      Hũ gợi ý theo danh mục: <b style={{ color: currentJarObj.color }}>{currentJarObj.name}</b>
                    </span>
                  )}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: GHI THU NHẬP */}
          {tab === 'income' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nguồn thu nhập *</label>
                  <select
                    id="select-income-source"
                    className="form-control"
                    value={incomeSourceId}
                    onChange={e => setIncomeSourceId(e.target.value)}
                    required
                  >
                    {data.categories.filter(c => c.type === 'income').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Phương thức phân bổ *</label>
                  <select
                    className="form-control"
                    value={autoSplit ? 'auto' : 'single'}
                    onChange={e => setAutoSplit(e.target.value === 'auto')}
                  >
                    <option value="auto">✨ Tự động phân bổ theo tỷ lệ 6 hũ</option>
                    <option value="single">Chỉ nạp vào 1 hũ chỉ định</option>
                  </select>
                </div>
              </div>

              {!autoSplit ? (
                <div className="form-group">
                  <label className="form-label">Hũ nhận toàn bộ thu nhập</label>
                  <select
                    className="form-control"
                    value={jarId}
                    onChange={e => setJarId(e.target.value)}
                  >
                    {data.jars.map(j => (
                      <option key={j.id} value={j.id}>{j.name} ({j.code})</option>
                    ))}
                  </select>
                </div>
              ) : (
                /* Xem trước tự động phân chia 6 hũ */
                <div className="split-preview-box">
                  <div className="split-header">
                    <span className="split-title">
                      <Sparkles size={15} className="text-warning" />
                      Phân bổ tự động vào 6 Hũ tài chính:
                    </span>
                    <span className="split-total text-muted">Tổng: {formatCurrency(totalSplit)}</span>
                  </div>

                  <div className="split-items-list">
                    {calculatedSplits.map(s => (
                      <div key={s.jarId} className="split-item-row">
                        <div className="split-item-name">
                          <span className="jar-dot" style={{ backgroundColor: s.color }}></span>
                          <span>{s.name} ({s.percent}%)</span>
                        </div>
                        <span className="split-item-amount font-semibold" style={{ color: s.color }}>
                          +{formatCurrency(s.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 3: CHUYỂN TIỀN GIỮA CÁC HŨ */}
          {tab === 'transfer' && (
            <div className="transfer-box">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Chuyển từ Hũ (Nguồn) *</label>
                  <select
                    className="form-control"
                    value={fromJarId}
                    onChange={e => setFromJarId(e.target.value)}
                  >
                    {data.jars.map(j => (
                      <option key={j.id} value={j.id}>{j.name} ({j.code})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Sang Hũ (Đích) *</label>
                  <select
                    className="form-control"
                    value={toJarId}
                    onChange={e => setToJarId(e.target.value)}
                  >
                    {data.jars.map(j => (
                      <option key={j.id} value={j.id}>{j.name} ({j.code})</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-muted text-sm mt-1">
                💡 Dùng tính năng này khi một hũ chi vượt định mức (VD: Thiết yếu) và bạn muốn bù tiền từ hũ khác (VD: Hưởng thụ).
              </p>
            </div>
          )}

          {/* Ngày & Ghi chú */}
          <div className="form-row mt-2">
            <div className="form-group">
              <label className="form-label">Ngày giao dịch *</label>
              <input
                id="input-tx-date"
                type="date"
                className="form-control"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Ghi chú chi tiết</label>
              <input
                id="input-tx-note"
                type="text"
                className="form-control"
                placeholder="VD: Đi siêu thị Winmart, Đổ xăng 95..."
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Hủy bỏ
            </button>
            <button 
              id="btn-save-tx"
              type="submit" 
              className={`btn ${tab === 'income' ? 'btn-success' : 'btn-primary'}`}
            >
              <Check size={18} />
              <span>{editingTx ? 'Cập nhật giao dịch' : 'Lưu giao dịch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
