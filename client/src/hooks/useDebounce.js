import { useState, useEffect } from 'react';

/**
 * Custom Hook: useDebounce
 * Trì hoãn việc cập nhật giá trị cho đến khi người dùng ngừng gõ sau một khoảng delay (ms).
 * Phục vụ tối ưu hiệu năng tìm kiếm địa điểm, hashtag (Requirement 4 & Topic 5).
 */
export const useDebounce = (value, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup timer on value change or unmount
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
