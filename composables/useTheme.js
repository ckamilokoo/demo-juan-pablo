import { ref, onMounted } from 'vue';

export function useTheme() {
  const isDarkMode = ref(true);
  
  const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value;
    localStorage.setItem("darkMode", isDarkMode.value ? "true" : "false");
  };
  
  onMounted(() => {
    const savedTheme = localStorage.getItem("darkMode");
    if (savedTheme !== null) {
      isDarkMode.value = savedTheme === "true";
    }
  });
  
  return { isDarkMode, toggleTheme };
}
