<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table'
import type { Attachment } from '~/features/attachments/domain'
import { useQueryClient } from '@tanstack/vue-query'
import { useConfirmDialog } from '~/composables/useConfirmDialog'
import CreateAttachment from '~/features/attachments/components/createAttachment.vue'
import ReuploadAttachment from '~/features/attachments/components/reuploadAttachment.vue'
import { useAttachmentsQuery } from '~/features/attachments/UseAttachmentQuery'

interface Props {
  entityType: string | Ref<string>
  entityId: string | Ref<string>
}

const props = defineProps<Props>()
const qc = useQueryClient()
const entityType = ref(unref(props.entityType))
const entityId = ref(unref(props.entityId))

const { $repos } = useNuxtApp()
const attachmentsRepo = $repos.attachments

const {
  attachments,
  isLoadingAttachments,
  errorAttachments,
  removeAttachment,
  downloadAttachment,
  updateDirectAttachment,
  reloadAttachments,
} = useAttachmentsQuery(entityType, entityId)

const showCreateDialog = ref(false)
const showReuploadDialog = ref(false)
const selectedAttachment = ref<Attachment | null>(null)
const confirmDialog = useConfirmDialog()
const tableKey = ref(Date.now())

function formatDate(date: string | Date | null | undefined): string {
  if (!date)
    return '-'

  const d = new Date(date)

  if (Number.isNaN(d.getTime()))
    return '-'

  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()

  return `${day}/${month}/${year}`
}

function isImageFile(fileName: string): boolean {
  if (!fileName)
    return false
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
  return imageExtensions.includes(extension)
}

async function handleFileClick(attachment: Attachment) {
  if (isImageFile(attachment.fileName || '')) {
    await previewImageNewTab(attachment)
  }
  else {
    downloadAttachment(attachment)
  }
}

async function previewImageNewTab(attachment: Attachment) {
  try {
    // ✅ Gunakan repo dari $repos
    const result = await attachmentsRepo.downloadFile(attachment.storagePath || attachment.id)

    const imageUrl = URL.createObjectURL(result.blob)

    window.open(imageUrl, '_blank')

    setTimeout(() => {
      URL.revokeObjectURL(imageUrl)
    }, 5000)
  }
  catch (error: any) {
    console.error('Error loading image preview:', error)
    await confirmDialog.error('Error', error?.message || 'Failed to load image preview. Please try downloading the file instead.')
  }
}

const columns: ColumnDef<Attachment>[] = [
  {
    accessorKey: 'title',
    header: 'File Name',
    enableSorting: false,
    cell: ({ row }) => h('div', { class: 'font-medium text-neutral-900' }, row.original.title || '-'),
  },
  {
    accessorKey: 'fileName',
    header: 'File Attached',
    enableSorting: false,
    cell: ({ row }) => {
      const fileName = row.original.fileName

      if (!fileName) {
        return h('div', { class: 'text-neutral-700' }, '-')
      }

      const isImage = isImageFile(fileName)
      return h('a', {
        href: '#',
        class: 'text-blue-600 hover:underline cursor-pointer inline-flex items-center gap-1',
        onClick: (e: Event) => {
          e.preventDefault()
          handleFileClick(row.original)
        },
      }, [
        fileName,
        isImage && h(resolveComponent('Icon'), {
          name: 'ph:image',
          class: 'h-4 w-4 inline-block ml-1',
        }),
      ])
    },
  },
  {
    accessorKey: 'createdByName',
    header: 'Attached by',
    enableSorting: false,
    cell: ({ row }) => h('div', { class: 'text-neutral-700' }, row.original.createdByName || '-'),
  },
  {
    accessorKey: 'uploadedAt',
    header: 'Attached Date',
    enableSorting: false,
    cell: ({ row }) => h('div', { class: 'text-neutral-700' }, formatDate(row.original.uploadedAt || row.original.createdAt)),
  },
  {
    accessorKey: 'deadline',
    header: 'Due Date',
    enableSorting: false,
    cell: ({ row }) => h('div', { class: 'text-neutral-700' }, formatDate(row.original.deadline)),
  },
  {
    id: 'actions',
    header: 'Actions',
    enableSorting: false,
    cell: ({ row }) => {
      return h('div', { class: 'flex gap-2 items-center' }, [
        h('button', {
          title: 'Download',
          class: 'text-blue-500 p-1.5 rounded transition-colors hover:bg-blue-50',
          onClick: () => downloadAttachment(row.original),
        }, [
          h(resolveComponent('Icon'), { name: 'ph:arrow-fat-line-down-fill', class: 'h-5 w-5' }),
        ]),
        h('button', {
          title: 'Re-upload',
          class: 'text-blue-500 p-1.5 rounded transition-colors hover:bg-blue-50',
          onClick: () => openReuploadAttachment(row.original),
        }, [
          h(resolveComponent('Icon'), { name: 'ph:arrow-fat-line-up-fill', class: 'h-5 w-5' }),
        ]),
        h('button', {
          title: 'Delete',
          class: 'text-red-600 p-1.5 rounded transition-colors hover:bg-red-50',
          onClick: () => deleteFile(row.original),
        }, [
          h(resolveComponent('Icon'), { name: 'ph:trash-fill', class: 'h-5 w-5' }),
        ]),
      ])
    },
  },
]

function openCreateAttachment() {
  showCreateDialog.value = true
}

function handleCreateDialogClose() {
  showCreateDialog.value = false
}

function openReuploadAttachment(attachment: Attachment) {
  selectedAttachment.value = attachment
  showReuploadDialog.value = true
}

function handleReuploadDialogClose() {
  showReuploadDialog.value = false
  selectedAttachment.value = null
}

const isSaving = ref(false)

async function handleSaveAttachments(_savedAttachments: Attachment[]) {
  // Prevent double submit
  if (isSaving.value)
    return true

  try {
    isSaving.value = true
    showCreateDialog.value = false

    // Tunggu dialog close dulu
    await nextTick()

    // Baru reload data
    await reloadAttachments()

    await confirmDialog.success('Success', 'Attachment(s) have been uploaded successfully.')
    return true
  }
  catch (err) {
    console.error('Error in handleSaveAttachments:', err)
    await confirmDialog.error('Error', 'Failed to save attachment(s). Please try again.')
    return false
  }
  finally {
    isSaving.value = false
  }
}

async function handleSaveReuploadAttachment(_updatedAttachment: Attachment) {
  try {
    if (!selectedAttachment.value?.id) {
      throw new Error('No attachment selected')
    }

    const key = ['attachments', unref(entityType), unref(entityId)]

    qc.removeQueries({ queryKey: key })

    await reloadAttachments()

    tableKey.value = Date.now()

    await new Promise(resolve => setTimeout(resolve, 100))

    showReuploadDialog.value = false
    selectedAttachment.value = null

    await confirmDialog.success('Success', 'Attachment has been re-uploaded successfully.')
    return true
  }
  catch (err) {
    console.error('❌ [Attachments.vue] Error:', err)
    await confirmDialog.error('Error', 'Failed to re-upload attachment. Please try again.')
    return false
  }
}

async function deleteFile(attachment: { id: string }) {
  const confirmed = await confirmDialog.confirm({
    title: 'Delete Attachment',
    message: 'Are you sure you want to delete this attachment?',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'confirmation',
  })

  if (!confirmed)
    return

  try {
    await removeAttachment(attachment.id)
    await qc.invalidateQueries({ queryKey: ['attachments', unref(entityType), unref(entityId)] })
    await confirmDialog.success('Deleted', 'Attachment has been deleted successfully.')
  }
  catch (err: any) {
    await confirmDialog.error('Error', err?.message || 'Failed to delete attachment.')
  }
}

const tableData = computed(() => {
  return attachments.value || []
})
const errorMessage = computed(() => errorAttachments.value || '')
</script>

<template>
  <div v-if="errorMessage" class="mb-6 p-4 border border-red-200 rounded-lg bg-red-50">
    <div class="flex gap-2 items-start">
      <Icon name="ph:warning-circle" class="text-red-600 mt-0.5 flex-shrink-0 h-5 w-5" />
      <div>
        <h3 class="text-sm text-red-800 font-medium">
          Error loading attachments
        </h3>
        <div class="text-sm text-red-700 mt-1">
          {{ errorMessage }}
        </div>
      </div>
    </div>
  </div>

  <CnDataTable
    :key="`attachments-table-${tableKey}-${tableData.length}`"
    :columns="columns"
    :data="tableData"
    :loading="isLoadingAttachments"
    :show-column-visibility="false"
    :show-pagination="false"
    :show-search="false"
    :show-title="false"
    :enable-search="false"
    :searchable="false"
    empty-message="No attachments available. Click 'Create New' button below to upload your first document."
  />

  <CnButton
    variant="outline"
    class="text-red-600 mt-6 border-red-600 h-10 hover:text-red-600 hover:bg-red-50"
    @click="openCreateAttachment"
  >
    <Icon name="ph:plus" class="h-4 w-4" />
    Create New
  </CnButton>

  <CreateAttachment
    v-model:show="showCreateDialog"
    title="Upload Documents"
    description="Upload documents with deadlines."
    :max-file-size="2"
    :allowed-formats="['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.zip']"
    :reference-id="entityId"
    :reference-name="entityType"
    :module="entityType"
    @save="handleSaveAttachments"
    @close="handleCreateDialogClose"
  />

  <ReuploadAttachment
    v-model:show="showReuploadDialog"
    :attachment-id="selectedAttachment?.id"
    :attachment="{
      id: selectedAttachment?.id,
      title: selectedAttachment?.title,
      deadline: selectedAttachment?.deadline ?? undefined,
      fileName: selectedAttachment?.fileName,
      storagePath: selectedAttachment?.storagePath,
    }"
    :on-update="updateDirectAttachment"
    @save="handleSaveReuploadAttachment"
    @close="handleReuploadDialogClose"
    @reload="reloadAttachments"
  />
</template>
