import useThemeStore from '../../store/themeStore.js';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';

function ThemeToggleBtn() {
    const { isDark, toggleTheme } = useThemeStore();

    return (
        <>
            <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-[var(--text)] hover:bg-[var(--highlight)]"
            >
                {isDark ? (
                    <SunIcon className="h-5 w-5" />
                ) : (
                    <MoonIcon className="h-5 w-5" />
                )}
            </button>
        </>
    )
}

export default ThemeToggleBtn