<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
// Tree-shaking ECharts
import * as echarts from "echarts/core";
import { BarChart } from "echarts/charts";
import {
  TooltipComponent,
  GridComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  BarChart,
  TooltipComponent,
  GridComponent,
  CanvasRenderer,
]);
import apiClient from "../../api/client";

const props = defineProps({
  country: { type: String, required: true },
  compareWith: { type: String, default: null },
  year: { type: [Number, String], required: true },
  gas: { type: String, default: "co2" },
});

const chartRef = ref(null);
let chartInstance = null;
const loading = ref(false);
const errorMsg = ref("");
const isDark = ref(document.documentElement.classList.contains("dark"));

let observer = null;

const initChart = () => {
  if (chartRef.value && !chartInstance) {
    chartInstance = echarts.init(chartRef.value);
    window.addEventListener("resize", handleResize);

    // Watch for dark mode changes
    observer = new MutationObserver(() => {
      isDark.value = document.documentElement.classList.contains("dark");
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }
};

const handleResize = () => {
  if (chartInstance) chartInstance.resize();
};

const fetchData = async () => {
  if (!props.country || !props.year) return;
  loading.value = true;
  errorMsg.value = "";

  try {
    const mainData = await apiClient.get(
      `/emissions/sector?country=${props.country}&year=${props.year}&gas=${props.gas}`,
    );

    let compareData = null;
    if (props.compareWith) {
      compareData = await apiClient.get(
        `/emissions/sector?country=${props.compareWith}&year=${props.year}&gas=${props.gas}`,
      );
    }

    if (!mainData || mainData.length === 0) {
      errorMsg.value = "No sector data available.";
      if (chartInstance) chartInstance.clear();
      return;
    }

    const formatSector = (s) =>
      s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");

    const sectors = mainData.map((d) => formatSector(d.sector));
    const mainValues = mainData.map((d) => d.value || 0);

    const primaryColor = isDark.value ? "#ffffff" : "#15372c";
    const compareColor = "#f59e0b";

    const series = [
      {
        name: props.country,
        type: "bar",
        data: mainValues,
        itemStyle: {
          color: primaryColor,
          borderRadius: [0, 4, 4, 0],
        },
        label: {
          show: !props.compareWith,
          position: "right",
          color: isDark.value ? "#a1a1aa" : "#6b7280",
          formatter: (p) => (p.value > 0 ? p.value.toFixed(1) : ""),
        },
      },
    ];

    if (compareData) {
      const compareValues = sectors.map((s) => {
        const found = compareData.find((d) => formatSector(d.sector) === s);
        return found ? found.value : 0;
      });
      series.push({
        name: props.compareWith,
        type: "bar",
        data: compareValues,
        itemStyle: {
          color: compareColor,
          borderRadius: [0, 4, 4, 0],
        },
      });
    }

    const option = {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: isDark.value
          ? "rgba(33, 33, 36, 0.9)"
          : "#ffffff",
        borderColor: isDark.value ? "#3f3f46" : "#e5e7eb",
        textStyle: { color: isDark.value ? "#ffffff" : "#15372c" },
      },
      legend: {
        show: !!props.compareWith,
        bottom: 0,
        textStyle: { color: isDark.value ? "#a1a1aa" : "#6b7280", fontSize: 10 },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: props.compareWith ? "12%" : "3%",
        top: "5%",
        containLabel: true,
      },
      xAxis: {
        type: "value",
        name: "MtCO₂e",
        nameTextStyle: { color: isDark.value ? "#a1a1aa" : "#6b7280" },
        splitLine: {
          lineStyle: {
            color: isDark.value ? "#27272a" : "#f3f4f6",
            type: "dashed",
          },
        },
        axisLabel: { color: isDark.value ? "#a1a1aa" : "#6b7280" },
      },
      yAxis: {
        type: "category",
        data: sectors,
        axisLine: { lineStyle: { color: isDark.value ? "#3f3f46" : "#e5e7eb" } },
        axisLabel: {
          color: isDark.value ? "#a1a1aa" : "#6b7280",
          width: 100,
          overflow: "break",
        },
      },
      series,
    };

    if (chartInstance) chartInstance.setOption(option, true);
  } catch {
    errorMsg.value = "Failed to load chart data.";
  } finally {
    loading.value = false;
  }
};

watch([() => props.country, () => props.compareWith, () => props.year, () => props.gas, isDark], fetchData);

onMounted(() => {
  initChart();
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
