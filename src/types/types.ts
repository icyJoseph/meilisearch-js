// Type definitions for meilisearch
// Project: https://github.com/meilisearch/meilisearch-js
// Definitions by: qdequele <quentin@meilisearch.com> <https://github.com/meilisearch>
// Definitions: https://github.com/meilisearch/meilisearch-js
// TypeScript Version: ^3.8.3

import { Task } from '../task'

export type Config = {
  host: string
  apiKey?: string
  clientAgents?: string[]
  requestConfig?: Partial<Omit<RequestInit, 'body' | 'method'>>
  httpClient?: (input: string, init?: RequestInit) => Promise<any>
}

///
/// Resources
///

export type Pagination = {
  offset?: number
  limit?: number
}

export type ResourceQuery = Pagination & {}

export type ResourceResults<T> = Pagination & {
  results: T
  total: number
}

///
/// Indexes
///

export type IndexOptions = {
  primaryKey?: string
}

export type IndexObject = {
  uid: string
  primaryKey?: string
  createdAt: Date
  updatedAt: Date
}

export type IndexesQuery = ResourceQuery & {}

export type IndexesResults<T> = ResourceResults<T> & {}

/*
 * SEARCH PARAMETERS
 */

export const MatchingStrategies = {
  ALL: 'all',
  LAST: 'last',
}

export type MatchingStrategies = typeof MatchingStrategies[keyof typeof MatchingStrategies]

export type Filter = string | Array<string | string[]>

export type Query = {
  q?: string | null
}

export type Highlight = {
  attributesToHighlight?: string[]
  highlightPreTag?: string
  highlightPostTag?: string
}

export type Crop = {
  attributesToCrop?: string[]
  cropLength?: number
  cropMarker?: string
}

export type SearchParams = Query &
  Pagination &
  Highlight &
  Crop & {
    filter?: Filter
    sort?: string[]
    facets?: string[]
    attributesToRetrieve?: string[]
    showMatchesPosition?: boolean
    matchingStrategy?: MatchingStrategies
    hitsPerPage?: number
    page?: number
  }

// Search parameters for searches made with the GET method
// Are different than the parameters for the POST method
export type SearchRequestGET = Pagination &
  Query &
  Omit<Highlight, 'attributesToHighlight'> &
  Omit<Crop, 'attributesToCrop'> & {
    filter?: string
    sort?: string
    facets?: string
    attributesToRetrieve?: string
    attributesToHighlight?: string
    attributesToCrop?: string
    showMatchesPosition?: boolean
  }

export type MultiSearchQuery = SearchParams & { indexUid: string }

export type MultiSearchParams = {
  queries: MultiSearchQuery[]
}

export type CategoriesDistribution = {
  [category: string]: number
}

export type Facet = string
export type FacetDistribution = Record<Facet, CategoriesDistribution>
export type MatchesPosition<T> = Partial<
  Record<keyof T, Array<{ start: number; length: number }>>
>

export type Hit<T = Record<string, any>> = T & {
  _formatted?: Partial<T>
  _matchesPosition?: MatchesPosition<T>
}

export type Hits<T = Record<string, any>> = Array<Hit<T>>

export type FacetStat = { min: number; max: number }
export type FacetStats = Record<string, FacetStat>

export type SearchResponse<
  T = Record<string, any>,
  S extends SearchParams | undefined = undefined
> = {
  hits: Hits<T>
  processingTimeMs: number
  facetDistribution?: FacetDistribution
  query: string
  facetStats?: FacetStats
} & (undefined extends S
  ? Partial<FinitePagination & InfinitePagination>
  : true extends IsFinitePagination<NonNullable<S>>
  ? FinitePagination
  : InfinitePagination)

type FinitePagination = {
  totalHits: number
  hitsPerPage: number
  page: number
  totalPages: number
}
type InfinitePagination = {
  offset: number
  limit: number
  estimatedTotalHits: number
}

type IsFinitePagination<S extends SearchParams> = Or<
  HasHitsPerPage<S>,
  HasPage<S>
>

type Or<A extends boolean, B extends boolean> = true extends A
  ? true
  : true extends B
  ? true
  : false

type HasHitsPerPage<S extends SearchParams> = undefined extends S['hitsPerPage']
  ? false
  : true

type HasPage<S extends SearchParams> = undefined extends S['page']
  ? false
  : true

export type MultiSearchResult<T> = SearchResponse<T> & { indexUid: string }

export type MultiSearchResponse<T = Record<string, any>> = {
  results: Array<MultiSearchResult<T>>
}

export type FieldDistribution = {
  [field: string]: number
}

/*
 ** Documents
 */

type Fields<T = Record<string, any>> =
  | Array<Extract<keyof T, string>>
  | Extract<keyof T, string>

export type DocumentOptions = {
  primaryKey?: string
}

export const ContentTypeEnum: Readonly<Record<string, ContentType>> = {
  JSON: 'application/json',
  CSV: 'text/csv',
  NDJSON: 'application/x-ndjson',
}

export type ContentType =
  | 'text/csv'
  | 'application/x-ndjson'
  | 'application/json'

export type RawDocumentAdditionOptions = DocumentOptions & {
  csvDelimiter?: string
}

export type DocumentsQuery<T = Record<string, any>> = ResourceQuery & {
  fields?: Fields<T>
}

export type DocumentQuery<T = Record<string, any>> = {
  fields?: Fields<T>
}

/*
 ** Settings
 */

export type FilterableAttributes = string[] | null
export type DistinctAttribute = string | null
export type SearchableAttributes = string[] | null
export type SortableAttributes = string[] | null
export type DisplayedAttributes = string[] | null
export type RankingRules = string[] | null
export type StopWords = string[] | null
export type Synonyms = {
  [field: string]: string[]
} | null
export type TypoTolerance = {
  enabled?: boolean | null
  disableOnAttributes?: string[] | null
  disableOnWords?: string[] | null
  minWordSizeForTypos?: {
    oneTypo?: number | null
    twoTypos?: number | null
  }
} | null

export type Faceting = {
  maxValuesPerFacet?: number | null
}
export type PaginationSettings = {
  maxTotalHits?: number | null
}

export type Settings = {
  filterableAttributes?: FilterableAttributes
  distinctAttribute?: DistinctAttribute
  sortableAttributes?: SortableAttributes
  searchableAttributes?: SearchableAttributes
  displayedAttributes?: DisplayedAttributes
  rankingRules?: RankingRules
  stopWords?: StopWords
  synonyms?: Synonyms
  typoTolerance?: TypoTolerance
  faceting?: Faceting
  pagination?: PaginationSettings
}

/*
 ** TASKS
 */

export const enum TaskStatus {
  TASK_SUCCEEDED = 'succeeded',
  TASK_PROCESSING = 'processing',
  TASK_FAILED = 'failed',
  TASK_ENQUEUED = 'enqueued',
}

export const enum TaskTypes {
  INDEX_CREATION = 'indexCreation',
  INDEX_UPDATE = 'indexUpdate',
  INDEX_DELETION = 'indexDeletion',
  DOCUMENTS_ADDITION_OR_UPDATE = 'documentAdditionOrUpdate',
  DOCUMENT_DELETION = 'documentDeletion',
  SETTINGS_UPDATE = 'settingsUpdate',
  INDEXES_SWAP = 'indexSwap',
  TASK_DELETION = 'taskDeletion',
  SNAPSHOT_CREATION = 'snapshotCreation',
  TASK_CANCELATION = 'taskCancelation',
}

export type TasksQuery = {
  indexUids?: string[]
  uids?: number[]
  types?: TaskTypes[]
  statuses?: TaskStatus[]
  canceledBy?: number[]
  beforeEnqueuedAt?: Date
  afterEnqueuedAt?: Date
  beforeStartedAt?: Date
  afterStartedAt?: Date
  beforeFinishedAt?: Date
  afterFinishedAt?: Date
  limit?: number
  from?: number
}
export type CancelTasksQuery = Omit<TasksQuery, 'limit' | 'from'> & {}
export type DeleteTasksQuery = Omit<TasksQuery, 'limit' | 'from'> & {}

export type EnqueuedTaskObject = {
  taskUid: number
  indexUid?: string
  status: TaskStatus
  type: TaskTypes
  enqueuedAt: string
  canceledBy: number
}

export type TaskObject = Omit<EnqueuedTaskObject, 'taskUid'> & {
  uid: number
  details: {
    // Number of documents sent
    receivedDocuments?: number

    // Number of documents successfully indexed/updated in Meilisearch
    indexedDocuments?: number

    // Number of deleted documents
    deletedDocuments?: number

    // Number of documents found on a batch-delete
    providedIds?: number

    // Primary key on index creation
    primaryKey?: string

    // Ranking rules on settings actions
    rankingRules?: RankingRules

    // Searchable attributes on settings actions
    searchableAttributes?: SearchableAttributes

    // Displayed attributes on settings actions
    displayedAttributes?: DisplayedAttributes

    // Filterable attributes on settings actions
    filterableAttributes?: FilterableAttributes

    // Sortable attributes on settings actions
    sortableAttributes?: SortableAttributes

    // Stop words on settings actions
    stopWords?: StopWords

    // Stop words on settings actions
    synonyms?: Synonyms

    // Distinct attribute on settings actions
    distinctAttribute?: DistinctAttribute

    // Object containing the payload originating the `indexSwap` task creation
    swaps?: SwapIndexesParams

    // Number of tasks that matched the originalQuery filter
    matchedTasks?: number

    // Number of tasks that were canceled
    canceledTasks?: number

    // Number of tasks that were deleted
    deletedTasks?: number

    // Query parameters used to filter the tasks
    originalFilter?: string
  }
  error: MeiliSearchErrorInfo | null
  duration: string
  startedAt: string
  finishedAt: string
}

export type SwapIndexesParams = Array<{
  indexes: string[]
}>

type CursorResults<T> = {
  results: T[]
  limit: number
  from: number
  next: number
}

export type TasksResults = CursorResults<Task>
export type TasksResultsObject = CursorResults<TaskObject>

export type WaitOptions = {
  timeOutMs?: number
  intervalMs?: number
}

/*
 *** HEALTH
 */

export type Health = {
  status: 'available'
}

/*
 *** STATS
 */

export type IndexStats = {
  numberOfDocuments: number
  isIndexing: boolean
  fieldDistribution: FieldDistribution
}

export type Stats = {
  databaseSize: number
  lastUpdate: string
  indexes: {
    [index: string]: IndexStats
  }
}

/*
 ** Keys
 */

export type Key = {
  uid: string
  description: string
  name: string | null
  key: string
  actions: string[]
  indexes: string[]
  expiresAt: Date
  createdAt: Date
  updateAt: Date
}

export type KeyCreation = {
  uid?: string
  name?: string
  description?: string
  actions: string[]
  indexes: string[]
  expiresAt: Date | null
}

export type KeyUpdate = {
  name?: string
  description?: string
}

export type KeysQuery = ResourceQuery & {}

export type KeysResults = ResourceResults<Key[]> & {}

/*
 ** version
 */
export type Version = {
  commitSha: string
  commitDate: string
  pkgVersion: string
}

/*
 ** ERROR HANDLER
 */

export interface FetchError extends Error {
  type: string
  errno: string
  code: string
}

export type MeiliSearchErrorInfo = {
  code: string
  link: string
  message: string
  type: string
}

export const enum ErrorStatusCode {
  /** @see https://docs.meilisearch.com/errors/#index_creation_failed */
  INDEX_CREATION_FAILED = 'index_creation_failed',

  /** @see https://docs.meilisearch.com/errors/#missing_index_uid */
  MISSING_INDEX_UID = 'missing_index_uid',

  /** @see https://docs.meilisearch.com/errors/#index_already_exists */
  INDEX_ALREADY_EXISTS = 'index_already_exists',

  /** @see https://docs.meilisearch.com/errors/#index_not_found */
  INDEX_NOT_FOUND = 'index_not_found',

  /** @see https://docs.meilisearch.com/errors/#invalid_index_uid */
  INVALID_INDEX_UID = 'invalid_index_uid',

  /** @see https://docs.meilisearch.com/errors/#index_not_accessible */
  INDEX_NOT_ACCESSIBLE = 'index_not_accessible',

  /** @see https://docs.meilisearch.com/errors/#invalid_index_offset */
  INVALID_INDEX_OFFSET = 'invalid_index_offset',

  /** @see https://docs.meilisearch.com/errors/#invalid_index_limit */
  INVALID_INDEX_LIMIT = 'invalid_index_limit',

  /** @see https://docs.meilisearch.com/errors/#invalid_state */
  INVALID_STATE = 'invalid_state',

  /** @see https://docs.meilisearch.com/errors/#primary_key_inference_failed */
  PRIMARY_KEY_INFERENCE_FAILED = 'primary_key_inference_failed',

  /** @see https://docs.meilisearch.com/errors/#index_primary_key_already_exists */
  INDEX_PRIMARY_KEY_ALREADY_EXISTS = 'index_primary_key_already_exists',

  /** @see https://docs.meilisearch.com/errors/#invalid_index_primary_key */
  INVALID_INDEX_PRIMARY_KEY = 'invalid_index_primary_key',

  /** @see https://docs.meilisearch.com/errors/#max_fields_limit_exceeded */
  DOCUMENTS_FIELDS_LIMIT_REACHED = 'document_fields_limit_reached',

  /** @see https://docs.meilisearch.com/errors/#missing_document_id */
  MISSING_DOCUMENT_ID = 'missing_document_id',

  /** @see https://docs.meilisearch.com/errors/#missing_document_id */
  INVALID_DOCUMENT_ID = 'invalid_document_id',

  /** @see https://docs.meilisearch.com/errors/#invalid_content_type */
  INVALID_CONTENT_TYPE = 'invalid_content_type',

  /** @see https://docs.meilisearch.com/errors/#missing_content_type */
  MISSING_CONTENT_TYPE = 'missing_content_type',

  /** @see https://docs.meilisearch.com/errors/#invalid_document_fields */
  INVALID_DOCUMENT_FIELDS = 'invalid_document_fields',

  /** @see https://docs.meilisearch.com/errors/#invalid_document_limit */
  INVALID_DOCUMENT_LIMIT = 'invalid_document_limit',

  /** @see https://docs.meilisearch.com/errors/#invalid_document_offset */
  INVALID_DOCUMENT_OFFSET = 'invalid_document_offset',

  /** @see https://docs.meilisearch.com/errors/#payload_too_large */
  PAYLOAD_TOO_LARGE = 'payload_too_large',

  /** @see https://docs.meilisearch.com/errors/#missing_payload */
  MISSING_PAYLOAD = 'missing_payload',

  /** @see https://docs.meilisearch.com/errors/#malformed_payload */
  MALFORMED_PAYLOAD = 'malformed_payload',

  /** @see https://docs.meilisearch.com/errors/#no_space_left_on_device */
  NO_SPACE_LEFT_ON_DEVICE = 'no_space_left_on_device',

  /** @see https://docs.meilisearch.com/errors/#invalid_store_file */
  INVALID_STORE_FILE = 'invalid_store_file',

  /** @see https://docs.meilisearch.com/errors/#invalid_ranking_rules */
  INVALID_RANKING_RULES = 'missing_document_id',

  /** @see https://docs.meilisearch.com/errors/#invalid_request */
  INVALID_REQUEST = 'invalid_request',

  /** @see https://docs.meilisearch.com/errors/#invalid_document_geo_field */
  INVALID_DOCUMENT_GEO_FIELD = 'invalid_document_geo_field',

  /** @see https://docs.meilisearch.com/errors/#invalid_search_q */
  INVALID_SEARCH_Q = 'invalid_search_q',

  /** @see https://docs.meilisearch.com/errors/#invalid_search_offset */
  INVALID_SEARCH_OFFSET = 'invalid_search_offset',

  /** @see https://docs.meilisearch.com/errors/#invalid_search_limit */
  INVALID_SEARCH_LIMIT = 'invalid_search_limit',

  /** @see https://docs.meilisearch.com/errors/#invalid_search_page */
  INVALID_SEARCH_PAGE = 'invalid_search_page',

  /** @see https://docs.meilisearch.com/errors/#invalid_search_hits_per_page */
  INVALID_SEARCH_HITS_PER_PAGE = 'invalid_search_hits_per_page',

  /** @see https://docs.meilisearch.com/errors/#invalid_search_attributes_to_retrieve */
  INVALID_SEARCH_ATTRIBUTES_TO_RETRIEVE = 'invalid_search_attributes_to_retrieve',

  /** @see https://docs.meilisearch.com/errors/#invalid_search_attributes_to_crop */
  INVALID_SEARCH_ATTRIBUTES_TO_CROP = 'invalid_search_attributes_to_crop',

  /** @see https://docs.meilisearch.com/errors/#invalid_search_crop_length */
  INVALID_SEARCH_CROP_LENGTH = 'invalid_search_crop_length',

  /** @see https://docs.meilisearch.com/errors/#invalid_search_attributes_to_highlight */
  INVALID_SEARCH_ATTRIBUTES_TO_HIGHLIGHT = 'invalid_search_attributes_to_highlight',

  /** @see https://docs.meilisearch.com/errors/#invalid_search_show_matches_position */
  INVALID_SEARCH_SHOW_MATCHES_POSITION = 'invalid_search_show_matches_position',

  /** @see https://docs.meilisearch.com/errors/#invalid_search_filter */
  INVALID_SEARCH_FILTER = 'invalid_search_filter',

  /** @see https://docs.meilisearch.com/errors/#invalid_search_sort */
  INVALID_SEARCH_SORT = 'invalid_search_sort',

  /** @see https://docs.meilisearch.com/errors/#invalid_search_facets */
  INVALID_SEARCH_FACETS = 'invalid_search_facets',

  /** @see https://docs.meilisearch.com/errors/#invalid_search_highlight_pre_tag */
  INVALID_SEARCH_HIGHLIGHT_PRE_TAG = 'invalid_search_highlight_pre_tag',

  /** @see https://docs.meilisearch.com/errors/#invalid_search_highlight_post_tag */
  INVALID_SEARCH_HIGHLIGHT_POST_TAG = 'invalid_search_highlight_post_tag',

  /** @see https://docs.meilisearch.com/errors/#invalid_search_crop_marker */
  INVALID_SEARCH_CROP_MARKER = 'invalid_search_crop_marker',

  /** @see https://docs.meilisearch.com/errors/#invalid_search_matching_strategy */
  INVALID_SEARCH_MATCHING_STRATEGY = 'invalid_search_matching_strategy',

  /** @see https://docs.meilisearch.com/errors/#bad_request */
  BAD_REQUEST = 'bad_request',

  /** @see https://docs.meilisearch.com/errors/#document_not_found */
  DOCUMENT_NOT_FOUND = 'document_not_found',

  /** @see https://docs.meilisearch.com/errors/#internal */
  INTERNAL = 'internal',

  /** @see https://docs.meilisearch.com/errors/#invalid_api_key */
  INVALID_API_KEY = 'invalid_api_key',

  /** @see https://docs.meilisearch.com/errors/#invalid_api_key_description */
  INVALID_API_KEY_DESCRIPTION = 'invalid_api_key_description',

  /** @see https://docs.meilisearch.com/errors/#invalid_api_key_actions */
  INVALID_API_KEY_ACTIONS = 'invalid_api_key_actions',

  /** @see https://docs.meilisearch.com/errors/#invalid_api_key_indexes */
  INVALID_API_KEY_INDEXES = 'invalid_api_key_indexes',

  /** @see https://docs.meilisearch.com/errors/#invalid_api_key_expires_at */
  INVALID_API_KEY_EXPIRES_AT = 'invalid_api_key_expires_at',

  /** @see https://docs.meilisearch.com/errors/#api_key_not_found */
  API_KEY_NOT_FOUND = 'api_key_not_found',

  /** @see https://docs.meilisearch.com/errors/#immutable_api_key_uid */
  IMMUTABLE_API_KEY_UID = 'immutable_api_key_uid',

  /** @see https://docs.meilisearch.com/errors/#immutable_api_key_actions */
  IMMUTABLE_API_KEY_ACTIONS = 'immutable_api_key_actions',

  /** @see https://docs.meilisearch.com/errors/#immutable_api_key_indexes */
  IMMUTABLE_API_KEY_INDEXES = 'immutable_api_key_indexes',

  /** @see https://docs.meilisearch.com/errors/#immutable_api_key_expires_at */
  IMMUTABLE_API_KEY_EXPIRES_AT = 'immutable_api_key_expires_at',

  /** @see https://docs.meilisearch.com/errors/#immutable_api_key_created_at */
  IMMUTABLE_API_KEY_CREATED_AT = 'immutable_api_key_created_at',

  /** @see https://docs.meilisearch.com/errors/#immutable_api_key_updated_at */
  IMMUTABLE_API_KEY_UPDATED_AT = 'immutable_api_key_updated_at',

  /** @see https://docs.meilisearch.com/errors/#missing_authorization_header */
  MISSING_AUTHORIZATION_HEADER = 'missing_authorization_header',

  /** @see https://docs.meilisearch.com/errors/#unretrievable_document */
  UNRETRIEVABLE_DOCUMENT = 'unretrievable_document',

  /** @see https://docs.meilisearch.com/errors/#database_size_limit_reached */
  MAX_DATABASE_SIZE_LIMIT_REACHED = 'database_size_limit_reached',

  /** @see https://docs.meilisearch.com/errors/#task_not_found */
  TASK_NOT_FOUND = 'task_not_found',

  /** @see https://docs.meilisearch.com/errors/#dump_process_failed */
  DUMP_PROCESS_FAILED = 'dump_process_failed',

  /** @see https://docs.meilisearch.com/errors/#dump_not_found */
  DUMP_NOT_FOUND = 'dump_not_found',

  /** @see https://docs.meilisearch.com/errors/#invalid_swap_duplicate_index_found */
  INVALID_SWAP_DUPLICATE_INDEX_FOUND = 'invalid_swap_duplicate_index_found',

  /** @see https://docs.meilisearch.com/errors/#invalid_swap_indexes */
  INVALID_SWAP_INDEXES = 'invalid_swap_indexes',

  /** @see https://docs.meilisearch.com/errors/#missing_swap_indexes */
  MISSING_SWAP_INDEXES = 'missing_swap_indexes',

  /** @see https://docs.meilisearch.com/errors/#missing_master_key */
  MISSING_MASTER_KEY = 'missing_master_key',

  /** @see http://docs.meilisearch.com/errors/#invalid_task_types */
  INVALID_TASK_TYPES = 'invalid_task_types',

  /** @see http://docs.meilisearch.com/errors/#invalid_task_uids */
  INVALID_TASK_UIDS = 'invalid_task_uids',

  /** @see http://docs.meilisearch.com/errors/#invalid_task_statuses */
  INVALID_TASK_STATUSES = 'invalid_task_statuses',

  /** @see http://docs.meilisearch.com/errors/#invalid_task_limit */
  INVALID_TASK_LIMIT = 'invalid_task_limit',

  /** @see http://docs.meilisearch.com/errors/#invalid_task_from */
  INVALID_TASK_FROM = 'invalid_task_from',

  /** @see http://docs.meilisearch.com/errors/#invalid_task_canceled_by */
  INVALID_TASK_CANCELED_BY = 'invalid_task_canceled_by',

  /** @see http://docs.meilisearch.com/errors/#missing_task_filters */
  MISSING_TASK_FILTERS = 'missing_task_filters',

  /** @see http://docs.meilisearch.com/errors/#too_many_open_files */
  TOO_MANY_OPEN_FILES = 'too_many_open_files',

  /** @see http://docs.meilisearch.com/errors/#io_error */
  IO_ERROR = 'io_error',

  /** @see http://docs.meilisearch.com/errors/#invalid_task_index_uids */
  INVALID_TASK_INDEX_UIDS = 'invalid_task_index_uids',

  /** @see http://docs.meilisearch.com/errors/#immutable_index_uid */
  IMMUTABLE_INDEX_UID = 'immutable_index_uid',

  /** @see http://docs.meilisearch.com/errors/#immutable_index_created_at */
  IMMUTABLE_INDEX_CREATED_AT = 'immutable_index_created_at',

  /** @see http://docs.meilisearch.com/errors/#immutable_index_updated_at */
  IMMUTABLE_INDEX_UPDATED_AT = 'immutable_index_updated_at',

  /** @see http://docs.meilisearch.com/errors/#invalid_settings_displayed_attributes */
  INVALID_SETTINGS_DISPLAYED_ATTRIBUTES = 'invalid_settings_displayed_attributes',

  /** @see http://docs.meilisearch.com/errors/#invalid_settings_searchable_attributes */
  INVALID_SETTINGS_SEARCHABLE_ATTRIBUTES = 'invalid_settings_searchable_attributes',

  /** @see http://docs.meilisearch.com/errors/#invalid_settings_filterable_attributes */
  INVALID_SETTINGS_FILTERABLE_ATTRIBUTES = 'invalid_settings_filterable_attributes',

  /** @see http://docs.meilisearch.com/errors/#invalid_settings_sortable_attributes */
  INVALID_SETTINGS_SORTABLE_ATTRIBUTES = 'invalid_settings_sortable_attributes',

  /** @see http://docs.meilisearch.com/errors/#invalid_settings_ranking_rules */
  INVALID_SETTINGS_RANKING_RULES = 'invalid_settings_ranking_rules',

  /** @see http://docs.meilisearch.com/errors/#invalid_settings_stop_words */
  INVALID_SETTINGS_STOP_WORDS = 'invalid_settings_stop_words',

  /** @see http://docs.meilisearch.com/errors/#invalid_settings_synonyms */
  INVALID_SETTINGS_SYNONYMS = 'invalid_settings_synonyms',

  /** @see http://docs.meilisearch.com/errors/#invalid_settings_distinct_attribute */
  INVALID_SETTINGS_DISTINCT_ATTRIBUTE = 'invalid_settings_distinct_attribute',

  /** @see http://docs.meilisearch.com/errors/#invalid_settings_typo_tolerance */
  INVALID_SETTINGS_TYPO_TOLERANCE = 'invalid_settings_typo_tolerance',

  /** @see http://docs.meilisearch.com/errors/#invalid_settings_faceting */
  INVALID_SETTINGS_FACETING = 'invalid_settings_faceting',

  /** @see http://docs.meilisearch.com/errors/#invalid_settings_pagination */
  INVALID_SETTINGS_PAGINATION = 'invalid_settings_pagination',

  /** @see http://docs.meilisearch.com/errors/#invalid_task_before_enqueued_at */
  INVALID_TASK_BEFORE_ENQUEUED_AT = 'invalid_task_before_enqueued_at',

  /** @see http://docs.meilisearch.com/errors/#invalid_task_after_enqueued_at */
  INVALID_TASK_AFTER_ENQUEUED_AT = 'invalid_task_after_enqueued_at',

  /** @see http://docs.meilisearch.com/errors/#invalid_task_before_started_at */
  INVALID_TASK_BEFORE_STARTED_AT = 'invalid_task_before_started_at',

  /** @see http://docs.meilisearch.com/errors/#invalid_task_after_started_at */
  INVALID_TASK_AFTER_STARTED_AT = 'invalid_task_after_started_at',

  /** @see http://docs.meilisearch.com/errors/#invalid_task_before_finished_at */
  INVALID_TASK_BEFORE_FINISHED_AT = 'invalid_task_before_finished_at',

  /** @see http://docs.meilisearch.com/errors/#invalid_task_after_finished_at */
  INVALID_TASK_AFTER_FINISHED_AT = 'invalid_task_after_finished_at',

  /** @see http://docs.meilisearch.com/errors/#missing_api_key_actions */
  MISSING_API_KEY_ACTIONS = 'missing_api_key_actions',

  /** @see http://docs.meilisearch.com/errors/#missing_api_key_indexes */
  MISSING_API_KEY_INDEXES = 'missing_api_key_indexes',

  /** @see http://docs.meilisearch.com/errors/#missing_api_key_expires_at */
  MISSING_API_KEY_EXPIRES_AT = 'missing_api_key_expires_at',

  /** @see http://docs.meilisearch.com/errors/#invalid_api_key_limit */
  INVALID_API_KEY_LIMIT = 'invalid_api_key_limit',

  /** @see http://docs.meilisearch.com/errors/#invalid_api_key_offset */
  INVALID_API_KEY_OFFSET = 'invalid_api_key_offset',
}

export type TokenIndexRules = {
  [field: string]: any
  filter?: Filter
}
export type TokenSearchRules = Record<string, TokenIndexRules | null> | string[]

export type TokenOptions = {
  apiKey?: string
  expiresAt?: Date
}
