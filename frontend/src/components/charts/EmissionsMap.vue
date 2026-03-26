<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
// Tree-shaking ECharts
import * as echarts from "echarts/core";
import { MapChart } from "echarts/charts";
import {
  TooltipComponent,
  VisualMapComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  MapChart,
  TooltipComponent,
  VisualMapComponent,
  CanvasRenderer,
]);
import apiClient from "../../api/client";

const props = defineProps({
  country: { type: String, default: null },
  compareWith: { type: String, default: null },
  year: { type: [Number, String], required: true },
  gas: { type: String, default: "total_ghg" },
});

const isDark = ref(document.documentElement.classList.contains("dark"));
let observer = null;

const chartRef = ref(null);
let chartInstance = null;
const loading = ref(false);
const errorMsg = ref("");
let mapRegistered = false;

const initChart = async () => {
  if (chartRef.value && !chartInstance) {
    chartInstance = echarts.init(chartRef.value);
    window.addEventListener("resize", handleResize);

    observer = new MutationObserver(() => {
      isDark.value = document.documentElement.classList.contains("dark");
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  if (!mapRegistered) {
    try {
      loading.value = true;
      const res = await fetch(
        "https://cdn.jsdelivr.net/npm/echarts@4.9.0/map/json/world.json",
      );
      const geoJson = await res.json();
      echarts.registerMap("world", geoJson);
      mapRegistered = true;
    } catch {
      errorMsg.value = "Failed to load geographical map data.";
    } finally {
      loading.value = false;
    }
  }
};

const handleResize = () => {
  if (chartInstance) chartInstance.resize();
};

const fetchData = async () => {
  if (!props.year || !mapRegistered) return;
  loading.value = true;
  errorMsg.value = "";

  try {
    const data = await apiClient.get(
      `/emissions/map?year=${props.year}&gas=${props.gas}`,
    );

    if (!data || data.length === 0) {
      errorMsg.value = "No map data available for this year.";
      if (chartInstance) chartInstance.clear();
      return;
    }

    const mapData = data.map((d) => ({
      name: d.name,
      value: d.value,
      iso: d.iso_code,
    }));
    const maxVal = Math.max(...mapData.map((d) => d.value)) || 1000;

    const option = {
      tooltip: {
        trigger: "item",
        backgroundColor: isDark.value ? "rgba(33, 33, 36, 0.9)" : "#ffffff",
        borderColor: isDark.value ? "#3f3f46" : "#e5e7eb",
        textStyle: { color: isDark.value ? "#ffffff" : "#15372c" },
        formatter: (params) => {
          if (!params.value && params.value !== 0)
            return `<strong>${params.name}</strong><br/>No Data`;
          const gasLabel = props.gas
            .replace("total_ghg", "Total GHG")
            .toUpperCase();
          return `<strong>${params.name}</strong><br/>${gasLabel}: ${params.value.toFixed(2)} MtCO₂e`;
        },
      },
      visualMap: {
        min: 0,
        max: maxVal,
        text: ["High", "Low"],
        realtime: false,
        calculable: true,
        inRange: { 
          color: isDark.value 
            ? ["#1e293b", "#334155", "#10b981", "#ffffff"] 
            : ["#ecfdf5", "#34d399", "#10b981", "#15372c"] 
        },
        textStyle: { color: isDark.value ? "#a1a1aa" : "#6b7280" },
        left: "right",
        bottom: "bottom",
      },
      series: [
        {
          name: "Greenhouse Gas Emissions",
          type: "map",
          map: "world",
          roam: true,
          itemStyle: { 
            borderColor: isDark.value ? "#334155" : "#ffffff", 
            areaColor: isDark.value ? "#1e293b" : "#f3f4f6" 
          },
          emphasis: {
            itemStyle: { areaColor: "#f59e0b" },
            label: { show: false },
          },
          select: {
            itemStyle: {
              areaColor: "#f59e0b",
              borderColor: "#ffffff",
              borderWidth: 2,
            },
            label: { show: true, color: "#ffffff", fontWeight: "bold" }
          },
          selectedMode: "multiple",
          data: mapData,
        },
      ],
    };

    if (chartInstance) {
      chartInstance.setOption(option, true);
      
      // Highlight selected countries
      const selectedIndices = [];
      if (props.country) {
        const idx = mapData.findIndex(d => d.iso === props.country);
        if (idx !== -1) selectedIndices.push(idx);
      }
      if (props.compareWith) {
        const idx = mapData.findIndex(d => d.iso === props.compareWith);
        if (idx !== -1) selectedIndices.push(idx);
      }
      
      if (selectedIndices.length > 0) {
        chartInstance.dispatchAction({
          type: 'select',
          seriesIndex: 0,
          dataIndex: selectedIndices
        });
      }
    }
  } catch {
    errorMsg.value = "Failed to load chart data.";
  } finally {
    loading.value = false;
  }
};

watch([() => props.year, () => props.gas, () => props.country, () => props.compareWith, isDark], () => {
  if (mapRegistered) fetchData();
});

onMounted(async () => {
  await initChart();
  fetchData();
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  if (observer) observer.disconnect();
  if (chartInstance) chartInstance.dispose();
});
</script>

<template>
  <div class="relative w-full h-full">
    <div
      v-if="loading"
      class="absolute inset-0 flex items-center justify-center bg-bg-main/60 z-10 rounded-xl backdrop-blur-sm"
    >
      <div class="animate-pulse text-brand-primary font-medium">
        Loading API...
      </div>
    </div>
    <div
      v-if="errorMsg"
      class="absolute inset-0 flex items-center justify-center text-text-muted"
    >
      {{ errorMsg }}
    </div>
    <div
      ref="chartRef"
      class="w-full h-full"
      :class="{ 'opacity-0': errorMsg }"
    ></div>
  </div>
</template>
