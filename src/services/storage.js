import { generateDemoData } from '../constants/initialData';

const STORAGE_KEY = 'finflow_6jars_data_v1';

// Đọc dữ liệu từ LocalStorage hoặc khởi tạo dữ liệu mẫu
export function loadFinData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = generateDemoData();
      saveFinData(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu từ LocalStorage:', error);
    const initial = generateDemoData();
    saveFinData(initial);
    return initial;
  }
}

// Gộp thông minh dữ liệu giữa máy cục bộ và đám mây (Smart Merge)
// Ngăn chặn hoàn toàn việc ghi đè xóa mất giao dịch khi người dùng đăng nhập
export function mergeFinancialData(localData, cloudData) {
  if (!cloudData) return localData;
  if (!localData) return cloudData;

  // 1. Transactions: Gộp danh sách giao dịch không trùng lặp theo ID
  const txMap = new Map();

  // Ưu tiên nạp dữ liệu Cloud trước
  (cloudData.transactions || []).forEach(tx => {
    if (tx && tx.id) {
      txMap.set(tx.id, tx);
    }
  });

  // Bổ sung các giao dịch mới từ Local data mà Cloud chưa có
  (localData.transactions || []).forEach(tx => {
    if (tx && tx.id) {
      if (!txMap.has(tx.id)) {
        // Giao dịch mới nhập khi offline / logged out -> Giữ lại!
        txMap.set(tx.id, tx);
      }
    }
  });

  // Sắp xếp lại theo ngày giảm dần (mới nhất lên đầu)
  const mergedTransactions = Array.from(txMap.values()).sort((a, b) => {
    const timeA = a.date ? new Date(a.date).getTime() : 0;
    const timeB = b.date ? new Date(b.date).getTime() : 0;
    return timeB - timeA;
  });

  // 2. Recurring Bills: Hợp nhất theo ID và cập nhật trạng thái thanh toán mới nhất
  const billMap = new Map();
  (cloudData.recurringBills || []).forEach(b => {
    if (b && b.id) billMap.set(b.id, b);
  });
  (localData.recurringBills || []).forEach(b => {
    if (b && b.id) {
      if (!billMap.has(b.id)) {
        billMap.set(b.id, b);
      } else {
        const existing = billMap.get(b.id);
        if (b.lastPaidMonth && (!existing.lastPaidMonth || b.lastPaidMonth > existing.lastPaidMonth)) {
          billMap.set(b.id, { ...existing, lastPaidMonth: b.lastPaidMonth });
        }
      }
    }
  });
  const mergedBills = Array.from(billMap.values());

  // 3. Categories: Hợp nhất danh mục
  const catMap = new Map();
  (cloudData.categories || []).forEach(c => {
    if (c && c.id) catMap.set(c.id, c);
  });
  (localData.categories || []).forEach(c => {
    if (c && c.id && !catMap.has(c.id)) {
      catMap.set(c.id, c);
    }
  });
  const mergedCategories = Array.from(catMap.values());

  // 4. Jars: Ưu tiên Cloud cấu hình, nếu thiếu thì fallback sang local
  const mergedJars = (cloudData.jars && cloudData.jars.length > 0)
    ? cloudData.jars
    : (localData.jars || []);

  // 5. Settings: Hợp nhất settings
  const mergedSettings = {
    ...(localData.settings || {}),
    ...(cloudData.settings || {})
  };

  return {
    jars: mergedJars,
    categories: mergedCategories,
    transactions: mergedTransactions,
    recurringBills: mergedBills,
    settings: mergedSettings
  };
}

// Lưu dữ liệu vào LocalStorage
export function saveFinData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Lỗi khi lưu dữ liệu:', error);
  }
}

// Định dạng tiền tệ tiếng Việt (VD: 1.500.000 ₫)
export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
}

// Định dạng ngày hiển thị (VD: 15/10/2026)
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

// Tính toán số dư và thống kê các hũ
export function computeFinancialStats(data, selectedMonth) {
  const { jars, transactions, recurringBills } = data;

  // Lọc giao dịch theo tháng được chọn (dạng "YYYY-MM") hoặc tất cả nếu rỗng
  const filteredTx = selectedMonth
    ? transactions.filter(t => t.date.startsWith(selectedMonth))
    : transactions;

  let totalIncome = 0;
  let totalSalaryIncome = 0;
  let totalOtherIncome = 0;
  let totalExpense = 0;
  let totalFixedExpense = 0;
  let totalVariableExpense = 0;

  // Khởi tạo bảng thống kê cho từng hũ
  const jarStats = {};
  jars.forEach(jar => {
    jarStats[jar.id] = {
      ...jar,
      incomeAllocated: 0,
      totalSpent: 0,
      transferredIn: 0,
      transferredOut: 0,
      balance: 0,
      budget: jar.defaultBudget || 0,
      effectiveBudget: jar.defaultBudget || 0
    };
  });

  // Tính toán luồng tiền từ các giao dịch
  filteredTx.forEach(tx => {
    const amt = Number(tx.amount) || 0;

    // Nhận diện giao dịch chuyển quỹ nội bộ giữa các hũ
    const isTransfer = tx.categoryId === 'cat-transfer' || 
                       tx.type === 'transfer' || 
                       (tx.id && (tx.id.startsWith('tx-tf-out-') || tx.id.startsWith('tx-tf-in-')));

    if (isTransfer) {
      // Chuyển quỹ nội bộ: Không tính vào Tổng Thu Nhập hay Tổng Chi Tiêu
      const isOut = tx.transferType === 'out' || 
                    (tx.id && tx.id.startsWith('tx-tf-out-')) || 
                    tx.type === 'expense';
      const targetJarId = tx.jarId || (tx.splitJars && tx.splitJars[0]?.jarId);

      if (isOut) {
        if (targetJarId && jarStats[targetJarId]) {
          jarStats[targetJarId].transferredOut += amt;
        }
      } else {
        if (targetJarId && jarStats[targetJarId]) {
          jarStats[targetJarId].transferredIn += amt;
        }
      }
      return;
    }

    if (tx.type === 'income') {
      totalIncome += amt;
      if (tx.categoryId === 'cat-salary') {
        totalSalaryIncome += amt;
      } else {
        totalOtherIncome += amt;
      }
      // Nếu có phân bổ chi tiết theo 6 hũ
      if (tx.splitJars && Array.isArray(tx.splitJars)) {
        tx.splitJars.forEach(s => {
          if (jarStats[s.jarId]) {
            jarStats[s.jarId].incomeAllocated += Number(s.amount) || 0;
          }
        });
      } else {
        // Tự động phân bổ theo tỷ lệ % mặc định của từng hũ
        jars.forEach(j => {
          const alloc = Math.round((amt * (j.percent || 0)) / 100);
          if (jarStats[j.id]) {
            jarStats[j.id].incomeAllocated += alloc;
          }
        });
      }
    } else if (tx.type === 'expense') {
      totalExpense += amt;
      if (tx.isFixed) {
        totalFixedExpense += amt;
      } else {
        totalVariableExpense += amt;
      }

      // Trừ vào hũ tương ứng
      if (tx.jarId && jarStats[tx.jarId]) {
        jarStats[tx.jarId].totalSpent += amt;
      } else if (jarStats['nec']) {
        // Mặc định trừ vào hũ thiết yếu nếu không rõ
        jarStats['nec'].totalSpent += amt;
      }
    }
  });

  // Tính số dư khả dụng và hạn mức hiệu dụng của từng hũ
  Object.keys(jarStats).forEach(id => {
    const jar = jarStats[id];
    // Số dư = (Thu nhập rót vào + Nhận bù từ hũ khác) - (Chi tiêu thực tế + Chuyển đi hỗ trợ hũ khác)
    jar.balance = (jar.incomeAllocated + jar.transferredIn) - (jar.totalSpent + jar.transferredOut);

    // Hạn mức hiệu dụng: Hạn mức cơ sở + Tiền bù vào - Tiền chuyển đi
    jar.effectiveBudget = Math.max(0, jar.budget + jar.transferredIn - jar.transferredOut);

    // Tỷ lệ chi tiêu so với hạn mức khả dụng
    const activeBudget = jar.effectiveBudget > 0 ? jar.effectiveBudget : jar.budget;
    jar.spentPercent = activeBudget > 0
      ? Math.min(Math.round((jar.totalSpent / activeBudget) * 100), 200)
      : (jar.totalSpent > 0 ? 100 : 0);
  });

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Thống kê khoản chi cố định định kỳ
  const currentMonthStr = selectedMonth || new Date().toISOString().slice(0, 7);
  let totalRecurringExpected = 0;
  let totalRecurringPaid = 0;
  let pendingBillsCount = 0;

  const billsWithStatus = recurringBills.map(bill => {
    const isPaid = bill.lastPaidMonth === currentMonthStr;
    const amt = Number(bill.amount) || 0;
    totalRecurringExpected += amt;
    if (isPaid) {
      totalRecurringPaid += amt;
    } else {
      pendingBillsCount += 1;
    }
    return {
      ...bill,
      isPaid
    };
  });

  return {
    totalIncome,
    totalSalaryIncome,
    totalOtherIncome,
    totalExpense,
    totalFixedExpense,
    totalVariableExpense,
    netSavings,
    savingsRate,
    jarStats,
    billsWithStatus,
    totalRecurringExpected,
    totalRecurringPaid,
    pendingBillsCount,
    filteredTransactions: filteredTx
  };
}

// Xuất toàn bộ dữ liệu ra file JSON
export function exportDataToJson(data) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finflow-6jars-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Xuất giao dịch ra file CSV có hỗ trợ UTF-8 BOM hiển thị chuẩn tiếng Việt trên Excel
export function exportTransactionsToCsv(transactions, categories, jars) {
  const catMap = {};
  categories.forEach(c => { catMap[c.id] = c.name; });

  const jarMap = {};
  jars.forEach(j => { jarMap[j.id] = j.name; });

  const headers = ['Mã GD', 'Ngày', 'Loại GD', 'Số tiền (VNĐ)', 'Danh mục', 'Hũ tài chính', 'Tính chất', 'Ghi chú'];
  
  const rows = transactions.map(tx => {
    const isTransfer = tx.categoryId === 'cat-transfer' || 
                       tx.type === 'transfer' || 
                       (tx.id && (tx.id.startsWith('tx-tf-out-') || tx.id.startsWith('tx-tf-in-')));
    let typeLabel = tx.type === 'income' ? 'Thu nhập' : 'Chi tiêu';
    let natureLabel = tx.isFixed ? 'Cố định' : 'Phát sinh';

    if (isTransfer) {
      const isOut = tx.transferType === 'out' || 
                    (tx.id && tx.id.startsWith('tx-tf-out-')) || 
                    tx.type === 'expense';
      typeLabel = isOut ? 'Chuyển quỹ (Đi)' : 'Chuyển quỹ (Đến)';
      natureLabel = 'Điều chuyển';
    }

    const catName = catMap[tx.categoryId] || (isTransfer ? 'Điều chuyển quỹ' : 'Khác');
    const jarName = tx.jarId === 'all' ? 'Tất cả 6 hũ' : (jarMap[tx.jarId] || 'Thiết yếu');
    const cleanNote = (tx.note || '').replace(/"/g, '""');

    return [
      `"${tx.id}"`,
      `"${tx.date}"`,
      `"${typeLabel}"`,
      tx.amount,
      `"${catName}"`,
      `"${jarName}"`,
      `"${natureLabel}"`,
      `"${cleanNote}"`
    ].join(',');
  });

  // UTF-8 BOM
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finflow-giao-dich-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
