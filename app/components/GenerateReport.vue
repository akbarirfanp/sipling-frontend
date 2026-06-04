<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import { CalendarDate, getLocalTimeZone, parseDate, today } from '@internationalized/date'
import { useReportQuery } from '~/features/report/useReportQuery'

const {
  startDate,
  endDate,
  isReady,
  report,
  isLoadingReport,
  reportError,
  refreshReportData,
} = useReportQuery()

const startCalendar = ref<DateValue | undefined>()
const endCalendar = ref<DateValue | undefined>()

const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return ''
  const d = parseDate(dateStr)
  return `${d.day.toString().padStart(2, '0')}/${d.month.toString().padStart(2, '0')}/${d.year}`
}

const onStartDateChange = (v: DateValue | undefined) => {
  startDate.value = v ? v.toString() : ''
  startCalendar.value = v
}

const onEndDateChange = (v: DateValue | undefined) => {
  endDate.value = v ? v.toString() : ''
  endCalendar.value = v
}

// ─── PDF helpers ──────────────────────────────────────────────────────────────

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

const statusLabel = (status: string) => ({
  paid: 'Lunas', settlement: 'Lunas',
  pending: 'Menunggu',
  failed: 'Gagal', expire: 'Kadaluarsa', cancel: 'Dibatalkan',
}[status?.toLowerCase()] ?? status)

const statusColor = (status: string) => {
  const s = status?.toLowerCase()
  if (s === 'paid' || s === 'settlement') return '#059669'
  if (s === 'pending') return '#d97706'
  return '#dc2626'
}

// ─── Generate ─────────────────────────────────────────────────────────────────

const handleGenerate = async () => {
  await refreshReportData()

  const data = report.value
  const totalAmount = data.reduce((sum, r) => sum + r.grossAmount, 0)
  const generatedAt = new Date().toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const tableRows = data.map((r, i) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#fafafa'}">
      <td style="text-align:center;color:#aaa">${i + 1}</td>
      <td>${r.invoiceNumber ?? '-'}</td>
      <td>${r.userName}</td>
      <td>${r.feeName}</td>
      <td>${formatDate(r.paymentDate)}</td>
      <td style="text-align:right;font-family:monospace;color:#059669;font-weight:600">${formatCurrency(r.grossAmount)}</td>
      <td>
        <span style="padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;
          color:${statusColor(r.status)};background:${statusColor(r.status)}18">
          ${statusLabel(r.status)}
        </span>
      </td>
    </tr>`).join('')

  const html = `<!DOCTYPE html>
<html lang="id"><head>
  <meta charset="UTF-8"/>
  <title>Laporan Pembayaran</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');
    * { margin:0; padding:0; box-sizing:border-box }
    body { font-family:'IBM Plex Sans',sans-serif; font-size:13px; padding:40px 48px; color:#111 }
    .header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:20px; border-bottom:2px solid #111; margin-bottom:28px }
    .header h1 { font-size:22px; font-weight:700; letter-spacing:-0.5px }
    .header p { font-size:12px; color:#888; margin-top:4px }
    .meta-label { font-size:11px; color:#888; text-transform:uppercase; letter-spacing:0.5px }
    .meta-value { font-size:12px; font-weight:500; margin-top:2px }
    .summary { display:flex; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden; margin-bottom:28px }
    .s-item { flex:1; padding:14px 18px; border-right:1px solid #e5e7eb }
    .s-item:last-child { border-right:none }
    .s-label { font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#888; margin-bottom:4px }
    .s-value { font-size:18px; font-weight:700; font-family:'IBM Plex Mono',monospace }
    table { width:100%; border-collapse:collapse }
    thead tr { background:#111; color:#fff }
    th { padding:10px 12px; text-align:left; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; white-space:nowrap }
    td { padding:10px 12px; border-bottom:1px solid #f0f0f0; vertical-align:middle }
    .total-row td { border-top:2px solid #111; font-weight:700; padding:12px }
    .footer { margin-top:36px; padding-top:14px; border-top:1px solid #e5e7eb; display:flex; justify-content:space-between; font-size:11px; color:#aaa }
  </style>
</head><body>
  <div class="header">
    <div>
      <h1>Laporan Pembayaran</h1>
      <p>Sistem Informasi Pengelolaan Iuran</p>
    </div>
    <div style="text-align:right">
      <div class="meta-label">Periode</div>
      <div class="meta-value">${formatDate(startDate.value)} — ${formatDate(endDate.value)}</div>
      <div class="meta-label" style="margin-top:8px">Digenerate</div>
      <div class="meta-value">${generatedAt}</div>
    </div>
  </div>
  <div class="summary">
    <div class="s-item"><div class="s-label">Total Transaksi</div><div class="s-value">${data.length}</div></div>
    <div class="s-item"><div class="s-label">Total Penerimaan</div><div class="s-value" style="color:#059669">${formatCurrency(totalAmount)}</div></div>
    <div class="s-item"><div class="s-label">Lunas</div><div class="s-value">${data.filter(r => ['paid','settlement'].includes(r.status?.toLowerCase())).length}</div></div>
    <div class="s-item"><div class="s-label">Lainnya</div><div class="s-value">${data.filter(r => !['paid','settlement'].includes(r.status?.toLowerCase())).length}</div></div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:36px;text-align:center">No</th>
        <th>No. Invoice</th>
        <th>Nama Warga</th>
        <th>Jenis Iuran</th>
        <th>Tgl Bayar</th>
        <th style="text-align:right">Nominal</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
      <tr class="total-row">
        <td colspan="5" style="text-align:right;color:#666;font-size:12px">TOTAL PENERIMAAN</td>
        <td style="text-align:right;font-family:monospace;color:#059669;font-size:15px">${formatCurrency(totalAmount)}</td>
        <td></td>
      </tr>
    </tbody>
  </table>
  <div class="footer">
    <span>Sipling — Sistem Pengelolaan Iuran</span>
    <span>Halaman 1 dari 1</span>
  </div>
</body></html>`

// Ganti dengan ini:
const iframe = document.createElement('iframe')
iframe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;border:none;opacity:0;pointer-events:none'
document.body.appendChild(iframe)

const doc = iframe.contentDocument ?? iframe.contentWindow?.document
if (!doc) return

doc.open()
doc.write(html)
doc.close()

setTimeout(() => {
  iframe.contentWindow?.focus()
  iframe.contentWindow?.print()
  setTimeout(() => document.body.removeChild(iframe), 1000)
}, 500)
}
</script>

<template>
  <CnCard>
    <CnCardContent class="p-0">
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">Generate Laporan</h2>
          <p class="text-sm text-gray-500">Unduh laporan dalam format PDF</p>
        </div>
      </div>

      <div class="px-5 py-6 space-y-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

          <!-- Tanggal Mulai -->
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-gray-700">Tanggal Mulai</label>
            <CnPopover>
              <CnPopoverTrigger as-child>
                <CnButton
                  variant="outline"
                  class="font-normal ps-3 text-start flex h-11 w-full items-center justify-between"
                  :class="!startDate ? 'text-muted-foreground' : ''"
                  :disabled="isLoadingReport"
                >
                  <span>{{ startDate ? formatDisplayDate(startDate) : '- Pilih Tanggal Mulai -' }}</span>
                  <Icon name="ph:calendar-blank" class="opacity-70 h-5 w-5" />
                </CnButton>
              </CnPopoverTrigger>
              <CnPopoverContent class="p-0 w-auto">
                <CnCalendar
                  v-model="startCalendar"
                  calendar-label="Tanggal Mulai"
                  initial-focus
                  :min-value="new CalendarDate(2000, 1, 1)"
                  :max-value="endCalendar ?? today(getLocalTimeZone())"
                  @update:model-value="onStartDateChange"
                />
              </CnPopoverContent>
            </CnPopover>
          </div>

          <!-- Tanggal Akhir -->
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-gray-700">Tanggal Akhir</label>
            <CnPopover>
              <CnPopoverTrigger as-child>
                <CnButton
                  variant="outline"
                  class="font-normal ps-3 text-start flex h-11 w-full items-center justify-between"
                  :class="!endDate ? 'text-muted-foreground' : ''"
                  :disabled="isLoadingReport"
                >
                  <span>{{ endDate ? formatDisplayDate(endDate) : '- Pilih Tanggal Akhir -' }}</span>
                  <Icon name="ph:calendar-blank" class="opacity-70 h-5 w-5" />
                </CnButton>
              </CnPopoverTrigger>
              <CnPopoverContent class="p-0 w-auto">
                <CnCalendar
                  v-model="endCalendar"
                  calendar-label="Tanggal Akhir"
                  initial-focus
                  :min-value="startCalendar ?? new CalendarDate(2000, 1, 1)"
                  :max-value="today(getLocalTimeZone())"
                  @update:model-value="onEndDateChange"
                />
              </CnPopoverContent>
            </CnPopover>
          </div>

        </div>

        <p v-if="!isReady" class="text-xs text-gray-400">
          Pilih tanggal mulai dan tanggal akhir untuk mengaktifkan tombol generate.
        </p>

        <div
          v-if="reportError"
          class="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600"
        >
          <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Gagal mengambil data. Silakan coba lagi.
        </div>

        <CnButton
          class="w-full sm:w-auto gap-2"
          :disabled="!isReady || isLoadingReport"
          @click="handleGenerate"
        >
          <svg v-if="isLoadingReport" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          {{ isLoadingReport ? 'Memproses...' : 'Generate Laporan PDF' }}
        </CnButton>
      </div>
    </CnCardContent>
  </CnCard>
</template>