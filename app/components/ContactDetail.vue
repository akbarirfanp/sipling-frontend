<script setup lang="ts">
import { useContacts } from '~/features/contacts/useContacts'
import { useContactsQuery } from '~/features/contacts/useContactsQuery'
import EditContact from '~/pages/(protected)/contacts/[id]/edit-contact.vue'

interface Props {
  contactId: string
  editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editable: false,
})

const { updateContactStatus } = useContacts()
const { useContactQuery } = useContactsQuery()
const contactQuery = useContactQuery(props.contactId)

const updateContactRef = ref()

const avatarText = computed(() => {
  const fullName = contactQuery.data.value?.fullName
  if (!fullName?.trim())
    return 'N/A'
  return fullName.trim()
    .split(/\s+/)
    .map(word => word[0]?.toUpperCase())
    .slice(0, 2)
    .join('')
})

const contactData = computed(() => {
  return contactQuery.data.value
})

const formatBirthInfo = computed(() => {
  const contact = contactData
  if (!contact.value)
    return ''

  if (contact.value?.placeOfBirth && contact.value?.dateOfBirth) {
    const date = new Date(contact.value?.dateOfBirth).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    return `${contact.value?.placeOfBirth}, ${date}`
  }

  return contact.value?.placeOfBirth || contact.value?.dateOfBirth || ''
})

const qc = useQueryClient()

async function updateStatus(status: boolean) {
  await updateContactStatus(props.contactId, status)
  await contactQuery.refetch()
  await qc.refetchQueries({ queryKey: ['log-application'] })
}

async function handleEditSuccess() {
  await contactQuery.refetch()
  await qc.refetchQueries({ queryKey: ['log-application'] })
}

// Function to handle edit button click
function handleEdit() {
  updateContactRef.value?.handleEdit()
}
</script>

<template>
  <div class="border rounded-lg bg-white shadow-sm">
    <div v-if="contactQuery.isLoading.value" class="p-4 animate-pulse">
      <div class="mb-4 flex items-start justify-between">
        <div class="flex gap-3 items-center">
          <CnSkeleton class="rounded-full size-10" />
          <div class="space-y-1">
            <CnSkeleton class="h-4 w-32" />
            <CnSkeleton class="h-3 w-16" />
          </div>
        </div>
        <CnSkeleton v-if="editable" class="rounded h-6 w-6" />
      </div>
      <div class="space-y-3">
        <div v-for="i in 6" :key="`skeleton-${i}`" class="flex">
          <CnSkeleton class="mr-6 h-3 w-24" />
          <CnSkeleton class="h-3 w-40" />
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="contactQuery.isError.value" class="p-4 text-center">
      <p class="text-xs text-red-600 mb-3">
        Failed to load contact details
      </p>
      <button
        class="text-xs text-white px-3 py-1 rounded bg-blue-500 hover:bg-blue-600"
        @click="contactQuery.refetch()"
      >
        Retry
      </button>
    </div>

    <div v-else-if="contactData" class="p-4">
      <div class="mb-5 flex items-start justify-between">
        <div class="flex gap-3 items-center">
          <div class="text-sm text-white font-medium rounded-full bg-red-500 flex size-10 items-center justify-center">
            {{ avatarText }}
          </div>

          <div>
            <h1 class="text-sm text-gray-900 font-medium mb-0.5">
              {{ contactData.fullName || 'No Name Available' }}
            </h1>
            <div class="flex gap-1.5 items-center">
              <div
                :class="contactData.status ? 'bg-green-500' : 'bg-red-500'"
                class="rounded-full h-1.5 w-1.5"
              />
              <span class="text-xs text-gray-600">
                {{ contactData.status ? 'Active' : 'Non Active' }}
              </span>
            </div>
          </div>
        </div>

        <button
          v-if="editable"
          class="p-1.5 border border-gray-200 rounded transition-colors hover:bg-gray-50"
          @click="handleEdit"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 256 256">
            <path fill="currentColor" d="m227.31 73.37l-44.68-44.69a16 16 0 0 0-22.63 0L36.69 152A15.86 15.86 0 0 0 32 163.31V208a16 16 0 0 0 16 16h44.69a15.86 15.86 0 0 0 11.31-4.69L227.31 96a16 16 0 0 0 0-22.63ZM92.69 208H48v-44.69l88-88L180.69 120ZM192 108.69L147.31 64l24-24L216 84.69Z" />
          </svg>
        </button>
      </div>

      <div class="mb-5 space-y-3">
        <div class="flex items-start">
          <span class="text-xs text-gray-600 flex-shrink-0 w-32">Organization</span>
          <span class="text-xs text-gray-900">: {{ contactData.organizationName }}</span>
        </div>

        <div class="flex items-start">
          <span class="text-xs text-gray-600 flex-shrink-0 w-32">Account</span>
          <span class="text-xs text-gray-900">: {{ contactData.accountName }}</span>
        </div>

        <div class="flex items-start">
          <span class="text-xs text-gray-600 flex-shrink-0 w-32">Email</span>
          <span class="text-xs text-gray-900">: {{ contactData.email }}</span>
        </div>

        <div class="flex items-start">
          <span class="text-xs text-gray-600 flex-shrink-0 w-32">Place and Date of Birth</span>
          <span class="text-xs text-gray-900">: {{ formatBirthInfo }}</span>
        </div>

        <div class="flex items-start">
          <span class="text-xs text-gray-600 flex-shrink-0 w-32">Phone Number</span>
          <span class="text-xs text-gray-900">: {{ contactData.phoneNumber1 }}</span>
        </div>

        <div class="flex items-start">
          <span class="text-xs text-gray-600 flex-shrink-0 w-32">Address</span>
          <span class="text-xs text-gray-900">: {{ contactData.address1 }}{{ contactData.address2 ? `, ${contactData.address2}` : '' }}</span>
        </div>
      </div>

      <div class="pt-3 border-gray-100 flex items-center justify-between">
        <div class="text-xs text-gray-600 flex flex-col">
          <span class="mb-2">Source Data</span>
          <span class="text-gray-600 px-3 py-1 rounded-full bg-gray-50">
            {{ contactData.sourceData }}
          </span>
        </div>

        <div class="text-xs text-gray-600 flex flex-col items-end">
          <span class="mb-2">Contact Status</span>
          <label class="inline-flex cursor-pointer items-center relative">
            <input
              type="checkbox"
              :checked="contactData.status"
              class="peer sr-only"
              @change="updateStatus(!contactData.status)"
            >
            <div class="peer rounded-full bg-gray-200 h-4 w-8 after:rounded-full after:bg-white peer-checked:bg-green-500 after:h-3 after:w-3 after:content-[''] after:shadow-sm after:transition-all after:left-[1px] after:top-[1px] after:absolute peer-checked:after:translate-x-4" />
          </label>
        </div>
      </div>

      <!-- Edit Contact Dialog -->
      <EditContact
        v-if="editable && contactData"
        ref="updateContactRef"
        :contact="contactData"
        @edit-success="handleEditSuccess"
      />
    </div>
    <div v-else class="p-4 text-center">
      <p class="text-xs text-gray-500">
        No contact data available
      </p>
    </div>
  </div>
</template>
