import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit2, 
  Download, 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  SlidersHorizontal,
  Calendar
} from 'lucide-react';
import Icon from './Icon';
import { formatCurrency, formatDate } from '../services/storage';

export default function TransactionsView({
  transactions,
  categories,
  jars,
  onOpenTxModal,
  onEditTransaction,
  onDeleteTransaction,
  onExportCsv
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all | expense | income
  const [filterNature, setFilterNature] = useState('all'); // all | fixed | variable
  const [filterJar, setFilterJar] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const catMap = useMemo(() => {
    const map = {};
    categories.forEach(c => { map[c.id] = c; });
    return map;
  }, [categories]);

  const jarMap = useMemo(() => {
    const map = {};
    jars.forEach(j => { map[j.id] = j; });
    return map;
  }, [jars]);

  // Lọc danh sách giao dịch
  const filteredList = useMemo(() => {
    return transactions.filter(tx => {
      // Tìm kiếm từ khoá
      if (searchTerm) {
        const cat = catMap[tx.categoryId];
        const text = `${tx.note || ''} ${cat?.name || ''}`.toLowerCase();
        if (!text.includes(searchTerm.toLowerCase())) {
          return false;
        }
      }

      // Loại GD
      if (filterType !== 'all' && tx.type !== filterType) {
        return false;
      }

      // Tính chất cố định vs phát sinh
      if (filterNature === 'fixed' && !tx.isFixed) return false;
      if (filterNature === 'variable' && tx.isFixed) return false;

      // Hũ tài chính
      if (filterJar !== 'all') {
        if (tx.type === 'income' && tx.splitJars) {
          const hasJar = tx.splitJars.some(s => s.jarId === filterJar);
          if (!hasJar) return false;
        } else if (tx.jarId !== filterJar && tx.jarId !== 'all') {
          return false;
        }
      }

      // Danh mục
      if (filterCategory !== 'all' && tx.categoryId !== filterCategory) {
        return false;
      }

      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, searchTerm, filterType, filterNature, filterJar, filterCategory, catMap]);

  // Thống kê nhanh của kết quả lọc
  const stats = useMemo(() => {
    let inc = 0;
    let exp = 0;
    filteredList.forEach(t => {
      if (t.type === 'income') inc += Number(t.amount) || 0;
      if (t.type === 'expense') exp += Number(t.amount) || 0;
    });
    return { count: filteredList.length, inc, exp, net: inc - exp };
  }, [filteredList]);

  return (
    <div className="transactions-view-container">
      {/* 1. Header Toolbar */}
      <div className="view-toolbar card">
        <div className="toolbar-top">
          <div className="search-box">
            <Search size={18} className="search-icon text-muted" />
            <input
              id="input-search-tx"
              type="text"
              className="search-input"
              placeholder="Tìm kiếm giao dịch theo ghi chú hoặc danh mục..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="btn-clear text-muted" onClick={() => setSearchTerm('')}>✕</button>
            )}
          </div>

          <div className="toolbar-actions">
            <button 
              id="btn-export-csv"
              className="btn btn-secondary" 
              onClick={onExportCsv}
            >
              <Download size={16} />
              <span>Xuất file Excel (CSV)</span>
            </button>

            <button 
              id="btn-add-tx-from-view"
              className="btn btn-primary" 
              onClick={() => onOpenTxModal()}
            >
              <PlusCircle size={16} />
              <span>Ghi chép mới</span>
            </button>
          </div>
        </div>

        {/* 2. Hàng Bộ Lọc Phân Loại */}
        <div className="filters-row">
          <div className="filter-pill-group">
            <span className="filter-label"><Filter size={14} /> Phân loại:</span>
            <button
              className={`filter-pill ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              Tất cả
            </button>
            <button
              className={`filter-pill ${filterType === 'expense' ? 'active' : ''}`}
              onClick={() => setFilterType('expense')}
            >
              Chi tiêu
            </button>
            <button
              className={`filter-pill ${filterType === 'income' ? 'active' : ''}`}
              onClick={() => setFilterType('income')}
            >
              Thu nhập
            </button>
          </div>

          <div className="filter-pill-group">
            <span className="filter-label">Tính chất:</span>
            <button
              className={`filter-pill ${filterNature === 'all' ? 'active' : ''}`}
              onClick={() => setFilterNature('all')}
            >
              Tất cả
            </button>
            <button
              className={`filter-pill ${filterNature === 'fixed' ? 'active' : ''}`}
              onClick={() => setFilterNature('fixed')}
            >
              Cố định
            </button>
            <button
              className={`filter-pill ${filterNature === 'variable' ? 'active' : ''}`}
              onClick={() => setFilterNature('variable')}
            >
              Phát sinh
            </button>
          </div>

          <div className="filter-selects-wrap">
            {/* Lọc Hũ */}
            <select
              className="filter-select"
              value={filterJar}
              onChange={e => setFilterJar(e.target.value)}
            >
              <option value="all">Tất cả 6 Hũ</option>
              {jars.map(j => (
                <option key={j.id} value={j.id}>{j.name} ({j.code})</option>
              ))}
            </select>

            {/* Lọc Danh mục */}
            <select
              className="filter-select"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="all">Tất cả Danh mục</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Tóm Tắt Kết Quả Lọc */}
      <div className="filter-summary-bar">
        <span>Hiển thị <b>{stats.count}</b> giao dịch</span>
        <div className="summary-amounts">
          <span className="text-success font-semibold">Thu: +{formatCurrency(stats.inc)}</span>
          <span className="text-danger font-semibold">Chi: -{formatCurrency(stats.exp)}</span>
          <span className="text-muted">Chênh lệch: <b className={stats.net >= 0 ? 'text-primary-color' : 'text-danger'}>{formatCurrency(stats.net)}</b></span>
        </div>
      </div>

      {/* 4. Danh Sách Giao Dịch */}
      <div className="transactions-list-card card">
        {filteredList.length === 0 ? (
          <div className="empty-state py-12 text-center">
            <p className="text-muted text-lg mb-3">Không tìm thấy giao dịch nào phù hợp với bộ lọc.</p>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterNature('all');
                setFilterJar('all');
                setFilterCategory('all');
              }}
            >
              Đặt lại toàn bộ bộ lọc
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Danh mục / Khoản giao dịch</th>
                  <th>Hũ tài chính</th>
                  <th>Tính chất</th>
                  <th className="text-right">Số tiền</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map(tx => {
                  const cat = catMap[tx.categoryId] || { name: 'Khác', icon: 'Tag', color: '#6366f1' };
                  const isInc = tx.type === 'income';
                  const jar = jarMap[tx.jarId];

                  return (
                    <tr key={tx.id} className="tx-row">
                      {/* Ngày */}
                      <td className="tx-date-col">
                        <div className="date-badge">
                          <Calendar size={13} className="text-muted" />
                          <span>{formatDate(tx.date)}</span>
                        </div>
                      </td>

                      {/* Danh mục & Ghi chú */}
                      <td className="tx-info-col">
                        <div className="tx-item-flex">
                          <div 
                            className="tx-category-icon"
                            style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                          >
                            <Icon name={cat.icon} size={16} color={cat.color} />
                          </div>
                          <div>
                            <div className="tx-category-title">{cat.name}</div>
                            {tx.note && <div className="tx-note-text text-muted">{tx.note}</div>}
                          </div>
                        </div>
                      </td>

                      {/* Hũ tài chính */}
                      <td className="tx-jar-col">
                        {isInc && tx.jarId === 'all' ? (
                          <span className="badge badge-variable">✨ Chia 6 Hũ</span>
                        ) : jar ? (
                          <span 
                            className="jar-pill-tag"
                            style={{ 
                              color: jar.color, 
                              borderColor: `${jar.color}40`,
                              backgroundColor: `${jar.color}15`
                            }}
                          >
                            {jar.name} ({jar.code})
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>

                      {/* Tính chất Cố định / Phát sinh */}
                      <td className="tx-nature-col">
                        {tx.type === 'expense' ? (
                          <span className={`badge ${tx.isFixed ? 'badge-fixed' : 'badge-variable'}`}>
                            {tx.isFixed ? 'Cố định' : 'Phát sinh'}
                          </span>
                        ) : (
                          <span className="badge badge-income">Thu nhập</span>
                        )}
                      </td>

                      {/* Số tiền */}
                      <td className={`tx-amount-col text-right ${isInc ? 'text-success font-bold' : 'text-danger font-semibold'}`}>
                        {isInc ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>

                      {/* Thao tác */}
                      <td className="tx-actions-col text-center">
                        <div className="action-buttons-wrap">
                          <button
                            id={`btn-edit-tx-${tx.id}`}
                            className="btn-icon-sm text-muted hover-primary"
                            onClick={() => onEditTransaction(tx)}
                            title="Sửa giao dịch"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            id={`btn-delete-tx-${tx.id}`}
                            className="btn-icon-sm text-muted hover-danger"
                            onClick={() => {
                              if (window.confirm('Bạn có chắc chắn muốn xóa giao dịch này không?')) {
                                onDeleteTransaction(tx.id);
                              }
                            }}
                            title="Xóa giao dịch"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
