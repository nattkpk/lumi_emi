<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
// Tree-shaking ECharts
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  LineChart,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  CanvasRenderer,
]);
import apiClient from "../../api/client";

const props = defineProps({
  country: { type: String, required: true },
  compareWith: { type: String, default: null },
  gas: { type: String, default: "total_ghg" },
});

const chartRef = ref(null);
let chartInstance = null;
const loading = ref(false);
const errorMsg = ref("");

const initChart = () => {
  if (chartRef.value && !chartInstance) {
    chartInstance = echarts.init(chartRef.value);
    window.addEventListener("resize", handleResize);
  }
};

const handleResize = () => {
  if (chartInstance) chartInstance.resize();
};

const fetchData = async () => {
  if (!props.country) return;
  loading.value = true;
  errorMsg.value = "";

  try {
    const mainData = await apiClient.get(
      `/emissions/trend?country=${props.country}`,
    );
    let compareData = null;
    if (props.compareWith) {
      compareData = await apiClient.get(
        `/emissions/trend?country=${props.compareWith}`,
      );
    }

    if (!mainData || mainData.length === 0) {
      errorMsg.value = "No data available.";
      if (chartInstance) chartInstance.clear();
      return;
    }

    const years = mainData.map((d) => d.year);
    const series = [];
    const legend = [];

    if (!props.compareWith) {
      const gases = [
        { key: "co2", name: "CO₂", color: "#15372c" },
        { key: "ch4", name: "CH₄", color: "#10b981" },
        { key: "n2o", name: "N₂O", color: "#0ea5e9" },
        { key: "total_ghg", name: "Total GHG", color: "#94a3b8", dashed: true },
      ];

      gases.forEach((g) => {
        if (props.gas !== "total_ghg" && g.key !== props.gas) return;
        const dataValues = mainData.map((d) => [d.year, d[g.key] || 0]);
        legend.push(g.name);
        series.push({
          name: g.name,
          type: "line",
          smooth: true,
          symbol: "none",
          lineStyle: {
            width: 2,
            color: g.color,
            type: g.dashed ? "dashed" : "solid",
          },
          data: dataValues,
        });
      });
    } else {
      const mainValues = mainData.map((d) => [d.year, d[props.gas] || 0]);
      series.push({
        name: props.country,
        type: "line",
        smooth: true,
        symbol: "none",
        lineStyle: { width: 3, color: "#15372c" },
        data: mainValues,
      });
      legend.push(props.country);

      if (compareData) {
        const compareValues = compareData.map((d) => [
          d.year,
          d[props.gas] || 0,
        ]);
        series.push({
          name: props.compareWith,
          type: "line",
          smooth: true,
          symbol: "none",
          lineStyle: { width: 3, color: "#f59e0b" },
          data: compareValues,
        });
        legend.push(props.compareWith);
      }
    }

    const option = {
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        borderColor: "#e5e7eb",
        textStyle: { color: "#15372c" },
        axisPointer: { type: "cross" },
      },
      legend: { data: legend, bottom: 0, textStyle: { fontSize: 10 } },
      grid: { left: "3%", right: "4%", bottom: "15%", containLabel: true },
      xAxis: {
        type: "value",
        min: Math.min(...years),
        max: Math.max(...years),
        minInterval: 1,
        maxInterval: 5,
        splitNumber: 15,
        axisLabel: {
          color: "#6b7280",
          formatter: "{value}",
          rotate: years.length > 10 ? 45 : 0,
        },
        splitLine: {
          show: true,
          lineStyle: { type: "dashed", color: "#f3f4f6" },
        },
      },
      yAxis: { type: "value", name: "MtCO₂e", axisLabel: { color: "#6b7280" } },
      series,
    };

    if (chartInstance) chartInstance.setOption(option, true);
  } catch {
    errorMsg.value = "Failed to load chart data.";
  } finally {
    loading.value = false;
  }
};

watch(
  [() => props.country, () => props.compareWith, () => props.gas],
  fetchData,
);

onMounted(() => {
  initChart();
  fetchData();
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
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
