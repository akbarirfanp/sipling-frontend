export interface ScxSelectSlots {
  item: {
    option: ScxSelectOption
    selected: boolean
    index: number
    highlighted: boolean
  }
  empty: Record<string, never>
  loading: Record<string, never>
  noOptions: Record<string, never>
  footer: Record<string, never>
  trigger: {
    value: string | string[]
    placeholder: string
    open: boolean
  }
}

export interface ScxSelectOption {
  label: string
  value: string
  disabled?: boolean
  meta?: unknown
}

export interface ScxSelectFetchResult {
  items: ScxSelectOption[]
  nextCursor?: string
  hasMore?: boolean
}

export type ScxSelectFetcher = (
  query: string,
  cursor?: string
) => Promise<ScxSelectFetchResult>

export type ScxSelectFilterFn = (
  query: string,
  option: ScxSelectOption
) => boolean
