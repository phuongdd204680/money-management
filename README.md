# FinFlow 6 Jars - Quản Lý Chi Tiêu & Dòng Tiền 6 Hũ Thông Minh

Ứng dụng web hiện đại giúp bạn quản lý dòng tiền cá nhân và ghi chép chi tiêu theo phương pháp 6 hũ tài chính (J. Harv Eker), phân loại chi phí cố định vs phát sinh, cảnh báo hạn mức ngân sách và sao lưu dữ liệu an toàn ngay trên trình duyệt.

---

## 🌟 Tính Năng Nổi Bật

### 1. Hệ Thống 6 Hũ Tài Chính (6 Jars)
- **NEC (55%)**: Nhu cầu thiết yếu (Ăn uống, thuê nhà, điện nước, xăng xe, hóa đơn cố định).
- **LTSS (10%)**: Tiết kiệm dài hạn (Mua sắm lớn, quỹ dự phòng khẩn cấp).
- **FFA (10%)**: Tự do tài chính (Đầu tư chứng khoán, bất động sản, sinh lời).
- **EDU (10%)**: Phát triển bản thân (Sách vở, khóa học, nâng cao kỹ năng).
- **PLAY (10%)**: Hưởng thụ & Giải trí (Du lịch, cafe bạn bè, mua sắm sở thích).
- **GIVE (5%)**: Cho đi & Từ thiện (Hiếu hỷ, giúp đỡ người thân).
- **Tự động phân bổ thu nhập**: Khi nhập thu nhập, ứng dụng tự động tính số tiền chuyển vào 6 hũ theo tỷ lệ %, có chế độ xem trước trực quan.
- **Tùy biến linh hoạt**: Tự do điều chỉnh tỷ lệ % của các hũ (kiểm tra tổng 100%), thiết lập hạn mức ngân sách tháng cho từng hũ.
- **Chuyển tiền giữa các hũ (Rebalance)**: Bù trừ khi có hũ chi vượt định mức.

### 2. Phân Loại Chi Tiêu: Cố Định Định Kỳ vs Phát Sinh Đột Xuất
- **Chi cố định định kỳ**: Tiền nhà, điện nước, internet, cước 4G, phí dịch vụ...
- **Chi phát sinh / Đột xuất**: Ăn uống hàng ngày, cafe, xăng xe, mua sắm, sửa xe, y tế...
- **Biểu đồ tỷ lệ**: Trực quan hóa tỷ lệ phần trăm giữa chi phí cố định và chi phí phát sinh.

### 3. Quản Lý Khoản Chi Cố Định & Nhắc Hẹn (Recurring Bills)
- Quản lý danh sách hoá đơn theo ngày đến hạn hàng tháng (VD: Ngày 5 tiền nhà, ngày 10 tiền điện...).
- Cảnh báo khoản chi sắp tới hạn hoặc quá hạn.
- **Xác nhận thanh toán 1-chạm**: Tự động sinh giao dịch chi tiêu cố định tương ứng và trừ vào hũ tài chính.

### 4. Báo Cáo & Phân Tích Dòng Tiền (Analytics)
- Biểu đồ Donut SVG tương tác mượt mà thể hiện cơ cấu chi tiêu 6 hũ.
- Thống kê tỷ lệ tích lũy dòng tiền ròng (% tiết kiệm được so với thu nhập).
- Top 6 danh mục chi tiêu tốn kém nhất trong tháng.

### 5. Cơ Sở Dữ Liệu Đám Mây & Đồng Bộ Đa Thiết Bị (Supabase)
- **PostgreSQL Cloud miễn phí**: Dữ liệu được lưu vĩnh viễn trên đám mây, không sợ bị mất khi xoá cache trình duyệt hoặc đổi máy tính/điện thoại.
- **Xác thực tài khoản (Auth)**: Hỗ trợ Đăng ký / Đăng nhập bằng Email & Mật khẩu.
- **Cơ chế Hybrid thông minh**: 
  - Vẫn hoạt động trơn tru với LocalStorage khi chưa đăng nhập.
  - Tự động đồng bộ 2 chiều lên Supabase Cloud Database ngay khi bạn đăng nhập!
- **Bảo mật Row Level Security (RLS)**: Đảm bảo dữ liệu riêng tư, mỗi người chỉ xem và chỉnh sửa dữ liệu của chính mình.
- Xuất/nhập dự phòng JSON & file Excel (CSV) bất kỳ lúc nào.

---

## ⚡ Hướng Dẫn Kết Nối Supabase (3 Bước Đơn Giản)

1. Đăng ký tài khoản miễn phí tại [supabase.com](https://supabase.com) và tạo 1 Project mới.
2. Mở mục **SQL Editor** trên Supabase, dán nội dung trong file [supabase_schema.sql](file:///f:/lungtung/money-management/supabase_schema.sql) và bấm **Run**.
3. Mở ứng dụng FinFlow (tại `http://localhost:5173/`), bấm nút **"Đồng bộ Cloud"** trên góc phải:
   - Chọn tab **"Kết Nối Supabase"**, dán **Project URL** và **Anon Key** (lấy trong Project Settings > API) rồi bấm **Lưu & Kích Hoạt**.
   - Chuyển sang tab **"Đăng Ký"** để tạo tài khoản và bắt đầu đồng bộ mọi thiết bị!

---

## 🚀 Hướng Dẫn Chạy Ứng Dụng

Ứng dụng đang được bật tại:
- **Địa chỉ truy cập**: `http://localhost:5173/`

### Lệnh chạy thủ công (nếu cần khởi động lại):
```bash
# Cài đặt thư viện
npm install

# Khởi động dev server
npm run dev
```

---

## 🛠️ Công Nghệ Sử Dụng
- **React 18** + **Vite 5**
- **Vanilla CSS Design System**: Tùy biến Dark Mode & Light Mode, Glassmorphism, phong cách Fintech hiện đại.
- **Lucide React Icons**: Bộ biểu tượng trực quan, sinh động.
- **Canvas Confetti**: Hiệu ứng chúc mừng khi nhận thu nhập và hoàn thành mục tiêu.
