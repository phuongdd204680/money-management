import React from 'react';
import { 
  PlusCircle, 
  Sun, 
  Moon, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  PieChart, 
  ListFilter, 
  Layers, 
  CalendarClock, 
  BarChart3, 
  Settings, 
  Sparkles,
  Download,
  Cloud,
  LogOut,
  UserCheck
} from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  selectedMonth,
  setSelectedMonth,
  theme,
  toggleTheme,
  onOpenTxModal,
  onOpenSettingsModal,
  onOpenAuthModal,
  onExportCsv,
  currentUser,
  onSignOut,
  isSyncing
}) {
  // Chuyển tháng trước / tháng sau
  const handleMonthChange = (offset) => {
    let year = parseInt(selectedMonth.split('-')[0], 10);
    let month = parseInt(selectedMonth.split('-')[1], 10);

    month += offset;
    if (month > 12) {
      month = 1;
      year += 1;
    } else if (month < 1) {
      month = 12;
      year -= 1;
    }

    const newMonthStr = `${year}-${String(month).padStart(2, '0')}`;
    setSelectedMonth(newMonthStr);
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  };

  const [currentYear, currentMonth] = selectedMonth.split('-');

  return (
    <header className="header-wrapper">
      <div className="header-top">
        {/* Logo & Brand */}
        <div className="brand-container">
          <div className="brand-logo">
            <span className="logo-sparkle">✦</span>
          </div>
          <div>
            <div className="brand-title-wrap">
              <h1 className="brand-title">FinFlow</h1>
              <span className="brand-badge">6 Jars</span>
            </div>
            <p className="brand-subtitle">Quản lý dòng tiền & Chi tiêu 6 hũ thông minh</p>
          </div>
        </div>

        {/* Month Selector */}
        <div className="month-picker-container">
          <button 
            id="btn-prev-month"
            className="btn btn-secondary btn-icon" 
            onClick={() => handleMonthChange(-1)} 
            title="Tháng trước"
          >
            <ChevronLeft size={18} />
          </button>
          
          <div className="month-display" onClick={handleCurrentMonth} title="Nhấn để về tháng hiện tại">
            <Calendar size={16} className="text-primary-color" />
            <span className="month-text">Tháng {currentMonth} / {currentYear}</span>
          </div>

          <button 
            id="btn-next-month"
            className="btn btn-secondary btn-icon" 
            onClick={() => handleMonthChange(1)} 
            title="Tháng sau"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Action Controls & Cloud Sync */}
        <div className="header-actions">
          {/* Nút Trạng Thái Đám Mây / Đăng nhập */}
          {currentUser ? (
            <div className="cloud-user-badge">
              <Cloud size={15} className={`cloud-icon ${isSyncing ? 'cloud-syncing text-warning' : 'text-success'}`} />
              <span className="user-email-text">{currentUser.email.split('@')[0]}</span>
              <button 
                className="btn-icon-sm text-muted hover-danger"
                onClick={onSignOut}
                title="Đăng xuất khỏi Cloud"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button 
              id="btn-open-cloud-login"
              className="btn btn-secondary btn-sm"
              onClick={onOpenAuthModal}
              title="Đăng nhập để lưu vào Database đám mây, đồng bộ đa thiết bị"
            >
              <Cloud size={16} className="text-primary-color" />
              <span>Đồng bộ Cloud</span>
            </button>
          )}

          <button 
            id="btn-add-transaction"
            className="btn btn-primary" 
            onClick={() => onOpenTxModal()}
          >
            <PlusCircle size={18} />
            <span>Thêm giao dịch</span>
          </button>

          <button 
            id="btn-quick-export"
            className="btn btn-secondary btn-icon" 
            onClick={onExportCsv}
            title="Xuất file Excel CSV"
          >
            <Download size={18} />
          </button>

          <button 
            id="btn-toggle-theme"
            className="btn btn-secondary btn-icon" 
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Chuyển sang Giao diện sáng' : 'Chuyển sang Giao diện tối'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button 
            id="btn-open-settings"
            className="btn btn-secondary btn-icon" 
            onClick={onOpenSettingsModal}
            title="Cài đặt & Sao lưu dữ liệu"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="header-nav">
        <button 
          id="nav-dashboard"
          className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <PieChart size={17} />
          <span>Tổng quan</span>
        </button>

        <button 
          id="nav-transactions"
          className={`nav-tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <ListFilter size={17} />
          <span>Sổ giao dịch</span>
        </button>

        <button 
          id="nav-jars"
          className={`nav-tab ${activeTab === 'jars' ? 'active' : ''}`}
          onClick={() => setActiveTab('jars')}
        >
          <Layers size={17} />
          <span>Hệ thống 6 Hũ</span>
        </button>

        <button 
          id="nav-recurring"
          className={`nav-tab ${activeTab === 'recurring' ? 'active' : ''}`}
          onClick={() => setActiveTab('recurring')}
        >
          <CalendarClock size={17} />
          <span>Khoản chi cố định</span>
        </button>

        <button 
          id="nav-analytics"
          className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={17} />
          <span>Báo cáo & Phân tích</span>
        </button>
      </nav>
    </header>
  );
}
