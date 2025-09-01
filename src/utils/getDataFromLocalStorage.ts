
export const getDataFromLocalStorage = () => {
    const persistedData = localStorage.getItem('persist:root');
    if (persistedData) {
        try {
        const parsed = JSON.parse(persistedData);
        if (parsed.user) {
            const userData = JSON.parse(parsed.user);
            return userData;
        }
        } catch (e) {
        console.error('Error parsing localStorage:', e);
        }
    }
    return null;
}