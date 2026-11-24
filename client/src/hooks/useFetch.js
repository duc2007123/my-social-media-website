import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * Custom Hook: useFetch
 * Thực hiện gọi API với đầy đủ các trạng thái loading, data, error và hàm refetch.
 * Có cleanup AbortController để ngăn ngừa memory leak khi unmount.
 */
export const useFetch = (url, options = {}, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!url) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const headers = {
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const res = await axios.get(url, {
        ...options,
        headers,
        signal: controller.signal
      });

      setData(res.data.data !== undefined ? res.data.data : res.data);
    } catch (err) {
      if (!axios.isCancel(err)) {
        setError(err.response?.data?.message || err.message || 'Lỗi khi tải dữ liệu');
      }
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  }, [url, ...deps]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

export default useFetch;
