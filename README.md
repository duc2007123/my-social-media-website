# TravelGram - Mạng Xã Hội Nhật Ký Du Lịch
### BÀI TẬP LỚN CUỐI KỲ MÔN LẬP TRÌNH WEB (ĐỀ TÀI 5)

Dự án ứng dụng web full-stack chia sẻ trải nghiệm du lịch, kết nối cộng đồng yêu xê dịch, khám phá các địa điểm check-in hấp dẫn tại Việt Nam và tương tác theo dõi thời gian thực.

---

## 1. CÔNG NGHỆ SỬ DỤNG

* **Frontend (`/client`):**
  * React 19 + Vite
  * Tailwind CSS v4 (Giao diện hiện đại, responsive trên cả máy tính & điện thoại)
  * React Router v7 (Nested routes, dynamic routes + `useParams`, Protected routes, 404 page)
  * Redux Toolkit (Quản lý trạng thái thông báo)
  * Context API (Auth Context quản lý phiên đăng nhập)
  * Leaflet & OpenStreetMap (Bản đồ tương tác tọa độ du lịch)
  * Socket.IO Client (Nhận thông báo và tương tác thời gian thực)
  * Lucide React Icons
* **Backend (`/server`):**
  * Node.js + Express
  * MongoDB + Mongoose (Thiết kế Schema có tham chiếu `_id`, CRUD, Aggregation Pipeline)
  * Multer (Xử lý upload tối đa 6 ảnh, validate định dạng & dung lượng file)
  * JWT (JSON Web Token) & bcryptjs (Mã hóa mật khẩu bảo mật)
  * Socket.IO Server (Websocket real-time)

---

## 2. HƯỚNG DẪN CÀI ĐẶT VÀ KHỞI CHẠY

### Bước 1: Khởi chạy Backend Server
```bash
cd server
npm install
# Tạo dữ liệu mẫu khởi đầu (Users, Posts, Comments, Follow relationships)
npm run seed
# Khởi chạy server development
npm run dev
```
* Backend chạy tại: `http://localhost:5000`

### Bước 2: Khởi chạy Frontend Client
Mở terminal thứ hai:
```bash
cd client
npm install
npm run dev
```
* Frontend chạy tại: `http://localhost:5173`

---

## 3. TÀI KHOẢN DEMO SẴN TRONG CƠ SỞ DỮ LIỆU

Sau khi chạy lệnh `npm run seed`, hệ thống đã có sẵn các tài khoản demo sau:

| Vai trò | Email đăng nhập | Tên người dùng | Mật khẩu | Mô tả vai trò |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@travel.com` | `admin` | `admin123` | Quản trị viên: Quản lý và khóa tài khoản, xem thống kê địa điểm |
| **Thành viên** | `nam@travel.com` | `hoangnam_traveler` | `123456` | Tác giả bài viết du lịch Hà Giang, Đà Lạt (đang follow Linh, Hoàng) |
| **Thành viên** | `linh@travel.com` | `khanhlinh_wander` | `123456` | Tác giả bài viết Phú Quốc, Ninh Bình (đang follow Nam) |
| **Thành viên** | `hoang@travel.com` | `hoang_backpacker` | `123456` | Tác giả bài viết Đà Nẵng Hội An |

---

## 4. CÁC TÍNH NĂNG VÀ ĐIỂM NHẤN KỸ THUẬT (ĐỀ TÀI 5)

1. **Bảng tin cuộn vô hạn (Infinite Scroll):** Phân trang từ server kết hợp `IntersectionObserver` ở client với đầy đủ cơ chế dọn dẹp listener (cleanup) khi unmount.
2. **Nút Thích Optimistic Update:** Cập nhật ngay lập tức giao diện (+1 lượt thích), nếu gọi API thất bại sẽ tự động hoàn tác (rollback). Server có cơ chế chống 1 người thích 2 lần.
3. **Bảo mật bài viết "Chỉ người theo dõi":** Kiểm tra quyền sở hữu và quan hệ follow ngay tại cấp độ API Backend. Người ngoài chưa follow tuyệt đối không lấy được dữ liệu dù gọi trực tiếp API `GET /api/posts/:id`.
4. **Form đăng/sửa bài viết đính kèm tối đa 6 ảnh:** Xem trước ảnh tức thì bằng `URL.createObjectURL` và tự động thu hồi `URL.revokeObjectURL` khi người dùng xóa ảnh để giải phóng bộ nhớ. Kiểm tra định dạng ảnh và dung lượng $\le$ 5MB tại server.
5. **Thống kê Top địa điểm bằng MongoDB Aggregation Pipeline:** Nhóm theo địa điểm, tính tổng số bài viết, tổng lượt thích và chi phí trung bình.
6. **Bản đồ tương tác Leaflet:** Đánh dấu các tọa độ địa điểm check-in tại Việt Nam kèm popup thông tin chi tiết.
7. **Bình luận và trả lời lồng nhau 1 cấp:** Hỗ trợ thảo luận đa chiều ngay dưới bài viết.
8. **Thuật toán gợi ý người nên theo dõi:** Tự động đề xuất người dùng dựa trên các địa điểm du lịch cùng từng ghé thăm hoặc số lượng bạn chung.
9. **Tương tác Real-time với Socket.IO:** Nhận thông báo tức thì khi có người thích, bình luận hoặc theo dõi.
