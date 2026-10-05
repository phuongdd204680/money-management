import React, { useState } from 'react';
import { 
  CalendarClock, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Trash2, 
  Edit3, 
  AlertCircle,
  Check,
  Calendar,
  DollarSign
} from 'lucide-react';
import Icon from './Icon';
import { formatCurrency } from '../services/storage';

export default function RecurringBillsView({
  bills,
  selectedMonth,
  categories,
  jars,
  onPayBill,
  onUnpayBill,
  onAddBill,
  onDeleteBill
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  
  // State form thêm hoá đơn mới
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('5');
  const [categoryId, setCategoryId] = useState('cat-rent');
  const [jarId, setJarId] = useState('nec');
  const [note, setNote] = useState('');

  const now = new Date();
  const todayDay = now.getDate();

  const handleCreateBill = (e) => {
    e.preventDefault();
    const parsedAmt = Number(amount) || 0;
    if (!name.trim() || parsedAmt <= 0) {
      alert('Vui lòng nhập tên khoản chi và số tiền hợp lệ');
      return;
    }

    const newBill = {
      id: `bill-${Date.now()}`,
      name: name.trim(),
      amount: parsedAmt,
      dueDay: parseInt(dueDay, 10) || 1,
      cycle: 'monthly',
      categoryId,
      jarId,
      note: note.trim(),
      lastPaidMonth: ''
    };

    onAddBill(newBill);
    setShowAddModal(false);
    setName('');
    setAmount('');
    setNote('');
  };

  const getCategory = (catId) => {
    return categories.find(c => c.id === catId) || { name: 'Chi cố định', icon: 'FileText', color: '#6366f1' };
  };

  const getJar = (jId) => {
    return jars.find(j => j.id === jId) || { name: 'Thiết yếu', code: 'NEC', color: '#3b82f6' };
  };

  const totalBillAmount = bills.reduce((acc, b) => acc + Number(b.amount || 0), 0);
  const paidCount = bills.filter(b => b.isPaid).length;
  const pendingCount = bills.length - paidCount;

  return (
    <div className="recurring-view-container">
      {/* 1. Header Toolbar */}
      <div className="view-toolbar card">
        <div className="flex-between flex-wrap gap-4">
          <div>
            <h2 className="section-title">Quản Lý Các Khoản Chi Cố Định Định Kỳ</h2>
            <p className="section-desc text-muted">
              Lên lịch hoá đơn, tiền nhà, dịch vụ trả sau hàng tháng và ghi nhận chi tiêu tự động với 1 chạm.
            </p>
          </div>

          <button 
            id="btn-add-recurring-bill"
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            <span>Thêm khoản chi cố định</span>
          </button>
        </div>

        {/* Thống kê tiến độ */}
        <div className="bills-progress-strip mt-4">
          <div className="bills-stat-pill">
            <span className="text-muted">Tổng dự kiến tháng:</span>
            <span className="font-bold">{formatCurrency(totalBillAmount)}</span>
          </div>
          <div className="bills-stat-pill">
            <span className="text-muted">Đã thanh toán:</span>
            <span className="text-success font-bold">{paidCount} khoản</span>
          </div>
          <div className="bills-stat-pill">
            <span className="text-muted">Chưa thanh toán:</span>
            <span className="text-warning font-bold">{pendingCount} khoản</span>
          </div>
        </div>
      </div>

      {/* 2. Grid Danh Sách Hoá Đơn Cố Định */}
      <div className="bills-grid">
        {bills.length === 0 ? (
          <div className="empty-state card text-center py-12">
            <p className="text-muted text-lg mb-3">Chưa có khoản chi cố định nào được thiết lập.</p>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
              + Thêm khoản chi cố định đầu tiên
            </button>
          </div>
        ) : (
          bills.map(bill => {
            const cat = getCategory(bill.categoryId);
            const jar = getJar(bill.jarId);
            const isPaid = bill.isPaid;

            // Tính số ngày còn lại đến hạn
            const daysLeft = bill.dueDay - todayDay;
            const isDueSoon = !isPaid && daysLeft >= 0 && daysLeft <= 3;
            const isOverdue = !isPaid && daysLeft < 0;

            return (
              <div 
                key={bill.id} 
                className={`bill-card card ${isPaid ? 'bill-paid' : isOverdue ? 'bill-overdue' : ''}`}
              >
                <div className="bill-card-header">
                  <div className="bill-header-left">
                    <div 
                      className="bill-icon"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                    >
                      <Icon name={cat.icon} size={20} color={cat.color} />
                    </div>
                    <div>
                      <h3 className="bill-title">{bill.name}</h3>
                      <div className="bill-sub text-muted">
                        <span>Hạn ngày {bill.dueDay} hàng tháng</span>
                        {bill.note && <span> • {bill.note}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Trạng thái */}
                  <div className="bill-status-wrap">
                    {isPaid ? (
                      <span className="badge badge-income">
                        <CheckCircle2 size={13} /> Đã nộp
                      </span>
                    ) : isOverdue ? (
                      <span className="badge badge-expense alert-pulse">
                        <AlertCircle size={13} /> Quá hạn {Math.abs(daysLeft)} ngày
                      </span>
                    ) : isDueSoon ? (
                      <span className="badge badge-variable">
                        <Clock size={13} /> Còn {daysLeft} ngày
                      </span>
                    ) : (
                      <span className="badge badge-fixed">
                        <Clock size={13} /> Ngày {bill.dueDay}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bill-amount-row">
                  <div>
                    <span className="text-muted text-xs">Số tiền thanh toán:</span>
                    <div className="bill-amount-text font-bold text-lg">
                      {formatCurrency(bill.amount)}
                    </div>
                  </div>

                  <div className="bill-tags-wrap">
                    <span 
                      className="jar-pill-tag"
                      style={{ color: jar.color, borderColor: `${jar.color}40`, backgroundColor: `${jar.color}15` }}
                    >
                      {jar.name} ({jar.code})
                    </span>
                  </div>
                </div>

                {/* Nút hành động */}
                <div className="bill-actions-footer">
                  {isPaid ? (
                    <button 
                      id={`btn-unpay-bill-${bill.id}`}
                      className="btn btn-secondary btn-sm"
                      onClick={() => onUnpayBill(bill.id)}
                      title="Hoàn tác trạng thái chưa trả"
                    >
                      <span>Hoàn tác (Chưa trả)</span>
                    </button>
                  ) : (
                    <button 
                      id={`btn-pay-bill-${bill.id}`}
                      className="btn btn-success btn-sm w-full"
                      onClick={() => onPayBill(bill)}
                    >
                      <Check size={16} />
                      <span>Xác nhận đã thanh toán</span>
                    </button>
                  )}

                  <button 
                    id={`btn-del-bill-${bill.id}`}
                    className="btn-icon-sm text-muted hover-danger ml-auto"
                    onClick={() => {
                      if (window.confirm(`Bạn có muốn xóa khoản chi cố định "${bill.name}" không?`)) {
                        onDeleteBill(bill.id);
                      }
                    }}
                    title="Xóa khoản chi cố định này"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. Modal Thêm Khoản Chi Cố Định Mới */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title flex-center gap-2">
                <CalendarClock size={20} className="text-primary-color" />
                Thêm Khoản Chi Cố Định Định Kỳ
              </h3>
              <button className="btn-icon btn-ghost" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateBill} className="modal-body">
              <div className="form-group">
                <label className="form-label">Tên khoản chi *</label>
                <input
                  id="input-new-bill-name"
                  type="text"
                  className="form-control"
                  placeholder="VD: Tiền nhà, Internet FPT, Bảo hiểm nhân thọ..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Số tiền (VNĐ) *</label>
                  <input
                    id="input-new-bill-amount"
                    type="number"
                    step="10000"
                    min="0"
                    className="form-control"
                    placeholder="VD: 5500000"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ngày đến hạn hàng tháng *</label>
                  <select
                    className="form-control"
                    value={dueDay}
                    onChange={e => setDueDay(e.target.value)}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>Ngày {day} hàng tháng</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Danh mục chi tiêu</label>
                  <select
                    className="form-control"
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                  >
                    {categories.filter(c => c.type === 'expense').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Hũ tài chính liên kết</label>
                  <select
                    className="form-control"
                    value={jarId}
                    onChange={e => setJarId(e.target.value)}
                  >
                    {jars.map(j => (
                      <option key={j.id} value={j.id}>{j.name} ({j.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Ghi chú thêm</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="VD: Chuyển khoản số tài khoản 123456... trước ngày 5"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Hủy bỏ
                </button>
                <button id="btn-submit-new-bill" type="submit" className="btn btn-primary">
                  <Check size={16} />
                  <span>Thêm khoản chi cố định</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
