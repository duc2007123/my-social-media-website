import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, MapPin, DollarSign, Calendar, Eye, AlertCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

export const PostForm = ({ postToEdit = null, isEdit = false }) => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    title: postToEdit?.title || '',
    content: postToEdit?.content || '',
    location: postToEdit?.location || '',
    travelDate: postToEdit?.travelDate ? postToEdit.travelDate.split('T')[0] : new Date().toISOString().split('T')[0],
    cost: postToEdit?.cost || '',
    visibility: postToEdit?.visibility || 'public'
  });

  // Selected new file objects
  const [selectedFiles, setSelectedFiles] = useState([]);
  // Preview URLs created via URL.createObjectURL
  const [previews, setPreviews] = useState([]);
  // Existing images from postToEdit
  const [existingImages, setExistingImages] = useState(postToEdit?.images || []);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Clean up object URLs when previews change or component unmounts (Requirement Topic 5)
  useEffect(() => {
    return () => {
      previews.forEach((p) => {
        if (p.url.startsWith('blob:')) {
          URL.revokeObjectURL(p.url);
        }
      });
    };
  }, [previews]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const totalCount = existingImages.length + selectedFiles.length + files.length;
    if (totalCount > 6) {
      setError('Mỗi bài viết chỉ được đính kèm tối đa 6 ảnh');
      return;
    }

    // Validate size and format
    const validFiles = [];
    const newPreviews = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError(`File ${file.name} không phải là file ảnh hợp lệ`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`File ${file.name} vượt quá dung lượng tối đa 5MB`);
        return;
      }
      validFiles.push(file);
      // Requirement Topic 5: URL.createObjectURL for preview
      const objectUrl = URL.createObjectURL(file);
      newPreviews.push({ url: objectUrl, file });
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
    setError('');
  };

  // Remove preview image & revoke object URL
  const handleRemoveNewImage = (indexToRemove) => {
    const targetPreview = previews[indexToRemove];
    if (targetPreview && targetPreview.url.startsWith('blob:')) {
      // Requirement Topic 5: Revoke Object URL to release memory!
      URL.revokeObjectURL(targetPreview.url);
    }
    setPreviews((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Remove existing image
  const handleRemoveExistingImage = (indexToRemove) => {
    setExistingImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim() || !formData.location.trim()) {
      setError('Vui lòng điền đầy đủ tiêu đề, nội dung và địa điểm');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = new FormData();
      data.append('title', formData.title.trim());
      data.append('content', formData.content.trim());
      data.append('location', formData.location.trim());
      data.append('travelDate', formData.travelDate);
      data.append('cost', formData.cost || 0);
      data.append('visibility', formData.visibility);

      // Append newly uploaded image files
      selectedFiles.forEach((file) => {
        data.append('images', file);
      });

      // Append existing image URLs if editing
      if (isEdit) {
        existingImages.forEach((imgUrl) => {
          data.append('images', imgUrl);
        });
      }

      const headers = {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`
      };

      if (isEdit) {
        await axios.put(`/api/posts/${postToEdit._id}`, data, { headers });
        setSuccessMsg('Cập nhật bài viết thành công!');
      } else {
        await axios.post('/api/posts', data, { headers });
        setSuccessMsg('Đăng bài viết nhật ký du lịch thành công!');
      }

      // Requirement: useNavigate sau khi lưu
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu bài viết');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
      <div className="border-b border-slate-100 pb-4 mb-6">
        <h1 className="text-xl font-bold text-slate-900">
          {isEdit ? 'Chỉnh sửa nhật ký chuyến đi' : 'Tạo bài viết nhật ký du lịch mới'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Lưu lại cảm xúc, chi phí và khoảnh khắc đáng nhớ của bạn
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg} Đang chuyển hướng...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Tiêu đề bài viết <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Ví dụ: Chinh phục đỉnh Fansipan 3 ngày 2 đêm săn mây..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden transition-all"
            required
          />
        </div>

        {/* Location & Travel Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              Địa điểm / Thành phố <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Hà Giang, Đà Lạt, Phú Quốc..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              Ngày khởi hành
            </label>
            <input
              type="date"
              name="travelDate"
              value={formData.travelDate}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden transition-all"
            />
          </div>
        </div>

        {/* Cost & Visibility */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              Chi phí chuyến đi (VNĐ)
            </label>
            <input
              type="number"
              name="cost"
              value={formData.cost}
              onChange={handleInputChange}
              placeholder="Ví dụ: 3500000"
              min="0"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              Chế độ hiển thị
            </label>
            <select
              name="visibility"
              value={formData.visibility}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden transition-all"
            >
              <option value="public">🌍 Công khai (Mọi người đều xem được)</option>
              <option value="followers">🔒 Chỉ người theo dõi (Bảo mật)</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nội dung trải nghiệm & Hashtag <span className="text-rose-500">*</span>
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            rows="5"
            placeholder="Kể về lịch trình, món ăn, khách sạn và kinh nghiệm của bạn... Hãy thêm các #hashtag như #hagiang #sanmay..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden transition-all"
            required
          ></textarea>
        </div>

        {/* Upload Images with Live Preview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-slate-700">
              Hình ảnh chuyến đi ({existingImages.length + previews.length}/6 ảnh)
            </label>
            <span className="text-[11px] text-slate-400">Tối đa 6 ảnh, mỗi ảnh ≤ 5MB</span>
          </div>

          {/* Previews grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-3">
            {/* Existing images */}
            {existingImages.map((imgUrl, idx) => (
              <div key={`existing-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                <img src={imgUrl} alt="Existing" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveExistingImage(idx)}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-rose-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* New previews */}
            {previews.map((preview, idx) => (
              <div key={`new-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-emerald-300 ring-2 ring-emerald-500/20 group">
                <img src={preview.url} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveNewImage(idx)}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-rose-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                  title="Xóa và giải phóng bộ nhớ"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Upload trigger button if < 6 images */}
            {existingImages.length + previews.length < 6 && (
              <label className="aspect-square border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors text-slate-400 hover:text-emerald-600">
                <Upload className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-semibold">Thêm ảnh</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Submit button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-emerald-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              isEdit ? 'Lưu thay đổi' : 'Đăng bài viết'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostForm;
