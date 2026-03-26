<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import BaseCard from "../components/ui/BaseCard.vue";
import BaseSelect from "../components/ui/BaseSelect.vue";
import apiClient from "../api/client";
import TrendChart from "../components/charts/TrendChart.vue";
import SectorChart from "../components/charts/SectorChart.vue";
import EmissionsMap from "../components/charts/EmissionsMap.vue";
import HeroGlobe from "../components/ui/HeroGlobe.vue";
import SkeletonLoader from "../components/ui/SkeletonLoader.vue";
import BaseButton from "../components/ui/BaseButton.vue";
import { ArrowDownTrayIcon } from "@heroicons/vue/24/outline";
// html2canvas and jspdf are loaded dynamically to optimize bundle size

const countries = ref([]);
const selectedCountry = ref("THA");
const secondCountry = ref("USA");
const selectedYear = ref(2020);
const selectedGas = ref("total_ghg");
const isCompareMode = ref(false);
const loading = ref(true);
const scrolled = ref(false);
const detailsSection = ref(null);
const trendCard = ref(null);
const sectorCard = ref(null);
const mapCard = ref(null);
const isExporting = ref(false);
const exportFormat = ref("pdf");

const gasOptions = [
  { value: "total_ghg", label: "Total GHG" },
  { value: "co2", label: "CO₂" },
  { value: "ch4", label: "CH₄" },
  { value: "n2o", label: "N₂O" },
];

const handleMapClick = (country) => {
  let iso = country.iso;
  if (!iso) {
    const found = countries.value.find((c) => c.label === country.name);
    if (found) iso = found.value;
  }
  if (iso) selectedCountry.value = iso;
  if (detailsSection.value)
    detailsSection.value.scrollIntoView({ behavior: "smooth" });
};

const handleScroll = () => {
  scrolled.value = window.scrollY > 160;
};

const downloadComponent = async (elementRef, name) => {
  if (!elementRef) return;
  isExporting.value = true;
  try {
    // Dynamically import libraries to optimize bundle size and resolve build errors
    const [html2canvasModule, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    const html2canvas = html2canvasModule.default;

    const canvas = await html2canvas(elementRef, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: document.documentElement.classList.contains("dark")
        ? "#212124"
        : "#ffffff",
    });
    if (exportFormat.value === "pdf") {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`LumiEMI_${name}_${selectedYear.value}.pdf`);
    } else {
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = imgData;
      link.download = `LumiEMI_${name}_${selectedYear.value}.png`;
      link.click();
    }
  } catch {
    /* export failed silently */
  } finally {
    isExporting.value = false;
  }
};

const downloadReport = () =>
  downloadComponent(detailsSection.value, `Report_${selectedCountry.value}`);

const initData = async () => {
  try {
    loading.value = true;
    const res = await apiClient.get("/countries");
    countries.value = res.map((c) => ({ value: c.iso_code, label: c.name }));
  } catch {
    /* failed to load countries */
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  initData();
  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <div class="flex flex-col w-full no-scrollbar overflow-y-auto">
    <div
      class="w-full h-[100vh] bg-brand-primary text-white py-16 px-4 sm:px-6 lg:px-8 border-t border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-700 relative"
    >
      <div
        class="max-w-7xl mx-auto h-full flex flex-col lg:flex-row items-start pt-10 lg:pt-40 relative"
      >
        <div class="w-full lg:w-1/2 z-10">
          <h1
            class="text-4xl md:text-6xl font-bold font-heading leading-tight mb-6"
          >
            Climate Clarity,<br />Simplified.
          </h1>
          <p
            class="text-xl md:text-2xl text-white/80 font-sans leading-relaxed max-w-2xl"
          >
            Illuminate historical trends, explore sectoral footprints, and see
            the world's emissions in a whole new light.
          </p>
        </div>
        <div
          class="absolute right-[-5%] top-1/2 -translate-y-1/2 w-[50%] h-[100%] opacity-95 hidden md:flex items-center justify-center drop-shadow-2xl z-20"
        >
          <HeroGlobe @countryClick="handleMapClick" />
        </div>
      </div>
      <div
        v-if="!scrolled"
        class="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce opacity-80 pointer-events-none transition-opacity duration-300"
      >
        <svg
          class="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="3"
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    </div>

    <div
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 w-full"
      ref="detailsSection"
    >
      <div
        class="flex flex-col md:flex-row gap-8 items-end border-b border-border-subtle pb-8"
      >
        <div class="w-full md:w-1/4 flex flex-col space-y-2">
          <BaseSelect
            v-model="selectedCountry"
            label="Region/Country"
            :options="countries"
          />
        </div>
        <div class="w-full md:w-1/4" v-if="isCompareMode">
          <BaseSelect
            v-model="secondCountry"
            label="Compare With"
            :options="countries"
          />
        </div>
        <div class="w-full md:w-1/4">
          <BaseSelect
            v-model="selectedGas"
            label="Emission Type"
            :options="gasOptions"
          />
        </div>
        <div
          class="w-full md:w-auto flex flex-col md:flex-row items-center gap-4 mb-2 md:ml-auto"
        >
          <div
            class="flex items-center space-x-1 p-1 bg-bg-secondary border border-border-subtle rounded-full text-xs h-10"
          >
            <button
              @click="exportFormat = 'pdf'"
              class="px-5 py-1.5 rounded-full transition-all font-bold"
              :class="
                exportFormat === 'pdf'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text-main'
              "
            >
              PDF
            </button>
            <button
              @click="exportFormat = 'image'"
              class="px-5 py-1.5 rounded-full transition-all font-bold"
              :class="
                exportFormat === 'image'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text-main'
              "
            >
              Image
            </button>
          </div>
          <BaseButton
            variant="secondary"
            @click="downloadReport"
            :disabled="isExporting"
            class="!rounded-full shadow-sm text-sm h-10 px-6"
          >
            <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
            {{ isExporting ? "Preparing..." : "Download" }}
          </BaseButton>
        </div>
      </div>

      <div
        class="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both"
      >
        <BaseCard class="col-span-1 lg:col-span-2" ref="trendCard">
          <template #header>
            <div class="flex items-center justify-between w-full">
              <div class="flex flex-col">
                <span class="font-bold">Emissions Trend Over Time</span>
                <span
                  class="text-[10px] font-normal text-text-muted capitalize"
                  v-if="!loading"
                  >{{ selectedGas.replace("_", " ") }}</span
                >
              </div>
              
              <div class="flex items-center space-x-2" v-if="!loading">
                <span class="text-[10px] font-bold uppercase tracking-wider text-text-muted">Compare Mode</span>
                <button 
                  @click="isCompareMode = !isCompareMode"
                  class="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                  :class="isCompareMode ? 'bg-brand-primary' : 'bg-gray-300'"
                >
                  <span 
                    class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                    :class="isCompareMode ? 'translate-x-4' : 'translate-x-0'"
                  />
                </button>
              </div>
            </div>
          </template>
          <div class="h-[400px]">
            <SkeletonLoader v-if="loading" height="100%" />
            <TrendChart
              v-else
              :country="selectedCountry"
              :compareWith="isCompareMode ? secondCountry : null"
              :gas="selectedGas"
            />
          </div>
        </BaseCard>

        <div class="col-span-1 lg:col-span-2 flex my-2">
          <div class="w-full bg-transparent py-4 px-2">
            <div class="flex flex-col space-y-3">
              <div class="flex items-center justify-between">
                <label
                  class="text-xs font-bold text-text-muted flex items-center space-x-2"
                >
                  <svg
                    class="w-3.5 h-3.5 text-brand-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <span>Select Year</span>
                </label>
                <span class="text-brand-secondary font-bold text-lg">{{
                  selectedYear
                }}</span>
              </div>
              <input
                type="range"
                v-model="selectedYear"
                min="1990"
                max="2026"
                class="w-full h-1.5 bg-border-subtle rounded-lg appearance-none cursor-pointer accent-[#15372c]"
              />
              <div
                class="flex justify-between text-[10px] font-medium text-text-muted"
              >
                <span>1990</span>
                <span>2026</span>
              </div>
            </div>
          </div>
        </div>

        <BaseCard ref="sectorCard">
          <template #header>
            <span class="font-bold"
              >{{
                selectedGas === "total_ghg"
                  ? "Emissions by Gas"
                  : "Emissions by Sector"
              }}
              ({{ selectedYear }})</span
            >
          </template>
          <div class="h-[350px]">
            <SkeletonLoader v-if="loading" height="100%" />
            <SectorChart
              v-else
              :country="selectedCountry"
              :compareWith="isCompareMode ? secondCountry : null"
              :year="selectedYear"
              :gas="selectedGas"
            />
          </div>
        </BaseCard>

        <BaseCard ref="mapCard">
          <template #header>
            <span class="font-bold">Global Overview ({{ selectedYear }})</span>
          </template>
          <div class="h-[350px]">
            <SkeletonLoader v-if="loading" height="100%" />
            <EmissionsMap
              v-else
              :country="selectedCountry"
              :compareWith="isCompareMode ? secondCountry : null"
              :year="selectedYear"
              :gas="selectedGas"
            />
          </div>
        </BaseCard>
      </div>
    </div>
  </div>
</template>
