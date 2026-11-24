import { configureStore, createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0,
    loading: false
  },
  reducers: {
    setNotifications: (state, action) => {
      state.items = action.payload;
      state.unreadCount = action.payload.filter(n => !n.isRead).length;
    },
    addNotification: (state, action) => {
      state.items.unshift(action.payload);
      state.unreadCount += 1;
    },
    markAllRead: (state) => {
      state.items.forEach(n => { n.isRead = true; });
      state.unreadCount = 0;
    }
  }
});

export const { setNotifications, addNotification, markAllRead } = notificationSlice.actions;

export const store = configureStore({
  reducer: {
    notifications: notificationSlice.reducer
  }
});

export default store;
