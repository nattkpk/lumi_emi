<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseInput from '../components/ui/BaseInput.vue'
import BaseSelect from '../components/ui/BaseSelect.vue'
import apiClient from '../api/client'
import { 
  PlusIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  GlobeAltIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  ArrowDownTrayIcon
} from '@heroicons/vue/24/outline'

// Tabs
const activeTab = ref('emissions') // 'emissions' or 'countries'

// Auth State
const isLoggedIn = ref(!!localStorage.getItem('locrab_jwt_token'))
const loginForm = ref({ username: '', password: '' })
const loginError = ref('')
const isLoggingIn = ref(false)
const showLoginModal = ref(false)

// Data State
const countries = ref([])
const emissions = ref([])
const loading = ref(false)
const searchQuery = ref('')

// Form State
const showModal = ref(false)
const isEditing = ref(false)
const currentId = ref(null)
const formData = ref({
  // Common
  iso_code: '',
  name: '',
  // Emissions specific
  year: new Date().getFullYear(),
  gas_type: 'total_ghg',
  sector: 'total',
  value: 0,
  unit: 'MtCO2e'
})

// Options
const gasOptions = [
  { value: 'total_ghg', label: 'Total GHG' },
  { value: 'co2', label: 'CO₂' },
  { value: 'ch4', label: 'CH₄' },
  { value: 'n2o', label: 'N₂O' }
]

// Fetching
const fetchCountries = async () => {
  try {
    loading.value = true
    countries.value = await apiClient.get('/countries')
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const fetchEmissions = async () => {
  try {
    loading.value = true
    // Fetch a subset or allow search. For simplicity, let's fetch trend for a default or currently selected country if possible.
    // Or add a general search endpoint. Let's assume we can filter by country in emissions.
    // Given current API, we usually fetch by country.
    if (searchQuery.value) {
      emissions.value = await apiClient.get(`/emissions/trend?country=${searchQuery.value}`)
    } else {
      // Default fallback or empty
      emissions.value = []
    }
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  if (!isLoggedIn.value) return
  if (activeTab.value === 'countries') fetchCountries()
  else fetchEmissions()
}

// Auth Actions
const handleLogin = async () => {
  loginError.value = ''
  isLoggingIn.value = true
  try {
    const res = await apiClient.post('/auth/login', loginForm.value)
    localStorage.setItem('locrab_jwt_token', res.token)
    isLoggedIn.value = true
    showLoginModal.value = false
    refreshData()
  } catch (err) {
    loginError.value = err.response?.data?.message || 'Invalid credentials'
  } finally {
    isLoggingIn.value = false
  }
}

const downloadCSV = () => {
  const data = activeTab.value === 'countries' ? filteredCountries.value : emissions.value
  if (!data || data.length === 0) {
    alert('No data to export.')
    return
  }
  
  const headers = Object.keys(data[0]).filter(k => k !== 'createdAt' && k !== 'updatedAt')
  const csvRows = [headers.join(',')]
  
  for (const row of data) {
    const values = headers.map(header => {
      let val = row[header]
      if (val === null || val === undefined) val = ''
      return `"${String(val).replace(/"/g, '""')}"`
    })
    csvRows.push(values.join(','))
  }
  
  const csvString = csvRows.join('\n')
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${activeTab.value}_export.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const handleLogout = () => {
  localStorage.removeItem('locrab_jwt_token')
  isLoggedIn.value = false
  countries.value = []
  emissions.value = []
}

onMounted(refreshData)
watch(activeTab, refreshData)

// CRUD Actions
const openAddModal = () => {
  isEditing.value = false
  currentId.value = null
  formData.value = {
    iso_code: '',
    name: '',
    year: new Date().getFullYear(),
    gas_type: 'total_ghg',
    sector: 'total',
    value: 0,
    unit: 'MtCO2e'
  }
  showModal.value = true
}

const openEditModal = (item) => {
  isEditing.value = true
  currentId.value = item.id
  if (activeTab.value === 'countries') {
    formData.value = { iso_code: item.iso_code, name: item.name }
  } else {
    // Emissions record usually has country relation
    formData.value = { ...item, iso_code: countries.value.find(c => c.id === item.countryId)?.iso_code || '' }
  }
  showModal.value = true
}

const handleSubmit = async () => {
  try {
    if (activeTab.value === 'countries') {
      if (isEditing.value) {
        await apiClient.put(`/countries/${currentId.value}`, formData.value)
      } else {
        await apiClient.post('/countries', formData.value)
      }
    } else {
      if (isEditing.value) {
        await apiClient.put(`/emissions/${currentId.value}`, formData.value)
      } else {
        await apiClient.post('/emissions', formData.value)
      }
    }
    showModal.value = false
    refreshData()
  } catch (err) {
    if (err.response?.status === 401) {
      handleLogout()
      alert('Session expired. Please log in again.')
    } else {
      alert('Failed to save data: ' + (err.response?.data?.message || err.message))
    }
  }
}

const deleteItem = async (id) => {
  if (!confirm('Are you sure you want to delete this record?')) return
  try {
    const endpoint = activeTab.value === 'countries' ? `/countries/${id}` : `/emissions/${id}`
    await apiClient.delete(endpoint)
    refreshData()
  } catch (err) {
    if (err.response?.status === 401) {
      handleLogout()
      alert('Session expired. Please log in again.')
    } else {
      alert('Failed to delete: ' + (err.response?.data?.message || err.message))
    }
  }
}

const filteredCountries = computed(() => {
  if (!searchQuery.value) return countries.value
  const q = searchQuery.value.toLowerCase()
  return countries.value.filter(c => c.name.toLowerCase().includes(q) || c.iso_code.toLowerCase().includes(q))
})

</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
    
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl lg:text-4xl font-bold font-heading text-text-main tracking-tight">Data Management</h1>
        <p class="text-text-muted mt-2 font-sans text-lg">Browse, export, and manage greenhouse gas records.</p>
      </div>
      <div class="flex gap-3">
        <template v-if="isLoggedIn">
          <BaseButton variant="ghost" @click="handleLogout" class="text-red-600 hover:text-red-700 hover:bg-red-50">
            Logout
          </BaseButton>
          <BaseButton @click="openAddModal" class="shadow-md">
            <PlusIcon class="w-5 h-5 mr-2" />
            Add {{ activeTab === 'countries' ? 'Country' : 'Emission' }}
          </BaseButton>
        </template>
        <template v-else>
          <BaseButton variant="secondary" @click="showLoginModal = true">
            Admin Login
          </BaseButton>
        </template>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex space-x-1 bg-bg-secondary p-1 rounded-full w-fit border border-border-subtle">
      <button 
        @click="activeTab = 'emissions'"
        class="px-6 py-2 rounded-full text-sm font-medium transition-all"
        :class="activeTab === 'emissions' ? 'bg-white text-brand-primary shadow-sm border border-border-subtle' : 'text-text-muted hover:text-text-main'"
      >
        <CloudArrowUpIcon class="w-4 h-4 inline-block mr-2" />
        Emissions
      </button>
      <button 
        @click="activeTab = 'countries'"
        class="px-6 py-2 rounded-full text-sm font-medium transition-all"
        :class="activeTab === 'countries' ? 'bg-white text-brand-primary shadow-sm border border-border-subtle' : 'text-text-muted hover:text-text-main'"
      >
        <GlobeAltIcon class="w-4 h-4 inline-block mr-2" />
        Countries
      </button>
    </div>

    <!-- Toolbar -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center space-x-4 w-full sm:w-auto">
        <div class="relative flex-1 sm:w-80">
          <MagnifyingGlassIcon class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            v-model="searchQuery"
            :placeholder="activeTab === 'countries' ? 'Search countries...' : 'Type country code (e.g. THA)...'"
            class="w-full pl-10 pr-4 py-2 bg-white dark:bg-bg-main border border-border-subtle rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all"
            @keyup.enter="activeTab === 'emissions' && fetchEmissions()"
          />
        </div>
        <BaseButton v-if="activeTab === 'emissions'" variant="secondary" @click="fetchEmissions">
          Search
        </BaseButton>
      </div>
      <BaseButton @click="downloadCSV" class="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
        <ArrowDownTrayIcon class="w-5 h-5 sm:mr-2" />
        <span class="hidden sm:inline">Export to CSV</span>
      </BaseButton>
    </div>

    <!-- Data Table -->
    <div class="minimal-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-bg-secondary border-b border-border-subtle">
              <th v-if="activeTab === 'countries'" class="px-6 py-4 text-xs font-bold text-text-main uppercase tracking-wider">ISO Code</th>
              <th v-if="activeTab === 'countries'" class="px-6 py-4 text-xs font-bold text-text-main uppercase tracking-wider">Country Name</th>
              
              <th v-if="activeTab === 'emissions'" class="px-6 py-4 text-xs font-bold text-text-main uppercase tracking-wider">Year</th>
              <th v-if="activeTab === 'emissions'" class="px-6 py-4 text-xs font-bold text-text-main uppercase tracking-wider">Gas</th>
              <th v-if="activeTab === 'emissions'" class="px-6 py-4 text-xs font-bold text-text-main uppercase tracking-wider">Sector</th>
              <th v-if="activeTab === 'emissions'" class="px-6 py-4 text-xs font-bold text-text-main uppercase tracking-wider text-right">Value</th>
              
              <th v-if="isLoggedIn" class="px-6 py-4 text-xs font-bold text-text-main uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-subtle">
            <!-- Countries List -->
            <template v-if="activeTab === 'countries'">
              <tr v-for="c in filteredCountries" :key="c.id" class="hover:bg-bg-secondary/50 transition-colors">
                <td class="px-6 py-4 text-sm font-semibold text-brand-primary">{{ c.iso_code }}</td>
                <td class="px-6 py-4 text-sm text-text-main">{{ c.name }}</td>
                <td v-if="isLoggedIn" class="px-6 py-4 text-right space-x-2">
                  <button @click="openEditModal(c)" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <PencilSquareIcon class="w-5 h-5" />
                  </button>
                  <button @click="deleteItem(c.id)" class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <TrashIcon class="w-5 h-5" />
                  </button>
                </td>
              </tr>
            </template>

            <!-- Emissions List -->
            <template v-if="activeTab === 'emissions'">
              <tr v-for="e in emissions" :key="e.id" class="hover:bg-bg-secondary/50 transition-colors">
                <td class="px-6 py-4 text-sm font-medium text-text-main">{{ e.year }}</td>
                <td class="px-6 py-4 text-sm">
                  <span class="px-2 py-0.5 rounded-md text-xs font-bold bg-bg-secondary border border-border-subtle uppercase">
                    {{ e.gas_type }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-text-muted capitalize">{{ e.sector }}</td>
                <td class="px-6 py-4 text-sm font-semibold text-text-main text-right">{{ e.value.toLocaleString() }} <small class="font-normal text-text-muted">{{ e.unit }}</small></td>
                <td v-if="isLoggedIn" class="px-6 py-4 text-right space-x-2">
                  <button @click="openEditModal(e)" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0">
                    <PencilSquareIcon class="w-5 h-5" />
                  </button>
                  <button @click="deleteItem(e.id)" class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                    <TrashIcon class="w-5 h-5" />
                  </button>
                </td>
              </tr>
              <tr v-if="emissions.length === 0 && !loading" class="text-center">
                <td colspan="5" class="py-12 text-text-muted text-sm italic">
                  No records to display. Use search to find data by country code.
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      
      <!-- Loading Overlay -->
      <div v-if="loading" class="py-12 flex justify-center border-t border-border-subtle bg-bg-secondary/20">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    </div>

    <!-- Form Modal -->
    <div v-if="showModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-brand-primary/20 backdrop-blur-sm" @click="showModal = false"></div>
      <div class="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-border-subtle animate-in fade-in zoom-in duration-200">
        <div class="px-8 py-6 border-b border-border-subtle flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-text-main">{{ isEditing ? 'Edit' : 'Add New' }} {{ activeTab === 'countries' ? 'Country' : 'Emission' }}</h2>
          </div>
          <button @click="showModal = false" class="text-text-muted hover:text-text-main p-1 rounded-full hover:bg-bg-secondary transition-colors">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="p-8 space-y-5">
          <div v-if="activeTab === 'countries'" class="space-y-4">
            <BaseInput v-model="formData.iso_code" label="ISO Code" placeholder="e.g. THA" />
            <BaseInput v-model="formData.name" label="Country Name" placeholder="e.g. Thailand" />
          </div>

          <div v-else class="space-y-4">
            <BaseSelect v-model="formData.iso_code" label="Select Country" :options="countries.map(c => ({ value: c.iso_code, label: c.name }))" />
            <div class="grid grid-cols-2 gap-4">
              <BaseInput v-model="formData.year" type="number" label="Year" />
              <BaseSelect v-model="formData.gas_type" label="Gas Type" :options="gasOptions" />
            </div>
            <BaseInput v-model="formData.sector" label="Sector" placeholder="e.g. energy, transport, total" />
            <BaseInput v-model="formData.value" type="number" step="0.01" label="Value" />
          </div>

          <div class="flex justify-end pt-4 space-x-3">
            <BaseButton variant="ghost" @click="showModal = false">Cancel</BaseButton>
            <BaseButton type="submit">Save Changes</BaseButton>
          </div>
        </form>
      </div>
    </div>

    <!-- Login Modal -->
    <div v-if="showLoginModal && !isLoggedIn" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-brand-primary/20 backdrop-blur-sm" @click="showLoginModal = false"></div>
      <div class="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-border-subtle animate-in fade-in zoom-in duration-200 p-8">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h2 class="text-2xl font-bold text-text-main">Admin Login</h2>
          <p class="text-text-muted mt-2">Authentication required to manage database records.</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <BaseInput v-model="loginForm.username" label="Username" placeholder="Enter admin username" required />
          <BaseInput v-model="loginForm.password" type="password" label="Password" placeholder="Enter password" required />
          
          <div v-if="loginError" class="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {{ loginError }}
          </div>

          <BaseButton type="submit" class="w-full mt-4" :disabled="isLoggingIn">
            {{ isLoggingIn ? 'Authenticating...' : 'Login securely' }}
          </BaseButton>
        </form>
        
        <button @click="showLoginModal = false" class="absolute top-4 right-4 text-text-muted hover:text-text-main p-1 rounded-full hover:bg-bg-secondary transition-colors">
          <XMarkIcon class="w-6 h-6" />
        </button>
      </div>
    </div>

  </div>
</template>
