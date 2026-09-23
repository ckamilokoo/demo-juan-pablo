<template>
  <canvas
    ref="canvasRef"
    role="img"
    :aria-label="etiqueta"
    :style="{ width: `${size}px`, height: `${size}px`, display: 'block' }"
  ></canvas>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { resolvePreset, MODE_DRAWS, ST_LABEL } from '~/utils/thinkingOrbs';

const props = defineProps({
  // working | searching | solving | listening | composing | shaping
  state: { type: String, default: 'working' },
  // Presets calibrados para 64 y 20
  size: { type: Number, default: 64 },
  dark: { type: Boolean, default: false },
  speed: { type: Number, default: 1 },
});

const canvasRef = ref(null);
const etiqueta = computed(() => ST_LABEL[props.state] || props.state);

let rafId = 0;

const detener = () => {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
};

const iniciar = () => {
  detener();
  const canvas = canvasRef.value;
  if (!canvas) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(props.size * dpr);
  canvas.height = Math.round(props.size * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { mode, speed: baseSpeed, opts } = resolvePreset(props.state, props.size);
  const draw = MODE_DRAWS[mode];
  const eff = baseSpeed * props.speed;
  const frame = (tSec) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, props.size, props.size);
    draw(ctx, props.size, tSec, props.dark, opts);
  };
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    frame(0.6);
    return;
  }
  const loop = () => {
    // Reloj compartido (performance.now): orbs simultáneos quedan en fase
    frame((performance.now() / 1000) * eff);
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);
};

watch(() => [props.state, props.size, props.dark, props.speed], iniciar);
onMounted(iniciar);
onBeforeUnmount(detener);
</script>
