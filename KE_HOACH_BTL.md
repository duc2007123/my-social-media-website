# KẾ HOẠCH BÀI TẬP LỚN CUỐI KỲ - LẬP TRÌNH WEB (ĐỀ TÀI 5: NHẬT KÝ DU LỊCH)

- **Thời gian thực hiện:** 2 tuần (14 ngày)
- **Quy mô nhóm:** 3 thành viên
- **Công nghệ:** React (Vite, Tailwind CSS, React Router, Redux Toolkit), Node.js, Express, MongoDB (Mongoose), JWT, bcrypt.

---

## PHẦN 1: GIẢI ĐÁP CÁC THẮC MẮC CHÍNH

### 1. "Bình luận 1 cấp" là gì?
Giống như bình luận trên Facebook hoặc YouTube:
- **Cấp 0 (Gốc):** Người dùng A đăng bài, người dùng B vào bình luận: *"Ảnh đẹp quá!"* (`parentId = null`).
- **Cấp 1 (Trả lời):** Chủ bài viết hoặc người khác bấm **Trả lời** ngay dưới bình luận của B: *"Cảm ơn bạn nhé!"* (`parentId = ID_của_bình_luận_gốc`).
- **Không có cấp 2, 3:** Dưới câu trả lời đó không được thụt dòng sâu thêm nữa. Tất cả các phản hồi đều nằm ở cấp 1 tính từ bình luận gốc.

### 2. Mới học xong Part 2 FSO có làm được không?
Part 2 cung cấp nền tảng Frontend (React, Component, Props, State, Axios gọi API). 
Phần Backend (NodeJS, Express, MongoDB, JWT, Testing) sẽ theo các mẫu chuẩn (boilerplate). Nhóm trưởng và các thành viên sẽ sử dụng khung chuẩn sẵn, chỉ cần nắm logic cơ bản là code được.

---

## PHẦN 2: BẢNG PHÂN CHIA CÔNG VIỆC (50% - 25% - 25%)

### 👤 Thành viên 1 (Nhóm trưởng - 50% khối lượng)
*Phụ trách kiến trúc cốt lõi, hệ thống Bài viết (Post), Bảng tin (Feed) và bảo mật dữ liệu.*
1. **Khung dự án & Cấu hình:** Khởi tạo thư mục `client` và `server`, cấu hình Tailwind CSS, React Router (Nested Routes, Protected Route), kết nối MongoDB Atlas, middleware bắt lỗi (`errorHandler`).
2. **Backend - Bài viết & Phân quyền:**
   - Post Model & CRUD API (tiêu đề, nội dung, max 6 ảnh, ngày đi, chi phí, chế độ Công khai / Chỉ người theo dõi).
   - Logic bảo mật: Chặn tuyệt đối bài "Chỉ người theo dõi" trả về cho người không theo dõi (dù gọi thẳng API).
   - API Bảng tin có phân trang server (`page`, `limit`) và API Thích/Bỏ thích (chống like trùng lặp).
3. **Frontend - Giao diện cốt lõi:**
   - Bảng tin với **Cuộn vô hạn (Infinite Scroll)** dùng `IntersectionObserver`.
   - Nút Like với cơ chế **Optimistic Update** (cập nhật giao diện ngay lập tức).
   - Form đăng/sửa bài viết có xem trước ảnh (`URL.createObjectURL`).

---

### 👤 Thành viên 2 (25% khối lượng)
*Phụ trách Xác thực người dùng (Auth), Trang cá nhân (Profile), Theo dõi (Follow) và Bình luận (Comment).*
1. **Backend - User & Comment:**
   - User Model: Đăng ký, đăng nhập JWT, mã hóa mật khẩu `bcrypt`, middleware xác thực token.
   - Comment Model: CRUD bình luận hỗ trợ **trả lời 1 cấp** (`parentId`).
   - API Follow / Unfollow người dùng (`POST /api/users/:id/follow`).
2. **Frontend - Giao diện & State:**
   - Auth Context (`user`, `token`, lưu `localStorage`, đăng nhập/đăng xuất).
   - Trang Đăng nhập & Đăng ký (controlled form + validate lỗi).
   - Trang cá nhân (Profile): Nút Follow, danh sách bài viết của user, modal sửa thông tin cá nhân.
   - Giao diện Bình luận và Trả lời bình luận 1 cấp.
   - Viết 2 Custom Hook: `useFetch` và `useDebounce`.

---

### 👤 Thành viên 3 (25% khối lượng)
*Phụ trách Thông báo (Notification), Quản trị Admin, Thống kê và Redux Toolkit.*
1. **Backend - Notification, Report & Admin:**
   - Notification Model: Lưu thông báo khi có người like, comment, follow; API đánh dấu đã đọc.
   - Report Model: API báo cáo bài viết vi phạm.
   - Admin API (yêu cầu quyền admin): Xóa bài bị báo cáo, khóa/mở khóa tài khoản user.
   - **Thống kê MongoDB Aggregation Pipeline:** Thống kê top địa điểm du lịch được nhắc đến nhiều nhất.
2. **Frontend - Redux & Admin UI:**
   - Redux Toolkit store quản lý thông báo.
   - Chuông thông báo trên Navbar với cơ chế **Polling tự động 30 giây** lấy số thông báo chưa đọc.
   - Giao diện Admin Dashboard: Duyệt bài báo cáo, quản lý user, hiển thị thống kê địa điểm du lịch.

---

## PHẦN 3: LỘ TRÌNH 14 NGÀY NƯỚC RÚT

- **Ngày 1 – 3:** Khởi tạo repo, kết nối DB, dựng Auth Backend & Frontend cơ bản, file `seed.js` tạo dữ liệu mẫu.
- **Ngày 4 – 8:** Xây dựng tính năng cốt lõi (API bài viết, upload ảnh, like, comment 1 cấp, trang profile).
- **Ngày 9 – 11:** Hoàn thiện điểm nhấn kỹ thuật (Infinite Scroll, Optimistic Update, Redux Polling thông báo, Admin Dashboard & Aggregation Pipeline).
- **Ngày 12 – 14:** Viết Test mẫu, deploy thử nghiệm lên Render/Vercel, soạn thảo Báo cáo PDF (tối đa 20 trang) và quay Video Demo 5-10 phút.
