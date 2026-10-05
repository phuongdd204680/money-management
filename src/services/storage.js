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
      balance: 0,
      budget: jar.defaultBudget || 0
    };
  });

  // Tính toán luồng tiền từ các giao dịch
  filteredTx.forEach(tx => {
    const amt = Number(tx.amount) || 0;
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

  // Tính số dư khả dụng của từng hũ
  Object.keys(jarStats).forEach(id => {
    jarStats[id].balance = jarStats[id].incomeAllocated - jarStats[id].totalSpent;
    jarStats[id].spentPercent = jarStats[id].budget > 0
      ? Math.min(Math.round((jarStats[id].totalSpent / jarStats[id].budget) * 100), 200)
      : 0;
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
    const typeLabel = tx.type === 'income' ? 'Thu nhập' : 'Chi tiêu';
    const natureLabel = tx.isFixed ? 'Cố định' : 'Phát sinh';
    const catName = catMap[tx.categoryId] || 'Khác';
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
