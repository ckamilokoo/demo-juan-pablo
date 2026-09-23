import { ref, onMounted, onBeforeUnmount } from 'vue';

const STORAGE_COLAPSADO = 'sidebar-colapsado';

export function useResponsive() {
  const isMobile = ref(false);
  const isSidebarOpen = ref(false);
  // Solo aplica en escritorio: en movil el sidebar es un drawer (isSidebarOpen).
  const isSidebarCollapsed = ref(false);

  // Check if mobile on mount and when window resizes with throttling
  const checkIfMobile = () => {
    isMobile.value = window.innerWidth < 768;
    // Close sidebar automatically on mobile when switching to mobile view
    if (isMobile.value && isSidebarOpen.value) {
      isSidebarOpen.value = false;
    }
  };
  
  // Throttle function implementation
  const throttle = (func, delay) => {
    let lastCall = 0;
    return function(...args) {
      const now = new Date().getTime();
      if (now - lastCall < delay) {
        return;
      }
      lastCall = now;
      return func(...args);
    };
  };
  
  // Toggle sidebar
  const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value;
  };

  const toggleSidebarCollapse = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
    if (import.meta.client) {
      localStorage.setItem(STORAGE_COLAPSADO, isSidebarCollapsed.value ? '1' : '0');
      // El contenido principal cambia de ancho al terminar la transicion (300ms).
      // Chart.js reajusta solo (ResizeObserver sobre el contenedor), pero ApexCharts
      // y cualquier listener manual escuchan window.resize.
      setTimeout(() => window.dispatchEvent(new Event('resize')), 320);
    }
  };

  // Create throttled version of checkIfMobile
  const throttledCheckIfMobile = throttle(checkIfMobile, 250);
  
  onMounted(() => {
    // Check initial screen size
    checkIfMobile();

    // Sin preferencia guardada, en tablet (< 1280 px) el menú parte colapsado
    // (solo íconos) para dejarle el ancho al contenido.
    const guardado = localStorage.getItem(STORAGE_COLAPSADO);
    isSidebarCollapsed.value = guardado === null ? window.innerWidth < 1280 : guardado === '1';

    // Add resize listener
    window.addEventListener("resize", throttledCheckIfMobile);
  });
  
  onBeforeUnmount(() => {
    // Clean up resize listener
    window.removeEventListener("resize", throttledCheckIfMobile);
  });
  
  return {
    isMobile,
    isSidebarOpen,
    isSidebarCollapsed,
    toggleSidebar,
    toggleSidebarCollapse,
    checkIfMobile
  };
}
