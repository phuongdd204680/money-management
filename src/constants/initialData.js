// Cấu hình 6 hũ mặc định và danh mục chi tiêu ban đầu

export const DEFAULT_JARS = [
  {
    id: 'nec',
    name: 'Nhu cầu thiết yếu',
    code: 'NEC',
    percent: 55,
    color: '#3b82f6',
    icon: 'Utensils',
    description: 'Ăn uống, thuê nhà, xăng xe, điện nước, hóa đơn cố định',
    defaultBudget: 15000000
  },
  {
    id: 'ltss',
    name: 'Tiết kiệm dài hạn',
    code: 'LTSS',
    percent: 10,
    color: '#10b981',
    icon: 'PiggyBank',
    description: 'Mua sắm lớn, quỹ dự phòng khẩn cấp, mua nhà/xe',
    defaultBudget: 3000000
  },
  {
    id: 'ffa',
    name: 'Tự do tài chính',
    code: 'FFA',
    percent: 10,
    color: '#f59e0b',
    icon: 'TrendingUp',
    description: 'Đầu tư sinh lời, cổ phiếu, bất động sản, kinh doanh',
    defaultBudget: 3000000
  },
  {
    id: 'edu',
    name: 'Phát triển bản thân',
    code: 'EDU',
    percent: 10,
    color: '#8b5cf6',
    icon: 'GraduationCap',
    description: 'Sách vở, khoá học, rèn luyện kỹ năng cá nhân',
    defaultBudget: 2500000
  },
  {
    id: 'play',
    name: 'Hưởng thụ & Giải trí',
    code: 'PLAY',
    percent: 10,
    color: '#ec4899',
    icon: 'PartyPopper',
    description: 'Du lịch, cafe bạn bè, mua đồ sở thích, xem phim',
    defaultBudget: 2500000
  },
  {
    id: 'give',
    name: 'Cho đi & Từ thiện',
    code: 'GIVE',
    percent: 5,
    color: '#06b6d4',
    icon: 'HeartHandshake',
    description: 'Từ thiện, giúp đỡ người thân, quà cáp hiếu hỷ',
    defaultBudget: 1500000
  }
];

export const DEFAULT_CATEGORIES = [
  // Danh mục chi cố định
  { id: 'cat-rent', name: 'Tiền thuê nhà / Trọ', jarId: 'nec', type: 'expense', isFixed: true, icon: 'Home', color: '#3b82f6' },
  { id: 'cat-bills', name: 'Điện nước sinh hoạt', jarId: 'nec', type: 'expense', isFixed: true, icon: 'Zap', color: '#3b82f6' },
  { id: 'cat-net', name: 'Internet cáp quang', jarId: 'nec', type: 'expense', isFixed: true, icon: 'Wifi', color: '#3b82f6' },
  { id: 'cat-phone', name: 'Cước điện thoại & 4G', jarId: 'nec', type: 'expense', isFixed: true, icon: 'Phone', color: '#3b82f6' },
  { id: 'cat-sub', name: 'Phần mềm / Dịch vụ định kỳ', jarId: 'edu', type: 'expense', isFixed: true, icon: 'CreditCard', color: '#8b5cf6' },

  // Danh mục chi phát sinh / không cố định
  { id: 'cat-food', name: 'Ăn uống & Đi chợ', jarId: 'nec', type: 'expense', isFixed: false, icon: 'ShoppingBag', color: '#3b82f6' },
  { id: 'cat-gas', name: 'Xăng xe & Di chuyển', jarId: 'nec', type: 'expense', isFixed: false, icon: 'Car', color: '#3b82f6' },
  { id: 'cat-med', name: 'Y tế & Thuốc men', jarId: 'nec', type: 'expense', isFixed: false, icon: 'Activity', color: '#3b82f6' },
  { id: 'cat-repairs', name: 'Sửa chữa & Đồ gia dụng', jarId: 'nec', type: 'expense', isFixed: false, icon: 'Wrench', color: '#3b82f6' },
  { id: 'cat-cafe', name: 'Cafe & Gặp gỡ bạn bè', jarId: 'play', type: 'expense', isFixed: false, icon: 'Coffee', color: '#ec4899' },
  { id: 'cat-shopping', name: 'Mua sắm & Sở thích', jarId: 'play', type: 'expense', isFixed: false, icon: 'Gift', color: '#ec4899' },
  { id: 'cat-travel', name: 'Du lịch & Nghỉ dưỡng', jarId: 'play', type: 'expense', isFixed: false, icon: 'Compass', color: '#ec4899' },
  { id: 'cat-books', name: 'Sách & Khóa học', jarId: 'edu', type: 'expense', isFixed: false, icon: 'BookOpen', color: '#8b5cf6' },
  { id: 'cat-invest', name: 'Đầu tư chứng khoán / Quỹ', jarId: 'ffa', type: 'expense', isFixed: false, icon: 'TrendingUp', color: '#f59e0b' },
  { id: 'cat-savings', name: 'Tích lũy quỹ khẩn cấp', jarId: 'ltss', type: 'expense', isFixed: false, icon: 'Shield', color: '#10b981' },
  { id: 'cat-charity', name: 'Từ thiện & Hiếu hỷ', jarId: 'give', type: 'expense', isFixed: false, icon: 'Heart', color: '#06b6d4' },
  { id: 'cat-other-exp', name: 'Chi phí phát sinh khác', jarId: 'nec', type: 'expense', isFixed: false, icon: 'MoreHorizontal', color: '#64748b' },

  // Danh mục thu nhập
  { id: 'cat-salary', name: 'Lương cố định', jarId: 'all', type: 'income', isFixed: true, icon: 'Briefcase', color: '#10b981' },
  { id: 'cat-bonus', name: 'Thưởng & Hoa hồng', jarId: 'all', type: 'income', isFixed: false, icon: 'Award', color: '#10b981' },
  { id: 'cat-freelance', name: 'Làm thêm / Freelance', jarId: 'all', type: 'income', isFixed: false, icon: 'Laptop', color: '#10b981' },
  { id: 'cat-interest', name: 'Lãi đầu tư / Cổ tức', jarId: 'all', type: 'income', isFixed: false, icon: 'DollarSign', color: '#10b981' },
  { id: 'cat-other-inc', name: 'Thu nhập khác', jarId: 'all', type: 'income', isFixed: false, icon: 'PlusCircle', color: '#10b981' }
];

export const DEFAULT_RECURRING_BILLS = [
  {
    id: 'bill-1',
    name: 'Tiền thuê căn hộ / phòng',
    amount: 5500000,
    dueDay: 5,
    cycle: 'monthly',
    categoryId: 'cat-rent',
    jarId: 'nec',
    note: 'Chuyển khoản cho chủ nhà trước ngày 5',
    lastPaidMonth: ''
  },
  {
    id: 'bill-2',
    name: 'Tiền điện nước sinh hoạt',
    amount: 850000,
    dueDay: 10,
    cycle: 'monthly',
    categoryId: 'cat-bills',
    jarId: 'nec',
    note: 'Thanh toán qua ví điện tử',
    lastPaidMonth: ''
  },
  {
    id: 'bill-3',
    name: 'Cước mạng Internet Viettel',
    amount: 250000,
    dueDay: 15,
    cycle: 'monthly',
    categoryId: 'cat-net',
    jarId: 'nec',
    note: 'Gói cáp quang tốc độ cao',
    lastPaidMonth: ''
  },
  {
    id: 'bill-4',
    name: 'Gói 4G điện thoại trả sau',
    amount: 120000,
    dueDay: 20,
    cycle: 'monthly',
    categoryId: 'cat-phone',
    jarId: 'nec',
    note: 'Gói cước data 4GB/ngày',
    lastPaidMonth: ''
  }
];

// Hàm tạo dữ liệu mẫu phong phú phản ánh thực tế
export function generateDemoData() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const currentMonthStr = `${year}-${month}`;

  // Giao dịch mẫu
  const demoTransactions = [
    // Thu nhập đầu tháng tự động chia 6 hũ
    {
      id: 'tx-inc-1',
      type: 'income',
      amount: 26000000,
      date: `${year}-${month}-01`,
      categoryId: 'cat-salary',
      jarId: 'all',
      isFixed: true,
      note: 'Nhận lương tháng ' + (now.getMonth() + 1) + ' từ công ty',
      splitJars: [
        { jarId: 'nec', amount: 14300000 },
        { jarId: 'ltss', amount: 2600000 },
        { jarId: 'ffa', amount: 2600000 },
        { jarId: 'edu', amount: 2600000 },
        { jarId: 'play', amount: 2600000 },
        { jarId: 'give', amount: 1300000 }
      ],
      createdAt: Date.now() - 15 * 86400000
    },
    {
      id: 'tx-inc-2',
      type: 'income',
      amount: 4000000,
      date: `${year}-${month}-12`,
      categoryId: 'cat-freelance',
      jarId: 'all',
      isFixed: false,
      note: 'Thù lao thiết kế website freelance',
      splitJars: [
        { jarId: 'nec', amount: 2200000 },
        { jarId: 'ltss', amount: 400000 },
        { jarId: 'ffa', amount: 400000 },
        { jarId: 'edu', amount: 400000 },
        { jarId: 'play', amount: 400000 },
        { jarId: 'give', amount: 200000 }
      ],
      createdAt: Date.now() - 3 * 86400000
    },

    // Chi tiêu cố định
    {
      id: 'tx-exp-1',
      type: 'expense',
      amount: 5500000,
      date: `${year}-${month}-05`,
      categoryId: 'cat-rent',
      jarId: 'nec',
      isFixed: true,
      note: 'Thanh toán tiền thuê nhà tháng ' + (now.getMonth() + 1),
      createdAt: Date.now() - 11 * 86400000
    },
    {
      id: 'tx-exp-2',
      type: 'expense',
      amount: 820000,
      date: `${year}-${month}-08`,
      categoryId: 'cat-bills',
      jarId: 'nec',
      isFixed: true,
      note: 'Hóa đơn điện nước tháng này',
      createdAt: Date.now() - 8 * 86400000
    },
    {
      id: 'tx-exp-3',
      type: 'expense',
      amount: 250000,
      date: `${year}-${month}-14`,
      categoryId: 'cat-net',
      jarId: 'nec',
      isFixed: true,
      note: 'Cước cáp quang internet',
      createdAt: Date.now() - 2 * 86400000
    },

    // Chi tiêu phát sinh thường ngày
    {
      id: 'tx-exp-4',
      type: 'expense',
      amount: 1450000,
      date: `${year}-${month}-02`,
      categoryId: 'cat-food',
      jarId: 'nec',
      isFixed: false,
      note: 'Đi siêu thị mua thực phẩm tuần 1',
      createdAt: Date.now() - 14 * 86400000
    },
    {
      id: 'tx-exp-5',
      type: 'expense',
      amount: 500000,
      date: `${year}-${month}-03`,
      categoryId: 'cat-gas',
      jarId: 'nec',
      isFixed: false,
      note: 'Đổ xăng ô tô / xe máy',
      createdAt: Date.now() - 13 * 86400000
    },
    {
      id: 'tx-exp-6',
      type: 'expense',
      amount: 320000,
      date: `${year}-${month}-06`,
      categoryId: 'cat-cafe',
      jarId: 'play',
      isFixed: false,
      note: 'Cafe họp nhóm cuối tuần tại Highlands',
      createdAt: Date.now() - 10 * 86400000
    },
    {
      id: 'tx-exp-7',
      type: 'expense',
      amount: 650000,
      date: `${year}-${month}-09`,
      categoryId: 'cat-books',
      jarId: 'edu',
      isFixed: false,
      note: 'Mua sách tài chính & khóa học tiếng Anh',
      createdAt: Date.now() - 7 * 86400000
    },
    {
      id: 'tx-exp-8',
      type: 'expense',
      amount: 2500000,
      date: `${year}-${month}-10`,
      categoryId: 'cat-invest',
      jarId: 'ffa',
      isFixed: false,
      note: 'Mua chứng chỉ quỹ DCDS định kỳ',
      createdAt: Date.now() - 6 * 86400000
    },
    {
      id: 'tx-exp-9',
      type: 'expense',
      amount: 1800000,
      date: `${year}-${month}-11`,
      categoryId: 'cat-savings',
      jarId: 'ltss',
      isFixed: false,
      note: 'Gửi tiết kiệm online kỳ hạn 6 tháng',
      createdAt: Date.now() - 5 * 86400000
    },
    {
      id: 'tx-exp-10',
      type: 'expense',
      amount: 500000,
      date: `${year}-${month}-13`,
      categoryId: 'cat-charity',
      jarId: 'give',
      isFixed: false,
      note: 'Ủng hộ quỹ khuyến học địa phương',
      createdAt: Date.now() - 3 * 86400000
    },
    {
      id: 'tx-exp-11',
      type: 'expense',
      amount: 890000,
      date: `${year}-${month}-14`,
      categoryId: 'cat-shopping',
      jarId: 'play',
      isFixed: false,
      note: 'Mua áo sơ mi mới cho công việc',
      createdAt: Date.now() - 2 * 86400000
    }
  ];

  const updatedBills = DEFAULT_RECURRING_BILLS.map(bill => {
    // Đánh dấu bill 1 và 2 đã đóng trong tháng
    if (bill.id === 'bill-1' || bill.id === 'bill-2') {
      return { ...bill, lastPaidMonth: currentMonthStr };
    }
    return bill;
  });

  return {
    jars: DEFAULT_JARS,
    categories: DEFAULT_CATEGORIES,
    transactions: demoTransactions,
    recurringBills: updatedBills,
    settings: {
      currency: 'VND',
      monthlyIncomeTarget: 30000000,
      theme: 'dark'
    }
  };
}
