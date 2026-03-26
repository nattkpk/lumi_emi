<script setup>
import { ref, onMounted, computed, watch } from "vue";
import BaseCard from "../components/ui/BaseCard.vue";
import BaseButton from "../components/ui/BaseButton.vue";
import BaseInput from "../components/ui/BaseInput.vue";
import BaseSelect from "../components/ui/BaseSelect.vue";
import DataFormModal from "../components/ui/DataFormModal.vue";
import LoginModal from "../components/ui/LoginModal.vue";
import apiClient from "../api/client";
import { useToast } from "../composables/useToast";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  GlobeAltIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/vue/24/outline";

const toast = useToast();

const activeTab = ref("emissions");
const isLoggedIn = ref(!!localStorage.getItem("lumiemi_jwt_token"));
const loginForm = ref({ username: "", password: "" });
const loginError = ref("");
const isLoggingIn = ref(false);
const showLoginModal = ref(false);

const countries = ref([]);
const emissions = ref([]);
const loading = ref(false);
const searchQuery = ref("");
const selectedISOs = ref(["THA"]);
const isAllCountries = ref(false);

const sortKey = ref("");
const sortOrder = ref("asc");

const toggleSort = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortOrder.value = "asc";
  }
};

const showModal = ref(false);
const isEditing = ref(false);
const currentId = ref(null);
const formData = ref({
  iso_code: "",
  name: "",
  year: new Date().getFullYear(),
  gas_type: "total_ghg",
  sector: "total",
  value: 0,
  unit: "MtCO2e",
});

const gasOptions = [
  { value: "total_ghg", label: "Total GHG" },
  { value: "co2", label: "CO₂" },
  { value: "ch4", label: "CH₄" },
  { value: "n2o", label: "N₂O" },
];

const fetchCountries = async () => {
  try {
    loading.value = true;
    countries.value = await apiClient.get("/countries");
  } catch {
    /* silent */
  } finally {
    loading.value = false;
  }
};

const fetchEmissions = async () => {
  try {
    loading.value = true;
    const countryParam = isAllCountries.value
      ? "all"
      : selectedISOs.value.join(",");
    if (!countryParam && !isAllCountries.value) {
      emissions.value = [];
      return;
    }
    const res = await apiClient.get(
      `/emissions/filter?country=${countryParam}&gas=total_ghg`,
    );
    emissions.value = Array.isArray(res) ? res : [];
  } catch {
    emissions.value = [];
  } finally {
    loading.value = false;
  }
};

const addCountryTag = (iso) => {
  if (!iso) return;
  isAllCountries.value = false;
  if (!selectedISOs.value.includes(iso)) selectedISOs.value.push(iso);
  searchQuery.value = "";
  fetchEmissions();
};

const removeCountryTag = (iso) => {
  selectedISOs.value = selectedISOs.value.filter((i) => i !== iso);
  fetchEmissions();
};

const toggleAllCountries = () => {
  isAllCountries.value = !isAllCountries.value;
  selectedISOs.value = isAllCountries.value ? [] : ["THA"];
  fetchEmissions();
};

const refreshData = () => {
  if (!isLoggedIn.value) return;
  if (countries.value.length === 0) fetchCountries();
  if (activeTab.value === "countries") fetchCountries();
  else fetchEmissions();
};

const handleLogin = async () => {
  loginError.value = "";
  isLoggingIn.value = true;
  try {
    const res = await apiClient.post("/auth/login", loginForm.value);
    localStorage.setItem("lumiemi_jwt_token", res.token);
    isLoggedIn.value = true;
    showLoginModal.value = false;
    refreshData();
  } catch (err) {
    loginError.value = err.response?.data?.message || "Invalid credentials";
  } finally {
    isLoggingIn.value = false;
  }
};

const downloadCSV = () => {
  const data =
    activeTab.value === "countries" ? filteredCountries.value : emissions.value;
  if (!data || data.length === 0) {
    toast.warn("No data to export.");
    return;
  }

  const headers =
    activeTab.value === "countries"
      ? ["iso_code", "name"]
      : [
          "iso_code",
          "country_name",
          "year",
          "gas_type",
          "sector",
          "value",
          "unit",
        ];

  const csvRows = [headers.join(",")];
  for (const row of data) {
    const values = headers.map((header) => {
      let val = row[header];
      if (val === null || val === undefined) val = "";
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(","));
  }

  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const filename =
    activeTab.value === "countries"
      ? "countries_list.csv"
      : `emissions_data_${isAllCountries.value ? "all" : selectedISOs.value.join("_")}.csv`;

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const handleLogout = () => {
  localStorage.removeItem("lumiemi_jwt_token");
  isLoggedIn.value = false;
  countries.value = [];
  emissions.value = [];
};

onMounted(refreshData);
watch(activeTab, refreshData);

const openAddModal = () => {
  isEditing.value = false;
  currentId.value = null;
  formData.value = {
    iso_code: countries.value.length > 0 ? countries.value[0].iso_code : "",
    name: "",
    year: new Date().getFullYear(),
    gas_type: "total_ghg",
    sector: "total",
    value: 0,
    unit: "MtCO2e",
  };
  showModal.value = true;
};

const openEditModal = (item) => {
  isEditing.value = true;
  currentId.value = item.id;
  if (activeTab.value === "countries") {
    formData.value = { iso_code: item.iso_code, name: item.name };
  } else {
    formData.value = {
      ...item,
      iso_code:
        countries.value.find((c) => c.id === item.countryId)?.iso_code || "",
    };
  }
  showModal.value = true;
};

const handleSubmit = async () => {
  try {
    const submitData = { ...formData.value };
    if (activeTab.value === "emissions") {
      submitData.year = Number(submitData.year);
      submitData.value = Number(submitData.value);
    }

    if (activeTab.value === "countries") {
      if (isEditing.value)
        await apiClient.put(`/countries/${currentId.value}`, submitData);
      else await apiClient.post("/countries", submitData);
    } else {
      if (isEditing.value)
        await apiClient.put(`/emissions/${currentId.value}`, submitData);
      else await apiClient.post("/emissions", submitData);
    }
    showModal.value = false;
    refreshData();
    toast.success(`${isEditing.value ? "Updated" : "Added"} successfully`);
  } catch (err) {
    if (err.response?.status === 401) {
      handleLogout();
      toast.error("Session expired. Please log in again.");
    } else {
      toast.error(
        "Failed to save: " + (err.response?.data?.message || err.message),
      );
    }
  }
};

const deleteItem = async (id) => {
  if (!confirm("Are you sure you want to delete this record?")) return;
  try {
    const endpoint =
      activeTab.value === "countries" ? `/countries/${id}` : `/emissions/${id}`;
    await apiClient.delete(endpoint);
    toast.success("Deleted successfully");
    refreshData();
  } catch (err) {
    if (err.response?.status === 401) {
      handleLogout();
      toast.error("Session expired. Please log in again.");
    } else {
      toast.error(
        "Failed to delete: " + (err.response?.data?.message || err.message),
      );
    }
  }
};

const applySorting = (list) => {
  if (!sortKey.value) return list;
  const key = sortKey.value;
  const dir = sortOrder.value === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    const va = a[key];
    const vb = b[key];
    if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
    return String(va).localeCompare(String(vb)) * dir;
  });
};

const filteredCountries = computed(() => {
  let list = countries.value;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.iso_code.toLowerCase().includes(q),
    );
  }
  return applySorting(list);
});

const filteredEmissions = computed(() => {
  let list = emissions.value;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(
      (e) =>
        e.iso_code.toLowerCase().includes(q) ||
        e.country_name.toLowerCase().includes(q) ||
        String(e.year).includes(q),
    );
  }
  return applySorting(list);
});
</script>

<template>
  <div
    class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500"
  >
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div>
        <h1
          class="text-3xl lg:text-4xl font-bold font-heading text-text-main tracking-tight"
        >
          Data Management
        </h1>
        <p class="text-text-muted mt-2 font-sans text-lg">
          Browse, export, and manage greenhouse gas records.
        </p>
      </div>
      <div class="flex gap-3">
        <template v-if="isLoggedIn">
          <BaseButton
            variant="ghost"
            @click="handleLogout"
            class="text-brand-primary hover:bg-red-10 dark:text-white dark:hover:bg-red-900/20"
            >Logout</BaseButton
          >
          <BaseButton @click="openAddModal" class="shadow-md">
            <PlusIcon class="w-5 h-5 mr-2" />
            Add {{ activeTab === "countries" ? "Country" : "Emission" }}
          </BaseButton>
        </template>
      </div>
    </div>

    <div v-if="!isLoggedIn" class="flex flex-col items-center justify-center py-24 space-y-6">
      <div class="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center">
        <svg class="w-10 h-10 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
      </div>
      <h2 class="text-2xl font-bold text-text-main font-heading">Login Required</h2>
      <p class="text-text-muted text-center max-w-md">Please log in with your admin credentials to browse, export, and manage greenhouse gas emission records.</p>
      <BaseButton @click="showLoginModal = true" class="shadow-md px-8 py-3 text-base">Admin Login</BaseButton>
    </div>

    <template v-if="isLoggedIn">
    <div
      class="flex space-x-1 bg-bg-secondary p-1 rounded-full w-fit border border-border-subtle"
    >
      <button
        @click="activeTab = 'emissions'"
        class="px-6 py-2 rounded-full text-sm font-medium transition-all"
        :class="
          activeTab === 'emissions'
            ? 'bg-white text-brand-primary shadow-sm border border-border-subtle'
            : 'text-text-muted hover:text-text-main'
        "
      >
        <CloudArrowUpIcon class="w-4 h-4 inline-block mr-2" />Emissions
      </button>
      <button
        @click="activeTab = 'countries'"
        class="px-6 py-2 rounded-full text-sm font-medium transition-all"
        :class="
          activeTab === 'countries'
            ? 'bg-white text-brand-primary shadow-sm border border-border-subtle'
            : 'text-text-muted hover:text-text-main'
        "
      >
        <GlobeAltIcon class="w-4 h-4 inline-block mr-2" />Countries
      </button>
    </div>

    <div class="flex flex-col items-stretch space-y-4">
      <div
        v-if="activeTab === 'emissions'"
        class="flex flex-wrap gap-2 p-3 bg-bg-secondary rounded-2xl border border-border-subtle min-h-[56px] items-center"
      >
        <span
          class="text-xs font-bold text-text-muted uppercase px-2 w-full mb-1"
          >Filter Countries:</span
        >
        <button
          @click="toggleAllCountries"
          class="px-4 py-1.5 rounded-full text-sm font-bold transition-all border"
          :class="
            isAllCountries
              ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
              : 'bg-white text-text-muted border-border-subtle hover:border-brand-primary dark:bg-bg-main dark:border-border-subtle dark:hover:border-brand-primary'
          "
        >
          All Countries
        </button>
        <template v-if="!isAllCountries">
          <div
            v-for="iso in selectedISOs"
            :key="iso"
            class="flex items-center space-x-1 bg-white border border-border-subtle px-3 py-1.5 rounded-full shadow-sm animate-in zoom-in duration-200 dark:bg-bg-main dark:border-border-subtle dark:hover:border-brand-primary"
          >
            <span class="text-sm font-bold ">{{ iso }}</span>
            <button
              @click="removeCountryTag(iso)"
              class="text-text-muted hover:text-red-500 rounded-full transition-colors"
            >
              <XMarkIcon class="w-4 h-4" />
            </button>
          </div>
        </template>
        <div class="relative min-w-[200px]" v-if="!isAllCountries">
          <select
            @change="(e) => addCountryTag(e.target.value)"
            class="w-full bg-white border border-border-subtle rounded-full px-4 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-primary transition-all appearance-none cursor-pointer dark:bg-bg-main dark:border-border-subtle dark:hover:border-brand-primary"
          >
            <option value="" disabled selected>Add Country...</option>
            <option
              v-for="c in countries"
              :key="c.iso_code"
              :value="c.iso_code"
            >
              {{ c.name }} ({{ c.iso_code }})
            </option>
          </select>
          <PlusIcon
            class="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
        </div>
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center space-x-4 w-full sm:w-auto">
          <div class="relative flex-1 sm:w-80">
            <MagnifyingGlassIcon
              class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              v-model="searchQuery"
              :placeholder="
                activeTab === 'countries'
                  ? 'Search countries...'
                  : 'Quick find in table...'
              "
              class="w-full pl-10 pr-4 py-2 bg-white dark:bg-bg-main border border-border-subtle rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all"
            />
          </div>
        </div>
        <div class="flex items-center space-x-3 w-full sm:w-auto">
          <BaseButton
            @click="downloadCSV"
            class="w-full sm:w-auto bg-brand-primary hover:bg-brand-primary/80 text-white shadow-md"
          >
            <ArrowDownTrayIcon class="w-5 h-5 mr-2" />Export to CSV
          </BaseButton>
        </div>
      </div>
    </div>

    <div class="minimal-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-bg-secondary border-b border-border-subtle">
              <th
                v-if="activeTab === 'countries'"
                class="px-6 py-4 text-xs font-bold text-text-main uppercase tracking-wider cursor-pointer select-none hover:text-brand-primary transition-colors"
                @click="toggleSort('iso_code')"
              >
                <span class="inline-flex items-center gap-1">ISO Code
                  <ChevronUpIcon v-if="sortKey === 'iso_code' && sortOrder === 'asc'" class="w-3 h-3" />
                  <ChevronDownIcon v-else-if="sortKey === 'iso_code' && sortOrder === 'desc'" class="w-3 h-3" />
                </span>
              </th>
              <th
                v-if="activeTab === 'countries'"
                class="px-6 py-4 text-xs font-bold text-text-main uppercase tracking-wider cursor-pointer select-none hover:text-brand-primary transition-colors"
                @click="toggleSort('name')"
              >
                <span class="inline-flex items-center gap-1">Country Name
                  <ChevronUpIcon v-if="sortKey === 'name' && sortOrder === 'asc'" class="w-3 h-3" />
                  <ChevronDownIcon v-else-if="sortKey === 'name' && sortOrder === 'desc'" class="w-3 h-3" />
                </span>
              </th>
              <th
                v-if="activeTab === 'emissions'"
                class="px-6 py-4 text-xs font-bold text-text-main uppercase tracking-wider cursor-pointer select-none hover:text-brand-primary transition-colors"
                @click="toggleSort('iso_code')"
              >
                <span class="inline-flex items-center gap-1">Country
                  <ChevronUpIcon v-if="sortKey === 'iso_code' && sortOrder === 'asc'" class="w-3 h-3" />
                  <ChevronDownIcon v-else-if="sortKey === 'iso_code' && sortOrder === 'desc'" class="w-3 h-3" />
                </span>
              </th>
              <th
                v-if="activeTab === 'emissions'"
                class="px-6 py-4 text-xs font-bold text-text-main uppercase tracking-wider cursor-pointer select-none hover:text-brand-primary transition-colors"
                @click="toggleSort('year')"
              >
                <span class="inline-flex items-center gap-1">Year
                  <ChevronUpIcon v-if="sortKey === 'year' && sortOrder === 'asc'" class="w-3 h-3" />
                  <ChevronDownIcon v-else-if="sortKey === 'year' && sortOrder === 'desc'" class="w-3 h-3" />
                </span>
              </th>
              <th
                v-if="activeTab === 'emissions'"
                class="px-6 py-4 text-xs font-bold text-text-main uppercase tracking-wider cursor-pointer select-none hover:text-brand-primary transition-colors"
                @click="toggleSort('gas_type')"
              >
                <span class="inline-flex items-center gap-1">Gas
                  <ChevronUpIcon v-if="sortKey === 'gas_type' && sortOrder === 'asc'" class="w-3 h-3" />
                  <ChevronDownIcon v-else-if="sortKey === 'gas_type' && sortOrder === 'desc'" class="w-3 h-3" />
                </span>
              </th>
              <th
                v-if="activeTab === 'emissions'"
                class="px-6 py-4 text-xs font-bold text-text-main uppercase tracking-wider cursor-pointer select-none hover:text-brand-primary transition-colors"
                @click="toggleSort('sector')"
              >
                <span class="inline-flex items-center gap-1">Sector
                  <ChevronUpIcon v-if="sortKey === 'sector' && sortOrder === 'asc'" class="w-3 h-3" />
                  <ChevronDownIcon v-else-if="sortKey === 'sector' && sortOrder === 'desc'" class="w-3 h-3" />
                </span>
              </th>
              <th
                v-if="activeTab === 'emissions'"
                class="px-6 py-4 text-xs font-bold text-text-main uppercase tracking-wider text-right cursor-pointer select-none hover:text-brand-primary transition-colors"
                @click="toggleSort('value')"
              >
                <span class="inline-flex items-center gap-1 justify-end w-full">Value
                  <ChevronUpIcon v-if="sortKey === 'value' && sortOrder === 'asc'" class="w-3 h-3" />
                  <ChevronDownIcon v-else-if="sortKey === 'value' && sortOrder === 'desc'" class="w-3 h-3" />
                </span>
              </th>
              <th
                v-if="isLoggedIn"
                class="px-6 py-4 text-xs font-bold text-text-main uppercase tracking-wider text-right"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-subtle">
            <template v-if="activeTab === 'countries'">
              <tr
                v-for="c in filteredCountries"
                :key="c.id"
                class="hover:bg-bg-secondary/50 transition-colors"
              >
                <td class="px-6 py-4 text-sm font-semibold text-brand-primary dark:text-white">
                  {{ c.iso_code }}
                </td>
                <td class="px-6 py-4 text-sm text-text-main">{{ c.name }}</td>
                <td v-if="isLoggedIn" class="px-6 py-4 text-right space-x-2">
                  <button
                    @click="openEditModal(c)"
                    class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <PencilSquareIcon class="w-5 h-5" />
                  </button>
                  <button
                    @click="deleteItem(c.id)"
                    class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon class="w-5 h-5" />
                  </button>
                </td>
              </tr>
            </template>
            <template v-if="activeTab === 'emissions'">
              <tr
                v-for="e in filteredEmissions"
                :key="e.id"
                class="hover:bg-bg-secondary/50 transition-colors"
              >
                <td class="px-6 py-4 text-sm font-bold text-brand-primary dark:text-white">
                  <div class="flex flex-col">
                    <span>{{ e.iso_code }}</span>
                    <span class="text-[10px] text-text-muted font-normal">{{
                      e.country_name
                    }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm font-medium text-text-main">
                  {{ e.year }}
                </td>
                <td class="px-6 py-4 text-sm">
                  <span
                    class="px-2 py-0.5 rounded-md text-xs font-bold bg-bg-secondary border border-border-subtle uppercase"
                    >{{ e.gas_type }}</span
                  >
                </td>
                <td class="px-6 py-4 text-sm text-text-muted capitalize">
                  {{ e.sector }}
                </td>
                <td
                  class="px-6 py-4 text-sm font-semibold text-text-main text-right"
                >
                  {{ e.value.toLocaleString() }}
                  <small class="font-normal text-text-muted">{{
                    e.unit
                  }}</small>
                </td>
                <td v-if="isLoggedIn" class="px-6 py-4 text-right space-x-2">
                  <button
                    @click="openEditModal(e)"
                    class="p-2 text-white hover:bg-brand-primary rounded-lg transition-colors flex-shrink-0"
                  >
                    <PencilSquareIcon class="w-5 h-5" />
                  </button>
                  <button
                    @click="deleteItem(e.id)"
                    class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  >
                    <TrashIcon class="w-5 h-5" />
                  </button>
                </td>
              </tr>
              <tr
                v-if="filteredEmissions.length === 0 && !loading"
                class="text-center"
              >
                <td colspan="6" class="py-12 text-text-muted text-sm italic">
                  No records to display. Select countries above to filter data.
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <div
        v-if="loading"
        class="py-12 flex justify-center border-t border-border-subtle bg-bg-secondary/20"
      >
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"
        ></div>
      </div>
    </div>

    <DataFormModal
      :show="showModal"
      :isEditing="isEditing"
      :activeTab="activeTab"
      :formData="formData"
      :countries="countries"
      :gasOptions="gasOptions"
      @close="showModal = false"
      @submit="handleSubmit"
      @update:formData="formData = $event"
    />
    </template>

    <LoginModal
      :show="showLoginModal && !isLoggedIn"
      :loginForm="loginForm"
      :loginError="loginError"
      :isLoggingIn="isLoggingIn"
      @close="showLoginModal = false"
      @submit="handleLogin"
      @update:loginForm="loginForm = $event"
    />
  </div>
</template>
