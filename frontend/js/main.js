import {
  AlertCircle,
  ArrowDown,
  ChartNoAxesCombined,
  CheckCircle2,
  createIcons,
  Eye,
  EyeOff,
  FileSpreadsheet,
  LockKeyhole,
  LogIn,
  Moon,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sun,
  Table2,
  Trash2,
  UploadCloud,
  UserPlus,
  WandSparkles,
  Weight,
  X,
} from 'lucide'

const iconSet = {
  AlertCircle,
  ArrowDown,
  ChartNoAxesCombined,
  CheckCircle2,
  Eye,
  EyeOff,
  FileSpreadsheet,
  LockKeyhole,
  LogIn,
  Moon,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sun,
  Table2,
  Trash2,
  UploadCloud,
  UserPlus,
  WandSparkles,
  Weight,
  X,
}

function renderIcons() {
  createIcons({ icons: iconSet, attrs: { 'stroke-width': 1.8 } })
}

renderIcons()

function createHeroParticles() {
  const particleLayer = document.querySelector('.hero__particles')
  if (!particleLayer) return

  const isCompactViewport = window.matchMedia('(max-width: 760px)').matches
  const particleCount = isCompactViewport ? 22 : 38
  const fragment = document.createDocumentFragment()
  let seed = 76421

  const random = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }

  for (let index = 0; index < particleCount; index += 1) {
    const particle = document.createElement('span')
    const size = 2.2 + random() * 4.1
    const duration = 11 + random() * 9
    const driftX = -42 + random() * 84
    const driftY = -32 + random() * 64

    particle.className = `hero__particle${index % 9 === 0 ? ' hero__particle--gold' : ''}`
    particle.style.setProperty('--particle-x', `${2 + random() * 96}%`)
    particle.style.setProperty('--particle-y', `${4 + random() * 91}%`)
    particle.style.setProperty('--particle-size', `${size.toFixed(2)}px`)
    particle.style.setProperty('--particle-opacity', (0.62 + random() * 0.36).toFixed(2))
    particle.style.setProperty('--particle-duration', `${duration.toFixed(2)}s`)
    particle.style.setProperty('--particle-twinkle', `${(4.8 + random() * 5.2).toFixed(2)}s`)
    particle.style.setProperty('--particle-delay', `${(-random() * duration).toFixed(2)}s`)
    particle.style.setProperty('--particle-drift-x', `${driftX.toFixed(2)}px`)
    particle.style.setProperty('--particle-drift-y', `${driftY.toFixed(2)}px`)
    particle.style.setProperty('--particle-drift-x-alt', `${(-driftX * 0.82).toFixed(2)}px`)
    particle.style.setProperty('--particle-drift-y-alt', `${(-driftY * 0.9).toFixed(2)}px`)
    fragment.append(particle)
  }

  particleLayer.replaceChildren(fragment)
}

createHeroParticles()

const root = document.documentElement
const themeToggle = document.querySelector('#theme-toggle')
const themeColor = document.querySelector('meta[name="theme-color"]')

function applyTheme(theme) {
  root.dataset.theme = theme
  root.style.colorScheme = theme
  localStorage.setItem('gerencia-theme', theme)
  themeToggle.setAttribute('aria-label', `Ativar tema ${theme === 'light' ? 'escuro' : 'claro'}`)
  themeColor.setAttribute('content', theme === 'dark' ? '#07100c' : '#F3F0E8')
}

applyTheme(root.dataset.theme === 'dark' ? 'dark' : 'light')

themeToggle.addEventListener('click', () => {
  applyTheme(root.dataset.theme === 'light' ? 'dark' : 'light')
})

const authPanel = document.querySelector('#auth-panel')
const authTriggers = document.querySelectorAll('.auth-trigger')
const authClose = document.querySelector('#auth-close')
const loginTab = document.querySelector('#login-tab')
const registerTab = document.querySelector('#register-tab')
const loginForm = document.querySelector('#login-form')
const registerForm = document.querySelector('#register-form')
const authMessage = document.querySelector('#auth-message')
let currentAuthView = 'login'

function showAuthView(view) {
  currentAuthView = view
  const showLogin = view === 'login'
  loginTab.setAttribute('aria-selected', String(showLogin))
  registerTab.setAttribute('aria-selected', String(!showLogin))
  loginTab.tabIndex = showLogin ? 0 : -1
  registerTab.tabIndex = showLogin ? -1 : 0
  loginForm.hidden = !showLogin
  registerForm.hidden = showLogin
  authMessage.textContent = ''
}

function setAuthPanel(open, view = currentAuthView) {
  authPanel.hidden = !open
  authTriggers.forEach((trigger) => trigger.setAttribute('aria-expanded', String(open)))

  if (open) {
    showAuthView(view)
    requestAnimationFrame(() => (view === 'login' ? loginTab : registerTab).focus())
  }
}

authTriggers.forEach((trigger) => {
  trigger.setAttribute('aria-controls', 'auth-panel')
  trigger.setAttribute('aria-expanded', 'false')
  trigger.addEventListener('click', () => {
    const requestedView = trigger.dataset.authView
    const shouldClose = !authPanel.hidden && requestedView === currentAuthView
    setAuthPanel(!shouldClose, requestedView)
  })
})

authClose?.addEventListener('click', () => setAuthPanel(false))
loginTab.addEventListener('click', () => showAuthView('login'))
registerTab.addEventListener('click', () => showAuthView('register'))

document.querySelector('.auth-tabs').addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault()
    const nextView = currentAuthView === 'login' ? 'register' : 'login'
    showAuthView(nextView)
    ;(nextView === 'login' ? loginTab : registerTab).focus()
  }
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !authPanel.hidden) setAuthPanel(false)
})

document.querySelectorAll('.password-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    const input = document.getElementById(button.dataset.passwordTarget)
    const showPassword = input.type === 'password'
    input.type = showPassword ? 'text' : 'password'
    button.setAttribute('aria-label', showPassword ? 'Ocultar senha' : 'Mostrar senha')
    button.innerHTML = `<i data-lucide="${showPassword ? 'eye-off' : 'eye'}" aria-hidden="true"></i>`
    renderIcons()
  })
})

document.querySelectorAll('.auth-form').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    authMessage.textContent = 'Demonstração visual: nenhuma informação foi enviada ou armazenada.'
    form.reset()
  })
})

const MAX_FILE_SIZE = 25 * 1024 * 1024
const ACCEPTED_EXTENSIONS = ['csv', 'xlsx']
const fileInput = document.querySelector('#file-upload')
const dropzone = document.querySelector('#dropzone')
const emptyState = document.querySelector('#dropzone-empty')
const selectedState = document.querySelector('#selected-file')
const selectButton = document.querySelector('#select-file')
const replaceButton = document.querySelector('#replace-file')
const removeButton = document.querySelector('#remove-file')
const fileName = document.querySelector('#file-name')
const fileMeta = document.querySelector('#file-meta')
const feedback = document.querySelector('#upload-feedback')
let selectedFile = null

function getExtension(name) {
  return name.split('.').pop()?.toLowerCase() || ''
}

function formatFileSize(size) {
  if (size < 1024) return `${size} bytes`
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(size / 1024 / 1024)} MB`
}

function validateFile(file) {
  if (!ACCEPTED_EXTENSIONS.includes(getExtension(file.name))) {
    return 'Formato não aceito. Selecione um arquivo CSV ou XLSX.'
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'O arquivo excede o limite de 25 MB. Escolha um arquivo menor.'
  }

  return ''
}

function setFeedback(message, isError = false) {
  feedback.classList.toggle('upload-feedback--error', isError)
  feedback.innerHTML = `<p ${isError ? 'role="alert"' : ''}><i data-lucide="${isError ? 'alert-circle' : 'shield-check'}" aria-hidden="true"></i>${message}</p>`
  renderIcons()
}

function showEmptyState() {
  selectedFile = null
  emptyState.hidden = false
  selectedState.hidden = true
  dropzone.classList.remove('dropzone--selected', 'dropzone--error')
  dropzone.setAttribute('role', 'button')
  dropzone.tabIndex = 0
  dropzone.setAttribute('aria-label', 'Selecionar arquivo CSV ou XLSX')
  dropzone.setAttribute('aria-describedby', 'upload-formats upload-feedback')
  fileInput.value = ''
}

function showSelectedFile(file) {
  selectedFile = file
  emptyState.hidden = true
  selectedState.hidden = false
  fileName.textContent = file.name
  fileMeta.textContent = `${getExtension(file.name).toUpperCase()} · ${formatFileSize(file.size)}`
  dropzone.classList.add('dropzone--selected')
  dropzone.classList.remove('dropzone--error')
  dropzone.setAttribute('role', 'group')
  dropzone.removeAttribute('tabindex')
  dropzone.setAttribute('aria-label', `Arquivo selecionado: ${file.name}`)
  dropzone.setAttribute('aria-describedby', 'upload-feedback')
  setFeedback('Arquivo validado localmente. Ele ainda não foi enviado.', false)
}

function handleFile(file) {
  const error = validateFile(file)

  if (error) {
    showEmptyState()
    dropzone.classList.add('dropzone--error')
    setFeedback(error, true)
    return
  }

  showSelectedFile(file)
}

function openFilePicker() {
  fileInput.click()
}

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0]
  if (file) handleFile(file)
})

selectButton.addEventListener('click', (event) => {
  event.stopPropagation()
  openFilePicker()
})

dropzone.addEventListener('click', () => {
  if (!selectedFile) openFilePicker()
})

dropzone.addEventListener('keydown', (event) => {
  if (!selectedFile && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault()
    openFilePicker()
  }
})

;['dragenter', 'dragover'].forEach((eventName) => {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault()
    dropzone.classList.add('dropzone--dragging')
  })
})

dropzone.addEventListener('dragleave', (event) => {
  if (!dropzone.contains(event.relatedTarget)) dropzone.classList.remove('dropzone--dragging')
})

dropzone.addEventListener('drop', (event) => {
  event.preventDefault()
  dropzone.classList.remove('dropzone--dragging')
  const file = event.dataTransfer.files?.[0]
  if (file) handleFile(file)
})

replaceButton.addEventListener('click', (event) => {
  event.stopPropagation()
  fileInput.value = ''
  openFilePicker()
})

removeButton.addEventListener('click', (event) => {
  event.stopPropagation()
  showEmptyState()
  setFeedback('Nesta demonstração, o arquivo permanece somente no seu navegador.', false)
})

const expensePeriods = {
  quarter: {
    label: 'Últimos 3 meses',
    insight: 'Alimentação caiu 14 p.p. desde abril',
    rows: [],
  },
  june: {
    label: 'Junho',
    insight: 'Moradia superou Alimentação',
    rows: [
      { category: 'Moradia', value: 1750, change: 8, color: '#6ba7d6' },
      { category: 'Alimentação', value: 1550, change: -8, color: '#48c78b' },
      { category: 'Transporte', value: 650, change: 1, color: '#d6a85e' },
      { category: 'Saúde', value: 400, change: 0, color: '#d87373' },
      { category: 'Lazer', value: 400, change: -1, color: '#9a83c6' },
      { category: 'Outros', value: 250, change: 0, color: '#7e8a84' },
    ],
  },
  may: {
    label: 'Maio',
    insight: 'Alimentação caiu para 39%',
    rows: [
      { category: 'Alimentação', value: 1755, change: -6, color: '#48c78b' },
      { category: 'Moradia', value: 1215, change: 5, color: '#6ba7d6' },
      { category: 'Transporte', value: 540, change: 0, color: '#d6a85e' },
      { category: 'Lazer', value: 405, change: 2, color: '#9a83c6' },
      { category: 'Saúde', value: 360, change: 0, color: '#d87373' },
      { category: 'Outros', value: 225, change: -1, color: '#7e8a84' },
    ],
  },
  april: {
    label: 'Abril',
    insight: 'Alimentação chegou a 45%',
    rows: [
      { category: 'Alimentação', value: 1800, change: 7, color: '#48c78b' },
      { category: 'Moradia', value: 880, change: -4, color: '#6ba7d6' },
      { category: 'Transporte', value: 480, change: 1, color: '#d6a85e' },
      { category: 'Saúde', value: 320, change: -1, color: '#d87373' },
      { category: 'Lazer', value: 280, change: -2, color: '#9a83c6' },
      { category: 'Outros', value: 240, change: -1, color: '#7e8a84' },
    ],
  },
}

const displayedMonthKeys = ['april', 'may', 'june']
const aprilTotal = expensePeriods.april.rows.reduce((sum, row) => sum + row.value, 0)
const juneTotal = expensePeriods.june.rows.reduce((sum, row) => sum + row.value, 0)

expensePeriods.quarter.rows = expensePeriods.april.rows.map((aprilRow) => {
  const juneRow = expensePeriods.june.rows.find((row) => row.category === aprilRow.category)
  const value = displayedMonthKeys.reduce((sum, monthKey) => {
    const matchingRow = expensePeriods[monthKey].rows.find((row) => row.category === aprilRow.category)
    return sum + (matchingRow?.value || 0)
  }, 0)
  const aprilShare = (aprilRow.value / aprilTotal) * 100
  const juneShare = juneRow ? (juneRow.value / juneTotal) * 100 : 0

  return {
    category: aprilRow.category,
    value,
    change: juneShare - aprilShare,
    color: aprilRow.color,
  }
})

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

const decimalFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const dashboardPeriod = document.querySelector('#dashboard-period')
const dashboardSort = document.querySelector('#dashboard-sort')
const dashboardPeriodLabel = document.querySelector('#dashboard-period-label')
const metricTotal = document.querySelector('#metric-total')
const metricCategory = document.querySelector('#metric-category')
const metricInsight = document.querySelector('#metric-insight')
const monthlyChart = document.querySelector('#monthly-chart')
const categoryBars = document.querySelector('#category-bars')
const expensePieChart = document.querySelector('#expense-pie-chart')
const pieLegend = document.querySelector('#pie-legend')
const pieCategoryCount = document.querySelector('#pie-category-count')
const pieCenterValue = document.querySelector('#pie-center-value')
const pieCenterLabel = document.querySelector('#pie-center-label')
const pieDetailMarker = document.querySelector('#pie-detail-marker')
const pieDetailCategory = document.querySelector('#pie-detail-category')
const pieDetailValue = document.querySelector('#pie-detail-value')
const pieDetailShare = document.querySelector('#pie-detail-share')
const pieDetailChange = document.querySelector('#pie-detail-change')
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
let pinnedPieCategory = null

function getParticipation(value, total) {
  return total === 0 ? 0 : (value / total) * 100
}

function getVariationLabel(change) {
  if (Math.abs(change) < 0.1) return 'Sem mudança'
  return `${change > 0 ? 'Subiu' : 'Caiu'} ${decimalFormatter.format(Math.abs(change))} p.p.`
}

function sortExpenseRows(rows, sortBy) {
  const sortedRows = [...rows]

  if (sortBy === 'category') {
    return sortedRows.sort((first, second) => first.category.localeCompare(second.category, 'pt-BR'))
  }

  if (sortBy === 'change-desc') {
    return sortedRows.sort((first, second) => Math.abs(second.change) - Math.abs(first.change))
  }

  return sortedRows.sort((first, second) => second.value - first.value)
}

function renderCategoryBars(rows, total) {
  categoryBars.replaceChildren()
  const maxValue = Math.max(...rows.map((row) => row.value))

  ;[...rows]
    .sort((first, second) => second.value - first.value)
    .forEach((row) => {
      const item = document.createElement('div')
      item.className = 'category-bar'

      const heading = document.createElement('div')
      heading.className = 'category-bar__heading'
      const category = document.createElement('strong')
      category.textContent = row.category
      const value = document.createElement('span')
      value.textContent = `${decimalFormatter.format(getParticipation(row.value, total))}%`
      heading.append(category, value)

      const track = document.createElement('div')
      track.className = 'category-bar__track'
      track.setAttribute('aria-label', `${row.category}: ${value.textContent} do total`)
      const fill = document.createElement('span')
      fill.style.width = `${(row.value / maxValue) * 100}%`
      fill.style.backgroundColor = row.color
      track.append(fill)

      item.append(heading, track)
      categoryBars.append(item)
    })
}

function renderMonthlyChart() {
  monthlyChart.replaceChildren()

  ;['april', 'may', 'june'].forEach((periodKey) => {
    const period = expensePeriods[periodKey]
    const total = period.rows.reduce((sum, row) => sum + row.value, 0)
    const monthButton = document.createElement('button')
    monthButton.className = 'month-comparison'
    monthButton.type = 'button'
    monthButton.setAttribute('aria-pressed', String(dashboardPeriod.value === periodKey))
    monthButton.setAttribute('aria-label', `Explorar gastos de ${period.label}`)

    const heading = document.createElement('span')
    heading.className = 'month-comparison__heading'
    const monthName = document.createElement('strong')
    monthName.textContent = period.label
    const totalValue = document.createElement('span')
    totalValue.textContent = currencyFormatter.format(total)
    heading.append(monthName, totalValue)

    const bar = document.createElement('span')
    bar.className = 'month-comparison__bar'

    period.rows.forEach((row) => {
      const share = getParticipation(row.value, total)
      const segment = document.createElement('span')
      segment.style.width = `${share}%`
      segment.style.backgroundColor = row.color
      segment.title = `${row.category}: ${decimalFormatter.format(share)}%`
      bar.append(segment)
    })

    monthButton.append(heading, bar)
    monthButton.addEventListener('click', () => {
      dashboardPeriod.value = periodKey
      renderDashboard()
    })
    monthlyChart.append(monthButton)
  })

  const legend = document.createElement('div')
  legend.className = 'category-legend'
  expensePeriods.april.rows.forEach((row) => {
    const item = document.createElement('span')
    const marker = document.createElement('i')
    marker.style.backgroundColor = row.color
    item.append(marker, row.category)
    legend.append(item)
  })
  monthlyChart.append(legend)
}

function getPolarPoint(centerX, centerY, radius, angle) {
  const radians = ((angle - 90) * Math.PI) / 180
  return {
    x: centerX + radius * Math.cos(radians),
    y: centerY + radius * Math.sin(radians),
  }
}

function createDonutPath(startAngle, endAngle) {
  const center = 120
  const outerRadius = 102
  const innerRadius = 61
  const outerStart = getPolarPoint(center, center, outerRadius, startAngle)
  const outerEnd = getPolarPoint(center, center, outerRadius, endAngle)
  const innerEnd = getPolarPoint(center, center, innerRadius, endAngle)
  const innerStart = getPolarPoint(center, center, innerRadius, startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ')
}

function updatePieSelection(category, rows, total, persist = false) {
  const selectedRow = rows.find((row) => row.category === category) || rows[0]
  if (!selectedRow) return
  if (persist) pinnedPieCategory = selectedRow.category

  const share = getParticipation(selectedRow.value, total)
  pieCenterValue.textContent = `${decimalFormatter.format(share)}%`
  pieCenterLabel.textContent = selectedRow.category
  pieDetailMarker.style.backgroundColor = selectedRow.color
  pieDetailCategory.textContent = selectedRow.category
  pieDetailValue.textContent = currencyFormatter.format(selectedRow.value)
  pieDetailShare.textContent = `${decimalFormatter.format(share)}% do total de ${currencyFormatter.format(total)}`
  pieDetailChange.textContent = getVariationLabel(selectedRow.change)
  pieDetailChange.className = `variation ${selectedRow.change > 0 ? 'variation--up' : selectedRow.change < 0 ? 'variation--down' : 'variation--steady'}`

  expensePieChart.querySelectorAll('.pie-slice').forEach((slice) => {
    const isSelected = slice.dataset.category === selectedRow.category
    slice.classList.toggle('pie-slice--active', isSelected)
    slice.classList.toggle('pie-slice--muted', !isSelected)
    slice.setAttribute('aria-pressed', String(isSelected))
  })

  pieLegend.querySelectorAll('.pie-legend__button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.category === selectedRow.category))
  })
}

function renderPieChart(rows, total) {
  expensePieChart.replaceChildren()
  pieLegend.replaceChildren()
  pieCategoryCount.textContent = `${rows.length} categorias`

  const fallbackCategory = rows.reduce((largest, row) => (row.value > largest.value ? row : largest)).category
  if (!rows.some((row) => row.category === pinnedPieCategory)) pinnedPieCategory = fallbackCategory

  let currentAngle = 0
  rows.forEach((row) => {
    const share = getParticipation(row.value, total)
    const sliceAngle = (row.value / total) * 360
    const gap = Math.min(0.75, sliceAngle * 0.08)
    const path = document.createElementNS(SVG_NAMESPACE, 'path')
    path.classList.add('pie-slice')
    path.dataset.category = row.category
    path.setAttribute('d', createDonutPath(currentAngle + gap, currentAngle + sliceAngle - gap))
    path.setAttribute('fill', row.color)
    path.setAttribute('tabindex', '0')
    path.setAttribute('role', 'button')
    path.setAttribute('aria-label', `${row.category}: ${currencyFormatter.format(row.value)}, ${decimalFormatter.format(share)}% do total`)

    const showTemporarySelection = () => updatePieSelection(row.category, rows, total)
    const restorePinnedSelection = () => updatePieSelection(pinnedPieCategory, rows, total)
    const pinSelection = () => updatePieSelection(row.category, rows, total, true)
    path.addEventListener('mouseenter', showTemporarySelection)
    path.addEventListener('mouseleave', restorePinnedSelection)
    path.addEventListener('focus', showTemporarySelection)
    path.addEventListener('blur', restorePinnedSelection)
    path.addEventListener('click', pinSelection)
    path.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        pinSelection()
      }
    })
    expensePieChart.append(path)

    const legendButton = document.createElement('button')
    legendButton.className = 'pie-legend__button'
    legendButton.type = 'button'
    legendButton.dataset.category = row.category
    const marker = document.createElement('i')
    marker.style.backgroundColor = row.color
    const label = document.createElement('span')
    label.textContent = row.category
    const percentage = document.createElement('strong')
    percentage.textContent = `${decimalFormatter.format(share)}%`
    legendButton.append(marker, label, percentage)
    legendButton.addEventListener('mouseenter', showTemporarySelection)
    legendButton.addEventListener('mouseleave', restorePinnedSelection)
    legendButton.addEventListener('focus', showTemporarySelection)
    legendButton.addEventListener('blur', restorePinnedSelection)
    legendButton.addEventListener('click', pinSelection)
    pieLegend.append(legendButton)

    currentAngle += sliceAngle
  })

  updatePieSelection(pinnedPieCategory, rows, total)
}

function renderDashboard() {
  const period = expensePeriods[dashboardPeriod.value]
  const total = period.rows.reduce((sum, row) => sum + row.value, 0)
  const largestCategory = period.rows.reduce((largest, row) => (row.value > largest.value ? row : largest))
  const sortedRows = sortExpenseRows(period.rows, dashboardSort.value)

  dashboardPeriodLabel.textContent = period.label
  metricTotal.textContent = currencyFormatter.format(total)
  metricCategory.textContent = largestCategory.category
  metricInsight.textContent = period.insight

  renderMonthlyChart()
  renderCategoryBars(period.rows, total)
  renderPieChart(sortedRows, total)
}

dashboardPeriod.addEventListener('change', () => {
  pinnedPieCategory = null
  renderDashboard()
})
dashboardSort.addEventListener('change', renderDashboard)
renderDashboard()

const revealTargets = document.querySelectorAll('.process-list li, .dashboard-metrics article, .category-bar, .checklist article, .security-list li, .faq-list details')

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  revealTargets.forEach((element) => element.classList.add('reveal-ready'))
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.16 },
  )
  revealTargets.forEach((element) => observer.observe(element))
}
