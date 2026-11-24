import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/travel_journal';
  
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000 // 5 seconds timeout
    });
    console.log(`[MongoDB Atlas] Kết nối thành công tới Database: ${conn.connection.name} (${conn.connection.host})`);
    return true;
  } catch (error) {
    console.warn(`[MongoDB Atlas] Cảnh báo: Chưa thể kết nối tới MongoDB (${error.message}).`);
    console.warn(`[Gợi ý] Hãy kiểm tra chuỗi kết nối MONGO_URI trong server/.env (ví dụ: mongodb+srv://<user>:<password>@cluster0.../travel_journal)`);
    console.log(`[Hệ thống] Chế độ lưu trữ dự phòng tự động kích hoạt để server tiếp tục hoạt động.`);
    return false;
  }
};
