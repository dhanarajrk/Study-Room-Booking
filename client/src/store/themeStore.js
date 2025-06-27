import { create } from 'zustand';

const useThemeStore = create((set) => ({
  isDark: localStorage.getItem('theme') === 'dark',
  toggleTheme: () => set((state) => {
    const newTheme = !state.isDark;
    console.log('Toggling theme to:', newTheme ? 'dark' : 'light'); // Debug log
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    return { isDark: newTheme };
  }),
}));

// Add storage listener for cross-tab sync
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'theme') {
      console.log('Theme changed in another tab:', event.newValue); // Debug log
      useThemeStore.setState({
        isDark: event.newValue === 'dark',
      });
    }
  });
}

export default useThemeStore;