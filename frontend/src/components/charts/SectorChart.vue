<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import * as echarts from "echarts";
import apiClient from "../../api/client";

const props = defineProps({
  country: { type: String, required: true },
  year: { type: [Number, String], required: true },
  gas: { type: String, default: "co2" },
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
  if (!props.country || !props.year) return;
  loading.value = true;
  errorMsg.value = "";

  try {
    const data = await apiClient.get(
      `/emissions/sector?country=${props.country}&year=${props.year}&gas=${props.gas}`,
    );

    if (!data || data.length === 0) {
      errorMsg.value = "No sector data available for this year.";
      if (chartInstance) chartInstance.clear();
      return;
    }

    const formatSector = (s) =>
      s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
    const sectors = data.map((d) => formatSector(d.sector));
    const values = data.map((d) => d.value || 0);

    const option = {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        textStyle: { color: "#15372c" },
        formatter: (params) => {
          const val = params[0].value;
          const name = params[0].name;
          return `<strong>${name}</strong><br/>Emissions: ${val.toFixed(2)} MtCO₂e`;
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        top: "5%",
        containLabel: true,
      },
      xAxis: {
        type: "value",
        name: "MtCO₂e",
        nameTextStyle: { color: "#6b7280" },
        splitLine: { lineStyle: { color: "#f3f4f6", type: "dashed" } },
        axisLabel: { color: "#6b7280" },
      },
      yAxis: {
        type: "category",
        data: sectors,
        axisLine: { lineStyle: { color: "#e5e7eb" } },
        axisLabel: { color: "#6b7280", width: 100, overflow: "break" },
      },
      series: [
        {
          name: "Emissions",
          type: "bar",
          data: values,
          itemStyle: {
            color: "#15372c",
            borderRadius: [0, 4, 4, 0],
          },
          label: {
            show: true,
            position: "right",
            color: "#6b7280",
            formatter: (p) => (p.value > 0 ? p.value.toFixed(1) : ""),
          },
        },
      ],
    };

    if (chartInstance) chartInstance.setOption(option, true);
  } catch {
    errorMsg.value = "Failed to load chart data.";
  } finally {
    loading.value = false;
  }
};

watch([() => props.country, () => props.year, () => props.gas], fetchData);

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
