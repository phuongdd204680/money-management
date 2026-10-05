import React, { useState, useRef } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  RotateCcw, 
  Trash2, 
  Plus, 
  FolderPlus, 
  Check, 
  AlertTriangle,
  Database
} from 'lucide-react';
import Icon from './Icon';
import { exportDataToJson } from '../services/storage';

export default function SettingsModal({
  isOpen,
  onClose,
  data,
  onAddCategory,
  onDeleteCategory,
  onResetData,
  onLoadDemo,
  onImportData
}) {
  const [tab, setTab] = useState('categories'); // 'categories' | 'backup'
  const fileInputRef = useRef(null);

  // State thêm danh mục mới
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState('expense');
  const [newCatFixed, setNewCatFixed] = useState(false);
  const [newCatJarId, setNewCatJarId] = useState('nec');
  const [newCatIcon, setNewCatIcon] = useState('Tag');

  if (!isOpen) return null;

  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCat = {
      id: `cat-custom-${Date.now()}`,
      name: newCatName.trim(),
      type: newCatType,
      isFixed: newCatFixed,
      jarId: newCatType === 'income' ? 'all' : newCatJarId,
      icon: newCatIcon,
      color: newCatType === 'income' ? '#10b981' : '#6366f1'
    };

    onAddCategory(newCat);
    setNewCatName('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.jars && parsed.categories && parsed.transactions) {
          onImportData(parsed);
          alert('Khôi phục dữ liệu thành công!');
          onClose();
        } else {
          alert('File JSON không hợp lệ hoặc thiếu cấu trúc FinFlow.');
        }
      } catch (err) {
        alert('Lỗi đọc file JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="tab-pill-group">
            <button
              className={`tab-pill ${tab === 'categories' ? 'active-pill' : ''}`}
              onClick={() => setTab('categories')}
            >
              <FolderPlus size={16} />
              <span>Quản Lý Danh Mục</span>
            </button>

            <button
              className={`tab-pill ${tab === 'backup' ? 'active-pill' : ''}`}
              onClick={() => setTab('backup')}
            >
              <Database size={16} />
              <span>Sao Lưu & Dữ Liệu</span>
            </button>
          </div>

          <button className="btn-icon btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {tab === 'categories' && (
            <div className="categories-settings">
              {/* Thêm danh mục mới */}
              <form onSubmit={handleCreateCategory} className="card p-3 mb-4">
                <h4 className="card-subheading mb-3 text-sm">+ Thêm Danh Mục Chi Tiêu Mới</h4>
                <div className="form-row">
                  <div className="form-group mb-2">
                    <label className="form-label text-xs">Tên danh mục *</label>
                    <input
                      id="input-new-cat-name"
                      type="text"
                      className="form-control"
                      placeholder="VD: Trả góp xe máy, Tiền học thêm..."
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group mb-2">
                    <label className="form-label text-xs">Tính chất chi tiêu *</label>
                    <select
                      className="form-control"
                      value={newCatFixed ? 'fixed' : 'variable'}
                      onChange={e => setNewCatFixed(e.target.value === 'fixed')}
                    >
                      <option value="variable">Chi phát sinh / Đột xuất</option>
                      <option value="fixed">Chi cố định định kỳ</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group mb-2">
                    <label className="form-label text-xs">Hũ liên kết mặc định *</label>
                    <select
                      className="form-control"
                      value={newCatJarId}
                      onChange={e => setNewCatJarId(e.target.value)}
                    >
                      {data.jars.map(j => (
                        <option key={j.id} value={j.id}>{j.name} ({j.code})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group mb-2 flex-end">
                    <button id="btn-submit-new-cat" type="submit" className="btn btn-primary w-full">
                      <Plus size={16} />
                      <span>Thêm Danh Mục</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Danh sách danh mục hiện có */}
              <div className="existing-categories-list">
                <h4 className="text-xs font-bold text-muted uppercase mb-2">Danh mục chi tiêu hiện tại:</h4>
                <div className="categories-grid-scroll">
                  {data.categories.map(cat => {
                    const jar = data.jars.find(j => j.id === cat.jarId);
                    return (
                      <div key={cat.id} className="category-item-chip">
                        <div className="chip-left">
                          <div 
                            className="chip-icon"
                            style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                          >
                            <Icon name={cat.icon} size={14} color={cat.color} />
                          </div>
                          <div>
                            <span className="chip-name font-semibold text-sm">{cat.name}</span>
                            <div className="chip-meta text-xs text-muted">
                              {cat.type === 'expense' ? (cat.isFixed ? 'Cố định' : 'Phát sinh') : 'Thu nhập'}
                              {jar && ` • ${jar.code}`}
                            </div>
                          </div>
                        </div>

                        {cat.id.startsWith('cat-custom-') && (
                          <button
                            className="btn-icon-sm text-danger hover-danger"
                            onClick={() => onDeleteCategory(cat.id)}
                            title="Xóa danh mục này"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'backup' && (
            <div className="backup-settings space-y-4">
              {/* Xuất file JSON */}
              <div className="backup-action-card card">
                <div className="flex-between">
                  <div>
                    <h4 className="font-semibold text-sm">Xuất Dữ Liệu Dự Phòng (JSON)</h4>
                    <p className="text-muted text-xs">
                      Tải toàn bộ giao dịch, 6 hũ và hoá đơn cố định về máy tính cá nhân để lưu trữ an toàn.
                    </p>
                  </div>
                  <button 
                    id="btn-export-backup-json"
                    className="btn btn-primary btn-sm"
                    onClick={() => exportDataToJson(data)}
                  >
                    <Download size={15} />
                    <span>Tải file JSON</span>
                  </button>
                </div>
              </div>

              {/* Khôi phục file JSON */}
              <div className="backup-action-card card">
                <div className="flex-between">
                  <div>
                    <h4 className="font-semibold text-sm">Khôi Phục Dữ Liệu Từ File JSON</h4>
                    <p className="text-muted text-xs">
                      Nạp lại dữ liệu từ file sao lưu .json bạn đã tải trước đó.
                    </p>
                  </div>
                  <div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      accept=".json" 
                      style={{ display: 'none' }} 
                      onChange={handleFileChange}
                    />
                    <button 
                      id="btn-import-backup-json"
                      className="btn btn-secondary btn-sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={15} />
                      <span>Chọn file JSON</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Nạp lại dữ liệu mẫu */}
              <div className="backup-action-card card">
                <div className="flex-between">
                  <div>
                    <h4 className="font-semibold text-sm">Nạp Lại Dữ Liệu Mẫu Phong Phú (Demo)</h4>
                    <p className="text-muted text-xs">
                      Tải lại bộ dữ liệu mẫu với các giao dịch lương, chi phí nhà trọ, ăn uống, đầu tư thực tế.
                    </p>
                  </div>
                  <button 
                    id="btn-reload-demo-data"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      if (window.confirm('Hành động này sẽ ghi đè dữ liệu hiện tại bằng dữ liệu mẫu demo. Bạn có chắc không?')) {
                        onLoadDemo();
                        onClose();
                      }
                    }}
                  >
                    <RotateCcw size={15} />
                    <span>Nạp Dữ Liệu Mẫu</span>
                  </button>
                </div>
              </div>

              {/* Xóa trắng dữ liệu */}
              <div className="backup-action-card card border-danger">
                <div className="flex-between">
                  <div>
                    <h4 className="font-semibold text-sm text-danger">Xóa Trắng Dữ Liệu (Reset)</h4>
                    <p className="text-muted text-xs">
                      Xóa toàn bộ lịch sử giao dịch và bắt đầu ghi chép lại từ đầu.
                    </p>
                  </div>
                  <button 
                    id="btn-reset-all-data"
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      if (window.confirm('CẢNH BÁO: Toàn bộ dữ liệu giao dịch sẽ bị xóa vĩnh viễn! Bạn có chắc chắn muốn xóa không?')) {
                        onResetData();
                        onClose();
                      }
                    }}
                  >
                    <Trash2 size={15} />
                    <span>Xóa tất cả</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
