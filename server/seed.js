import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Post from './models/Post.js';
import Comment from './models/Comment.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/travel_journal');
    console.log('[Seed] Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});
    console.log('[Seed] Cleared old collections');

    const salt = await bcrypt.genSalt(10);
    const hashPassword = (pw) => bcrypt.hashSync(pw, salt);

    // 1. Create Users
    const users = await User.create([
      {
        name: 'Quản Trị Viên',
        username: 'admin',
        email: 'admin@travel.com',
        password: hashPassword('admin123'),
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        bio: 'Hệ thống Quản trị Nhật ký Du lịch TravelGram.'
      },
      {
        name: 'Hoàng Nam',
        username: 'hoangnam_traveler',
        email: 'nam@travel.com',
        password: hashPassword('123456'),
        role: 'member',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        bio: 'Kẻ mê xê dịch, thích ngắm bình minh trên các cung đèo Tây Bắc 🌄.'
      },
      {
        name: 'Khánh Linh',
        username: 'khanhlinh_wander',
        email: 'linh@travel.com',
        password: hashPassword('123456'),
        role: 'member',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
        bio: 'Foodie & Travel Blogger. Tìm kiếm quán cà phê chill và biển xanh cát trắng 🏝️.'
      },
      {
        name: 'Minh Hoàng',
        username: 'hoang_backpacker',
        email: 'hoang@travel.com',
        password: hashPassword('123456'),
        role: 'member',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        bio: 'Nhiếp ảnh gia nghiệp dư. Đam mê săn mây và cắm trại ngoài trời ⛺.'
      }
    ]);

    const [admin, nam, linh, hoang] = users;

    // Follow relationships: Nam follows Linh and Hoang; Linh follows Nam
    nam.following.push(linh._id, hoang._id);
    linh.followers.push(nam._id);
    hoang.followers.push(nam._id);

    linh.following.push(nam._id);
    nam.followers.push(linh._id);

    await nam.save();
    await linh.save();
    await hoang.save();
    console.log('[Seed] Users and Follow relationships created');

    // 2. Create Posts
    const posts = await Post.create([
      {
        title: 'Chinh phục Mã Pí Lèng - 3 ngày 2 đêm săn mây Hà Giang',
        content: 'Chuyến đi Hà Giang mùa tam giác mạch thật tuyệt vời! Đèo Mã Pí Lèng hùng vĩ với dòng sông Nho Quế xanh như ngọc bích. Đường cua tay áo khá dốc nhưng cảnh đẹp mê mẩn lòng người. Khuyên mọi người nên đi thuyền trên sông Nho Quế và thử món thắng dền nóng hổi. #hagiang #mapileng #travel #vietnam',
        images: [
          'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80'
        ],
        location: 'Hà Giang',
        coordinates: { lat: 22.8233, lng: 104.9839 },
        travelDate: new Date('2026-10-15'),
        cost: 3200000,
        visibility: 'public',
        author: nam._id,
        likes: [linh._id, hoang._id],
        hashtags: ['hagiang', 'mapileng', 'travel', 'vietnam']
      },
      {
        title: 'Phú Quốc hoàng hôn bãi Sao - Kỳ nghỉ chill cùng hội bạn thân',
        content: 'Hoàng hôn Phú Quốc chưa bao giờ làm mình thất vọng. Biển trong vắt nhìn thấy cả sao biển, chiều ngồi ở Sunset Sanato nghe nhạc acoustic ngắm mặt trời lặn thì còn gì bằng! Chi phí hải sản ở chợ đêm Phú Quốc cũng rất hợp lý. #phuquoc #baisao #beach #sunset',
        images: [
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80'
        ],
        location: 'Phú Quốc',
        coordinates: { lat: 10.2899, lng: 103.9840 },
        travelDate: new Date('2026-09-20'),
        cost: 5800000,
        visibility: 'public',
        author: linh._id,
        likes: [nam._id],
        hashtags: ['phuquoc', 'baisao', 'beach', 'sunset']
      },
      {
        title: 'Bí mật cắm trại đồi Đa Phú - Đà Lạt lúc 4h sáng (Chỉ cho anh em thân thiết)',
        content: 'Khu vực này cực kỳ vắng người và không khí trong lành tuyệt đối. Đêm lạnh khoảng 14 độ, ngồi nhóm lửa nướng khoai và sáng thức dậy đón mây luồn qua thung lũng. Vui lòng giữ gìn vệ sinh và không xả rác nhé cả nhà! #dalat #sanmay #camping #private',
        images: [
          'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80'
        ],
        location: 'Đà Lạt',
        coordinates: { lat: 11.9404, lng: 108.4583 },
        travelDate: new Date('2026-11-02'),
        cost: 1500000,
        visibility: 'followers', // Followers-only post for testing security
        author: nam._id,
        likes: [linh._id],
        hashtags: ['dalat', 'sanmay', 'camping', 'private']
      },
      {
        title: 'Check-in cầu Rồng & Cù Lao Chàm - Đà Nẵng Hội An đáng sống',
        content: 'Đà Nẵng luôn đem lại cảm giác yên bình và văn minh. Tối xem Cầu Rồng phun lửa, ban ngày lặn ngắm san hô ở Cù Lao Chàm, tối ghé phố cổ Hội An thả đèn hoa đăng lung linh. Đồ ăn miền Trung mì quảng, cao lầu ngon đỉnh chóp! #danang #hoian #culaocham',
        images: [
          'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=800&q=80'
        ],
        location: 'Đà Nẵng',
        coordinates: { lat: 16.0544, lng: 108.2022 },
        travelDate: new Date('2026-08-10'),
        cost: 4100000,
        visibility: 'public',
        author: hoang._id,
        likes: [nam._id, linh._id],
        hashtags: ['danang', 'hoian', 'culaocham']
      },
      {
        title: 'Khám phá Tràng An Ninh Bình - Di sản thiên nhiên thế giới',
        content: 'Ngồi thuyền nan lướt qua các hang động kỳ bí ở Tràng An và leo 500 bậc đá lên đỉnh hang Múa ngắm toàn cảnh Tam Cốc. Khung cảnh non nước hữu tình đẹp như tranh thủy mặc! #ninhbinh #trangan #hangmua',
        images: [
          'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=800&q=80'
        ],
        location: 'Ninh Bình',
        coordinates: { lat: 20.2506, lng: 105.9745 },
        travelDate: new Date('2026-07-05'),
        cost: 1800000,
        visibility: 'public',
        author: linh._id,
        likes: [hoang._id],
        hashtags: ['ninhbinh', 'trangan', 'hangmua']
      }
    ]);

    console.log(`[Seed] Created ${posts.length} travel posts`);

    // 3. Create Comments (including 1-level nested replies)
    const topComment = await Comment.create({
      post: posts[0]._id,
      author: linh._id,
      content: 'Chuyến đi Hà Giang đẹp mê ly luôn anh ơi! Anh thuê xe máy ở đâu vậy ạ?',
      parentId: null
    });

    // 1-level reply:
    await Comment.create({
      post: posts[0]._id,
      author: nam._id,
      content: 'Anh thuê ngay gần bến xe Hà Giang em nhé, xe số leo đèo rất khỏe và chủ xe nhiệt tình lắm!',
      parentId: topComment._id // Level 1 reply referencing parent comment
    });

    console.log('[Seed] Created sample comments with 1-level nested reply');
    console.log('--- SEED COMPLETED SUCCESSFULLY ---');
    console.log('Demo Accounts:');
    console.log('  Admin:  admin@travel.com / admin123');
    console.log('  Member: nam@travel.com / 123456');
    console.log('  Member: linh@travel.com / 123456');
    console.log('  Member: hoang@travel.com / 123456');

    process.exit(0);
  } catch (error) {
    console.error(`[Seed] Error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
