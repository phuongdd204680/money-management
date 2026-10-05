import React, { useState, useEffect, useMemo, useRef } from 'react';
import './App.css';

import { 
  loadFinData, 
  saveFinData, 
  computeFinancialStats, 
  exportTransactionsToCsv 
} from './services/storage';
import { generateDemoData, DEFAULT_JARS, DEFAULT_CATEGORIES } from './constants/initialData';

import { 
  getCurrentUser, 
  subscribeToAuth, 
  signOut, 
  fetchCloudData, 
  syncCloudData,
  isSupabaseConfigured
} from './services/supabase';

import Header from './components/Header';
import DashboardView from './components/DashboardView';
import TransactionsView from './components/TransactionsView';
import JarsManagementView from './components/JarsManagementView';
import RecurringBillsView from './components/RecurringBillsView';
import AnalyticsView from './components/AnalyticsView';
import TransactionModal from './components/TransactionModal';
import SettingsModal from './components/SettingsModal';
import AuthModal from './components/AuthModal';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  // Dữ liệu ứng dụng
  const [data, setData] = useState(() => loadFinData());

  // Trạng thái tài khoản người dùng đám mây
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Tham chiếu để tránh loop đồng bộ
  const isCloudLoading = useRef(false);

  // Lắng nghe trạng thái đăng nhập Supabase
  useEffect(() => {
    getCurrentUser().then(user => {
      if (user) {
        handleUserLoggedIn(user);
      }
    });

    const unsubscribe = subscribeToAuth(user => {
      if (user) {
        handleUserLoggedIn(user);
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Xử lý khi người dùng đăng nhập thành công
  const handleUserLoggedIn = async (user) => {
    setCurrentUser(user);
    isCloudLoading.current = true;
    setIsSyncing(true);

    try {
      const cloudData = await fetchCloudData(user.id);
      if (cloudData && cloudData.jars && cloudData.transactions) {
        // Có dữ liệu trên Cloud -> nạp vào ứng dụng
        setData(cloudData);
        saveFinData(cloudData);
      } else {
        // Tài khoản mới chưa có dữ liệu trên Cloud -> Tải dữ liệu hiện tại lên Cloud
        await syncCloudData(user.id, data);
      }
    } catch (err) {
      console.error('Lỗi nạp dữ liệu đám mây:', err);
    } finally {
      setIsSyncing(false);
      setTimeout(() => {
        isCloudLoading.current = false;
      }, 500);
    }
  };

  // Đăng xuất khỏi Cloud
  const handleSignOut = async () => {
    if (window.confirm('Bạn có muốn đăng xuất khỏi tài khoản Cloud? Dữ liệu trên máy sẽ tiếp tục được lưu vào LocalStorage.')) {
      await signOut();
      setCurrentUser(null);
    }
  };

  // Lưu trữ dữ liệu mỗi khi state data thay đổi:
  // 1. Luôn lưu vào LocalStorage (offline cache)
  // 2. Nếu đã đăng nhập, tự động đồng bộ lên Supabase Cloud Database!
  useEffect(() => {
    saveFinData(data);

    if (currentUser && !isCloudLoading.current) {
      setIsSyncing(true);
      const timer = setTimeout(() => {
        syncCloudData(currentUser.id, data).finally(() => {
          setIsSyncing(false);
        });
      }, 800); // Debounce 800ms để giảm tần suất gửi API khi gõ nhanh

      return () => clearTimeout(timer);
    }
  }, [data, currentUser]);

  // Thiết lập theme (Dark / Light)
  const [theme, setTheme] = useState(() => {
    return data.settings?.theme || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    setData(prev => ({
      ...prev,
      settings: { ...prev.settings, theme: nextTheme }
    }));
  };

  // Tháng đang chọn ("YYYY-MM"), mặc định tháng hiện tại
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Tab đang hoạt động
  const [activeTab, setActiveTab] = useState('dashboard');

  // Modal Giao Dịch
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalOptions, setTxModalOptions] = useState({});
  const [editingTx, setEditingTx] = useState(null);

  // Modal Cài Đặt
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Tính toán số liệu tài chính theo tháng đã chọn
  const stats = useMemo(() => {
    return computeFinancialStats(data, selectedMonth);
  }, [data, selectedMonth]);

  // Thao tác: Mở modal thêm giao dịch
  const handleOpenTxModal = (opts = {}) => {
    setEditingTx(null);
    setTxModalOptions(opts);
    setIsTxModalOpen(true);
  };

  // Thao tác: Mở modal sửa giao dịch
  const handleEditTx = (tx) => {
    setEditingTx(tx);
    setTxModalOptions({});
    setIsTxModalOpen(true);
  };

  // Lưu giao dịch (Thêm mới hoặc Cập nhật)
  const handleSaveTransaction = (tx) => {
    setData(prev => {
      const exists = prev.transactions.some(t => t.id === tx.id);
      let updatedTransactions;
      if (exists) {
        updatedTransactions = prev.transactions.map(t => t.id === tx.id ? tx : t);
      } else {
        updatedTransactions = [tx, ...prev.transactions];
      }
      return {
        ...prev,
        transactions: updatedTransactions
      };
    });
  };

  // Xóa giao dịch
  const handleDeleteTransaction = (txId) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== txId)
    }));
  };

  // Xác nhận đã thanh toán hóa đơn cố định
  const handlePayBill = (bill) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const newTx = {
      id: `tx-bill-${bill.id}-${Date.now()}`,
      type: 'expense',
      amount: bill.amount,
      date: todayStr,
      categoryId: bill.categoryId,
      jarId: bill.jarId,
      isFixed: true,
      note: `Thanh toán: ${bill.name} (Hóa đơn cố định)`,
      createdAt: Date.now()
    };

    setData(prev => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
      recurringBills: prev.recurringBills.map(b => 
        b.id === bill.id ? { ...b, lastPaidMonth: selectedMonth } : b
      )
    }));
  };

  // Hoàn tác thanh toán hoá đơn
  const handleUnpayBill = (billId) => {
    setData(prev => ({
      ...prev,
      recurringBills: prev.recurringBills.map(b => 
        b.id === billId ? { ...b, lastPaidMonth: '' } : b
      )
    }));
  };

  // Thêm khoản chi cố định mới
  const handleAddBill = (newBill) => {
    setData(prev => ({
      ...prev,
      recurringBills: [...prev.recurringBills, newBill]
    }));
  };

  // Xóa khoản chi cố định
  const handleDeleteBill = (billId) => {
    setData(prev => ({
      ...prev,
      recurringBills: prev.recurringBills.filter(b => b.id !== billId)
    }));
  };

  // Cập nhật cấu hình 6 Hũ (Tỷ lệ %, Ngân sách)
  const handleUpdateJars = (updatedJars) => {
    setData(prev => ({
      ...prev,
      jars: updatedJars
    }));
  };

  // Cập nhật mục tiêu thu nhập hàng tháng
  const handleUpdateIncomeTarget = (newTarget) => {
    setData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        monthlyIncomeTarget: newTarget
      }
    }));
  };

  // Nạp nhanh thu nhập định kỳ vào tháng đang chọn và tự động chia 6 hũ
  const handleQuickAllocateIncome = (amt) => {
    if (!amt || amt <= 0) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    const splits = data.jars.map(j => ({
      jarId: j.id,
      amount: Math.round((amt * (j.percent || 0)) / 100)
    }));

    const newTx = {
      id: `tx-inc-${Date.now()}`,
      type: 'income',
      amount: amt,
      date: todayStr,
      categoryId: 'cat-salary',
      jarId: 'all',
      isFixed: true,
      note: `Thu nhập định kỳ tháng ${selectedMonth.split('-')[1]}`,
      splitJars: splits,
      createdAt: Date.now()
    };

    handleSaveTransaction(newTx);
    alert(`Đã nạp thành công ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amt)} và tự động chia vào 6 hũ cho tháng này!`);
  };

  // Thêm danh mục mới
  const handleAddCategory = (newCat) => {
    setData(prev => ({
      ...prev,
      categories: [...prev.categories, newCat]
    }));
  };

  // Xóa danh mục
  const handleDeleteCategory = (catId) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== catId)
    }));
  };

  // Xuất file CSV
  const handleExportCsv = () => {
    exportTransactionsToCsv(stats.filteredTransactions, data.categories, data.jars);
  };

  // Nạp lại dữ liệu mẫu Demo
  const handleLoadDemo = () => {
    const demo = generateDemoData();
    setData(demo);
  };

  // Xóa trắng dữ liệu (Reset)
  const handleResetData = () => {
    const emptyData = {
      jars: DEFAULT_JARS,
      categories: DEFAULT_CATEGORIES,
      transactions: [],
      recurringBills: [],
      settings: {
        currency: 'VND',
        monthlyIncomeTarget: 0,
        theme
      }
    };
    setData(emptyData);
  };

  // Khôi phục dữ liệu từ JSON tải lên
  const handleImportData = (importedData) => {
    setData(importedData);
  };

  return (
    <div className="app-container">
      {/* 1. Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenTxModal={handleOpenTxModal}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onExportCsv={handleExportCsv}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        isSyncing={isSyncing}
      />

      {/* 2. Main Content Views */}
      <ErrorBoundary key={activeTab} onReset={() => setActiveTab('dashboard')}>
        <main className="main-content">
          {activeTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              data={data}
              onOpenTxModal={handleOpenTxModal}
              setActiveTab={setActiveTab}
              onPayBill={handlePayBill}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              transactions={stats.filteredTransactions}
              categories={data.categories}
              jars={data.jars}
              onOpenTxModal={handleOpenTxModal}
              onEditTransaction={handleEditTx}
              onDeleteTransaction={handleDeleteTransaction}
              onExportCsv={handleExportCsv}
            />
          )}

          {activeTab === 'jars' && (
            <JarsManagementView
              jars={data.jars}
              stats={stats}
              monthlyIncomeTarget={data.settings?.monthlyIncomeTarget || 25000000}
              onUpdateJars={handleUpdateJars}
              onUpdateIncomeTarget={handleUpdateIncomeTarget}
              onOpenTxModal={handleOpenTxModal}
              onQuickAllocateIncome={handleQuickAllocateIncome}
            />
          )}

          {activeTab === 'recurring' && (
            <RecurringBillsView
              bills={stats.billsWithStatus}
              selectedMonth={selectedMonth}
              categories={data.categories}
              jars={data.jars}
              onPayBill={handlePayBill}
              onUnpayBill={handleUnpayBill}
              onAddBill={handleAddBill}
              onDeleteBill={handleDeleteBill}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              stats={stats}
              data={data}
            />
          )}
        </main>
      </ErrorBoundary>

      {/* 3. Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        data={data}
        onSaveTransaction={handleSaveTransaction}
        editingTx={editingTx}
        initialOptions={txModalOptions}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        data={data}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
        onResetData={handleResetData}
        onLoadDemo={handleLoadDemo}
        onImportData={handleImportData}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={handleUserLoggedIn}
      />
    </div>
  );
}
