<template>
  <aside :class="[
    'shadow-lg transition-all duration-300 z-40 shrink-0',
    isDarkMode ? 'bg-[#2E4053]' : 'bg-white border-r border-[#E9ECEF]',
    isMobile ? 'fixed h-full' : 'relative',
    !isMobile && (colapsado ? 'w-16' : 'w-64'),
    isMobile && !isSidebarOpen ? '-translate-x-full' : 'translate-x-0',
  ]"
    :style="isMobile ? 'width: 240px' : ''"
  >
    <!-- Logo/Header -->
    <div class="h-16 border-b flex items-center"
      :class="[
        isDarkMode ? 'border-[#333333]' : 'border-[#E9ECEF]',
        colapsado ? 'px-2 justify-center' : 'px-6 justify-between',
      ]">
      <h1 v-if="!colapsado" class="text-xl font-semibold truncate" :class="isDarkMode ? 'text-white' : 'text-[#2E4053]'">
        Modelo IA Bombas
      </h1>
      <button v-if="isMobile" @click="toggleSidebar" aria-label="Cerrar menú"
        :class="isDarkMode ? 'text-white' : 'text-[#2E4053]'" class="p-1">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <button
        v-else
        @click="toggleCollapse"
        :aria-label="colapsado ? 'Expandir menú' : 'Colapsar menú'"
        :aria-expanded="!colapsado"
        :title="colapsado ? 'Expandir menú' : 'Colapsar menú'"
        class="p-1 rounded-md transition-colors"
        :class="isDarkMode ? 'text-[#B1B1B1] hover:bg-[#3A5065] hover:text-white' : 'text-[#6C757D] hover:bg-[#F1F3F5] hover:text-[#2E4053]'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transition-transform duration-300"
          :class="colapsado ? 'rotate-180' : ''"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>
    </div>

    <!-- Navigation -->
    <nav class="py-4 flex flex-col h-[calc(100%-64px)]" :class="colapsado ? 'px-2' : 'px-4'">
      <div class="flex-1">
        <template v-for="(section, sIdx) in navItems" :key="sIdx">
          <p v-if="!colapsado" class="text-xs font-medium uppercase tracking-wider mb-2"
            :class="isDarkMode ? 'text-[#B1B1B1]' : 'text-[#6C757D]'">
            {{ section.section }}
          </p>
          <p v-else
            class="text-[10px] font-semibold uppercase tracking-wider text-center mb-2"
            :class="[
              isDarkMode ? 'text-[#B1B1B1]' : 'text-[#6C757D]',
              sIdx > 0 ? (isDarkMode ? 'border-t border-[#333333] mt-3 pt-3' : 'border-t border-[#E9ECEF] mt-3 pt-3') : '',
            ]">
            {{ etiquetaCorta(section.section) }}
          </p>
          <div class="space-y-1">
            <button
              v-for="item in section.items"
              :key="item.id"
              @click="selectNavItem(item.id)"
              :title="colapsado ? item.name : null"
              :aria-label="item.name"
              :aria-current="activeView === item.id ? 'page' : null"
              :class="[
                'relative w-full flex items-center py-2 text-sm rounded-md transition-colors',
                colapsado ? 'justify-center px-2' : 'px-3',
                activeView === item.id
                  ? isDarkMode
                    ? 'bg-[#333333] text-white font-medium'
                    : 'bg-[#E9ECEF] text-[#2E4053] font-medium'
                  : isDarkMode
                  ? 'text-[#B1B1B1] hover:bg-[#3A5065] hover:text-white'
                  : 'text-[#495057] hover:bg-[#F1F3F5] hover:text-[#2E4053]',
              ]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" :class="colapsado ? '' : 'mr-2'"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path :d="rutaIcono(item.icon)" />
              </svg>
              <span v-if="!colapsado" class="truncate">{{ item.name }}</span>
            </button>
          </div>
        </template>
      </div>

      <!-- Bottom Buttons -->
      <div class="border-t pt-4 mt-4 space-y-1" :class="isDarkMode ? 'border-[#333333]' : 'border-[#E9ECEF]'">
        <button
          @click="logout"
          aria-label="Cerrar sesión"
          :title="colapsado ? `Cerrar sesión${userEmail ? ' — ' + userEmail : ''}` : null"
          :class="[
            'w-full flex items-center py-2 text-sm rounded-md transition-colors',
            colapsado ? 'justify-center px-2' : 'px-3',
            isDarkMode
              ? 'text-red-300 hover:bg-red-900 hover:bg-opacity-40 hover:text-white'
              : 'text-red-600 hover:bg-red-50 hover:text-red-700',
          ]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" :class="colapsado ? '' : 'mr-2'" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <template v-if="!colapsado">
            Cerrar sesión
            <span v-if="userEmail" class="ml-auto text-xs opacity-60 truncate max-w-[80px]" :title="userEmail">
              {{ userEmail }}
            </span>
          </template>
        </button>
      </div>
    </nav>

    <!-- Modal de confirmación de logout -->
    <Teleport to="body">
      <div v-if="mostrarConfirmLogout" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black bg-opacity-50" @click="cancelarLogout"></div>

        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-sm">
          <div class="p-6">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div class="flex-1">
                <h3 class="text-base font-semibold text-gray-900">Cerrar sesión</h3>
                <p class="mt-1 text-sm text-gray-600">
                  ¿Estás seguro que deseas cerrar la sesión?
                </p>
                <p v-if="userEmail" class="mt-1 text-xs text-gray-400 truncate">
                  {{ userEmail }}
                </p>
              </div>
            </div>
          </div>

          <div class="flex gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
            <button
              @click="cancelarLogout"
              class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              @click="confirmarLogout"
              class="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </aside>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  isDarkMode: Boolean,
  isMobile: Boolean,
  isSidebarOpen: Boolean,
  isSidebarCollapsed: Boolean,
  activeView: String,
  navItems: Array,
});
const emit = defineEmits(["toggleSidebar", "toggleCollapse", "selectNavItem"]);

// El modo colapsado es solo de escritorio: en movil el sidebar ya es un drawer
// completo y un riel de iconos encima seria un segundo estado oculto.
const colapsado = computed(() => props.isSidebarCollapsed && !props.isMobile);

// Los `icon` de navItems eran nombres de componentes que nunca existieron en el
// proyecto (no hay libreria de iconos instalada), asi que <component :is> no
// resolvia nada. Se mapean a paths SVG, en la misma linea que el resto del archivo.
const RUTAS_ICONO = {
  ChartBarIcon: 'M3 3v18h18M7 15v3M12 9v9M17 5v13',
  ChatBubbleIcon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
  ExclamationTriangleIcon: 'M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
  SignalIcon: 'M22 12h-4l-3 9L9 3l-3 9H2',
  ListBulletIcon: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
};
const rutaIcono = (nombre) => RUTAS_ICONO[nombre] || RUTAS_ICONO.ChartBarIcon;

// En el riel colapsado no cabe "Bomba A": queda la inicial como separador.
const etiquetaCorta = (seccion) => {
  const m = String(seccion).match(/bomba\s+(\w)/i);
  return m ? m[1].toUpperCase() : String(seccion).slice(0, 3).toUpperCase();
};

const { $auth } = useNuxtApp();
const userEmail = computed(() => $auth?.userInfo?.value?.email || '');

const mostrarConfirmLogout = ref(false);
const logout = () => {
  mostrarConfirmLogout.value = true;
};
const confirmarLogout = () => {
  mostrarConfirmLogout.value = false;
  $auth.logout();
};
const cancelarLogout = () => {
  mostrarConfirmLogout.value = false;
};

const toggleSidebar = () => emit("toggleSidebar");
const toggleCollapse = () => emit("toggleCollapse");
const selectNavItem = (id) => emit("selectNavItem", id);
</script>
