/*
 * Bundle: MeiliSearch / Indexes
 * Project: MeiliSearch - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, MeiliSearch
 */

'use strict'

import { MeiliSearchError } from './errors'

import {
  Config,
  SearchResponse,
  SearchParams,
  Filter,
  SearchRequestGET,
  IndexObject,
  IndexOptions,
  IndexStats,
  DocumentsQuery,
  DocumentQuery,
  DocumentOptions,
  Settings,
  Synonyms,
  StopWords,
  RankingRules,
  DistinctAttribute,
  FilterableAttributes,
  SortableAttributes,
  SearchableAttributes,
  DisplayedAttributes,
  TypoTolerance,
  WaitOptions,
  TasksQuery,
  TasksResults,
  PaginationSettings,
  Faceting,
  ResourceResults,
  RawDocumentAdditionOptions,
  ContentType,
} from './types'
import { removeUndefinedFromObject } from './utils'
import { HttpRequests } from './http-requests'
import { Task, TaskClient } from './task'
import { EnqueuedTask } from './enqueued-task'

class Index<T extends Record<string, any> = Record<string, any>> {
  uid: string
  primaryKey: string | undefined
  createdAt: Date | undefined
  updatedAt: Date | undefined
  httpRequest: HttpRequests
  tasks: TaskClient

  /**
   * @param config - Request configuration options
   * @param uid - UID of the index
   * @param primaryKey - Primary Key of the index
   */
  constructor(config: Config, uid: string, primaryKey?: string) {
    this.uid = uid
    this.primaryKey = primaryKey
    this.httpRequest = new HttpRequests(config)
    this.tasks = new TaskClient(config)
  }

  ///
  /// SEARCH
  ///

  /**
   * Search for documents into an index
   *
   * @param query - Query string
   * @param options - Search options
   * @param config - Additional request configuration options
   * @returns Promise containing the search response
   */
  async search<
    D extends Record<string, any> = T,
    S extends SearchParams = SearchParams
  >(
    query?: string | null,
    options?: S,
    config?: Partial<Request>
  ): Promise<SearchResponse<D, S>> {
    const url = `indexes/${this.uid}/search`

    return await this.httpRequest.post(
      url,
      removeUndefinedFromObject({ q: query, ...options }),
      undefined,
      config
    )
  }

  /**
   * Search for documents into an index using the GET method
   *
   * @param query - Query string
   * @param options - Search options
   * @param config - Additional request configuration options
   * @returns Promise containing the search response
   */
  async searchGet<
    D extends Record<string, any> = T,
    S extends SearchParams = SearchParams
  >(
    query?: string | null,
    options?: S,
    config?: Partial<Request>
  ): Promise<SearchResponse<D, S>> {
    const url = `indexes/${this.uid}/search`

    const parseFilter = (filter?: Filter): string | undefined => {
      if (typeof filter === 'string') return filter
      else if (Array.isArray(filter))
        throw new MeiliSearchError(
          'The filter query parameter should be in string format when using searchGet'
        )
      else return undefined
    }

    const getParams: SearchRequestGET = {
      q: query,
      ...options,
      filter: parseFilter(options?.filter),
      sort: options?.sort?.join(','),
      facets: options?.facets?.join(','),
      attributesToRetrieve: options?.attributesToRetrieve?.join(','),
      attributesToCrop: options?.attributesToCrop?.join(','),
      attributesToHighlight: options?.attributesToHighlight?.join(','),
    }

    return await this.httpRequest.get<SearchResponse<D, S>>(
      url,
      removeUndefinedFromObject(getParams),
      config
    )
  }

  ///
  /// INDEX
  ///

  /**
   * Get index information.
   *
   * @returns Promise containing index information
   */
  async getRawInfo(): Promise<IndexObject> {
    const url = `indexes/${this.uid}`
    const res = await this.httpRequest.get<IndexObject>(url)
    this.primaryKey = res.primaryKey
    this.updatedAt = new Date(res.updatedAt)
    this.createdAt = new Date(res.createdAt)
    return res
  }

  /**
   * Fetch and update Index information.
   *
   * @returns Promise to the current Index object with updated information
   */
  async fetchInfo(): Promise<this> {
    await this.getRawInfo()
    return this
  }

  /**
   * Get Primary Key.
   *
   * @returns Promise containing the Primary Key of the index
   */
  async fetchPrimaryKey(): Promise<string | undefined> {
    this.primaryKey = (await this.getRawInfo()).primaryKey
    return this.primaryKey
  }

  /**
   * Create an index.
   *
   * @param uid - Unique identifier of the Index
   * @param options - Index options
   * @param config - Request configuration options
   * @returns Newly created Index object
   */
  static async create(
    uid: string,
    options: IndexOptions = {},
    config: Config
  ): Promise<EnqueuedTask> {
    const url = `indexes`
    const req = new HttpRequests(config)
    const task = await req.post(url, { ...options, uid })

    return new EnqueuedTask(task)
  }

  /**
   * Update an index.
   *
   * @param data - Data to update
   * @returns Promise to the current Index object with updated information
   */
  async update(data: IndexOptions): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}`
    const task = await this.httpRequest.patch(url, data)

    task.enqueuedAt = new Date(task.enqueuedAt)

    return task
  }

  /**
   * Delete an index.
   *
   * @returns Promise which resolves when index is deleted successfully
   */
  async delete(): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}`
    const task = await this.httpRequest.delete(url)

    return new EnqueuedTask(task)
  }

  ///
  /// TASKS
  ///

  /**
   * Get the list of all the tasks of the index.
   *
   * @param parameters - Parameters to browse the tasks
   * @returns Promise containing all tasks
   */
  async getTasks(parameters: TasksQuery = {}): Promise<TasksResults> {
    return await this.tasks.getTasks({ ...parameters, indexUids: [this.uid] })
  }

  /**
   * Get one task of the index.
   *
   * @param taskUid - Task identifier
   * @returns Promise containing a task
   */
  async getTask(taskUid: number): Promise<Task> {
    return await this.tasks.getTask(taskUid)
  }

  /**
   * Wait for multiple tasks to be processed.
   *
   * @param taskUids - Tasks identifier
   * @param waitOptions - Options on timeout and interval
   * @returns Promise containing an array of tasks
   */
  async waitForTasks(
    taskUids: number[],
    { timeOutMs = 5000, intervalMs = 50 }: WaitOptions = {}
  ): Promise<Task[]> {
    return await this.tasks.waitForTasks(taskUids, {
      timeOutMs,
      intervalMs,
    })
  }

  /**
   * Wait for a task to be processed.
   *
   * @param taskUid - Task identifier
   * @param waitOptions - Options on timeout and interval
   * @returns Promise containing an array of tasks
   */
  async waitForTask(
    taskUid: number,
    { timeOutMs = 5000, intervalMs = 50 }: WaitOptions = {}
  ): Promise<Task> {
    return await this.tasks.waitForTask(taskUid, {
      timeOutMs,
      intervalMs,
    })
  }

  ///
  /// STATS
  ///

  /**
   * Get stats of an index
   *
   * @returns Promise containing object with stats of the index
   */
  async getStats(): Promise<IndexStats> {
    const url = `indexes/${this.uid}/stats`
    return await this.httpRequest.get<IndexStats>(url)
  }

  ///
  /// DOCUMENTS
  ///

  /**
   * Get documents of an index
   *
   * @param parameters - Parameters to browse the documents
   * @returns Promise containing Document responses
   */
  async getDocuments<D extends Record<string, any> = T>(
    parameters: DocumentsQuery<D> = {}
  ): Promise<ResourceResults<D[]>> {
    const url = `indexes/${this.uid}/documents`

    const fields = (() => {
      if (Array.isArray(parameters?.fields)) {
        return parameters?.fields?.join(',')
      }
      return undefined
    })()

    return await this.httpRequest.get<Promise<ResourceResults<D[]>>>(
      url,
      removeUndefinedFromObject({
        ...parameters,
        fields,
      })
    )
  }

  /**
   * Get one document
   *
   * @param documentId - Document ID
   * @param parameters - Parameters applied on a document
   * @returns Promise containing Document response
   */
  async getDocument<D extends Record<string, any> = T>(
    documentId: string | number,
    parameters?: DocumentQuery<T>
  ): Promise<D> {
    const url = `indexes/${this.uid}/documents/${documentId}`

    const fields = (() => {
      if (Array.isArray(parameters?.fields)) {
        return parameters?.fields?.join(',')
      }
      return undefined
    })()

    return await this.httpRequest.get<D>(
      url,
      removeUndefinedFromObject({
        ...parameters,
        fields,
      })
    )
  }

  /**
   * Add or replace multiples documents to an index
   *
   * @param documents - Array of Document objects to add/replace
   * @param options - Options on document addition
   * @returns Promise containing an EnqueuedTask
   */
  async addDocuments(
    documents: T[],
    options?: DocumentOptions
  ): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/documents`
    const task = await this.httpRequest.post(url, documents, options)

    return new EnqueuedTask(task)
  }

  /**
   * Add or replace multiples documents in a string format to an index. It only
   * supports csv, ndjson and json formats.
   *
   * @param documents - Documents provided in a string to add/replace
   * @param contentType - Content type of your document:
   *   'text/csv'|'application/x-ndjson'|'application/json'
   * @param options - Options on document addition
   * @returns Promise containing an EnqueuedTask
   */
  async addDocumentsFromString(
    documents: string,
    contentType: ContentType,
    queryParams?: RawDocumentAdditionOptions
  ): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/documents`

    const task = await this.httpRequest.post(url, documents, queryParams, {
      headers: {
        'Content-Type': contentType,
      },
    })

    return new EnqueuedTask(task)
  }

  /**
   * Add or replace multiples documents to an index in batches
   *
   * @param documents - Array of Document objects to add/replace
   * @param batchSize - Size of the batch
   * @param options - Options on document addition
   * @returns Promise containing array of enqueued task objects for each batch
   */
  async addDocumentsInBatches(
    documents: T[],
    batchSize = 1000,
    options?: DocumentOptions
  ): Promise<EnqueuedTask[]> {
    const updates = []
    for (let i = 0; i < documents.length; i += batchSize) {
      updates.push(
        await this.addDocuments(documents.slice(i, i + batchSize), options)
      )
    }
    return updates
  }

  /**
   * Add or update multiples documents to an index
   *
   * @param documents - Array of Document objects to add/update
   * @param options - Options on document update
   * @returns Promise containing an EnqueuedTask
   */
  async updateDocuments(
    documents: Array<Partial<T>>,
    options?: DocumentOptions
  ): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/documents`
    const task = await this.httpRequest.put(url, documents, options)

    return new EnqueuedTask(task)
  }

  /**
   * Add or update multiples documents to an index in batches
   *
   * @param documents - Array of Document objects to add/update
   * @param batchSize - Size of the batch
   * @param options - Options on document update
   * @returns Promise containing array of enqueued task objects for each batch
   */
  async updateDocumentsInBatches(
    documents: Array<Partial<T>>,
    batchSize = 1000,
    options?: DocumentOptions
  ): Promise<EnqueuedTask[]> {
    const updates = []
    for (let i = 0; i < documents.length; i += batchSize) {
      updates.push(
        await this.updateDocuments(documents.slice(i, i + batchSize), options)
      )
    }
    return updates
  }

  /**
   * Add or update multiples documents in a string format to an index. It only
   * supports csv, ndjson and json formats.
   *
   * @param documents - Documents provided in a string to add/update
   * @param contentType - Content type of your document:
   *   'text/csv'|'application/x-ndjson'|'application/json'
   * @param queryParams - Options on raw document addition
   * @returns Promise containing an EnqueuedTask
   */
  async updateDocumentsFromString(
    documents: string,
    contentType: ContentType,
    queryParams?: RawDocumentAdditionOptions
  ): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/documents`

    const task = await this.httpRequest.put(url, documents, queryParams, {
      headers: {
        'Content-Type': contentType,
      },
    })

    return new EnqueuedTask(task)
  }

  /**
   * Delete one document
   *
   * @param documentId - Id of Document to delete
   * @returns Promise containing an EnqueuedTask
   */
  async deleteDocument(documentId: string | number): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/documents/${documentId}`
    const task = await this.httpRequest.delete<EnqueuedTask>(url)

    task.enqueuedAt = new Date(task.enqueuedAt)

    return task
  }

  /**
   * Delete multiples documents of an index
   *
   * @param documentsIds - Array of Document Ids to delete
   * @returns Promise containing an EnqueuedTask
   */
  async deleteDocuments(
    documentsIds: string[] | number[]
  ): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/documents/delete-batch`

    const task = await this.httpRequest.post(url, documentsIds)

    return new EnqueuedTask(task)
  }

  /**
   * Delete all documents of an index
   *
   * @returns Promise containing an EnqueuedTask
   */
  async deleteAllDocuments(): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/documents`
    const task = await this.httpRequest.delete<EnqueuedTask>(url)

    task.enqueuedAt = new Date(task.enqueuedAt)

    return task
  }

  ///
  /// SETTINGS
  ///

  /**
   * Retrieve all settings
   *
   * @returns Promise containing Settings object
   */
  async getSettings(): Promise<Settings> {
    const url = `indexes/${this.uid}/settings`
    return await this.httpRequest.get<Settings>(url)
  }

  /**
   * Update all settings Any parameters not provided will be left unchanged.
   *
   * @param settings - Object containing parameters with their updated values
   * @returns Promise containing an EnqueuedTask
   */
  async updateSettings(settings: Settings): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings`
    const task = await this.httpRequest.patch(url, settings)

    task.enqueued = new Date(task.enqueuedAt)

    return task
  }

  /**
   * Reset settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  async resetSettings(): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings`
    const task = await this.httpRequest.delete<EnqueuedTask>(url)

    task.enqueuedAt = new Date(task.enqueuedAt)

    return task
  }

  ///
  /// PAGINATION SETTINGS
  ///

  /**
   * Get the pagination settings.
   *
   * @returns Promise containing object of pagination settings
   */
  async getPagination(): Promise<PaginationSettings> {
    const url = `indexes/${this.uid}/settings/pagination`
    return await this.httpRequest.get<object>(url)
  }

  /**
   * Update the pagination settings.
   *
   * @param pagination - Pagination object
   * @returns Promise containing an EnqueuedTask
   */
  async updatePagination(
    pagination: PaginationSettings
  ): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/pagination`
    const task = await this.httpRequest.patch(url, pagination)

    return new EnqueuedTask(task)
  }

  /**
   * Reset the pagination settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  async resetPagination(): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/pagination`
    const task = await this.httpRequest.delete(url)

    return new EnqueuedTask(task)
  }

  ///
  /// SYNONYMS
  ///

  /**
   * Get the list of all synonyms
   *
   * @returns Promise containing object of synonym mappings
   */
  async getSynonyms(): Promise<object> {
    const url = `indexes/${this.uid}/settings/synonyms`
    return await this.httpRequest.get<object>(url)
  }

  /**
   * Update the list of synonyms. Overwrite the old list.
   *
   * @param synonyms - Mapping of synonyms with their associated words
   * @returns Promise containing an EnqueuedTask
   */
  async updateSynonyms(synonyms: Synonyms): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/synonyms`
    const task = await this.httpRequest.put(url, synonyms)

    return new EnqueuedTask(task)
  }

  /**
   * Reset the synonym list to be empty again
   *
   * @returns Promise containing an EnqueuedTask
   */
  async resetSynonyms(): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/synonyms`
    const task = await this.httpRequest.delete<EnqueuedTask>(url)

    task.enqueuedAt = new Date(task.enqueuedAt)

    return task
  }

  ///
  /// STOP WORDS
  ///

  /**
   * Get the list of all stop-words
   *
   * @returns Promise containing array of stop-words
   */
  async getStopWords(): Promise<string[]> {
    const url = `indexes/${this.uid}/settings/stop-words`
    return await this.httpRequest.get<string[]>(url)
  }

  /**
   * Update the list of stop-words. Overwrite the old list.
   *
   * @param stopWords - Array of strings that contains the stop-words.
   * @returns Promise containing an EnqueuedTask
   */
  async updateStopWords(stopWords: StopWords): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/stop-words`
    const task = await this.httpRequest.put(url, stopWords)

    return new EnqueuedTask(task)
  }

  /**
   * Reset the stop-words list to be empty again
   *
   * @returns Promise containing an EnqueuedTask
   */
  async resetStopWords(): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/stop-words`
    const task = await this.httpRequest.delete<EnqueuedTask>(url)

    task.enqueuedAt = new Date(task.enqueuedAt)

    return task
  }

  ///
  /// RANKING RULES
  ///

  /**
   * Get the list of all ranking-rules
   *
   * @returns Promise containing array of ranking-rules
   */
  async getRankingRules(): Promise<string[]> {
    const url = `indexes/${this.uid}/settings/ranking-rules`
    return await this.httpRequest.get<string[]>(url)
  }

  /**
   * Update the list of ranking-rules. Overwrite the old list.
   *
   * @param rankingRules - Array that contain ranking rules sorted by order of
   *   importance.
   * @returns Promise containing an EnqueuedTask
   */
  async updateRankingRules(rankingRules: RankingRules): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/ranking-rules`
    const task = await this.httpRequest.put(url, rankingRules)

    return new EnqueuedTask(task)
  }

  /**
   * Reset the ranking rules list to its default value
   *
   * @returns Promise containing an EnqueuedTask
   */
  async resetRankingRules(): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/ranking-rules`
    const task = await this.httpRequest.delete<EnqueuedTask>(url)

    task.enqueuedAt = new Date(task.enqueuedAt)

    return task
  }

  ///
  /// DISTINCT ATTRIBUTE
  ///

  /**
   * Get the distinct-attribute
   *
   * @returns Promise containing the distinct-attribute of the index
   */
  async getDistinctAttribute(): Promise<string | null> {
    const url = `indexes/${this.uid}/settings/distinct-attribute`
    return await this.httpRequest.get<string | null>(url)
  }

  /**
   * Update the distinct-attribute.
   *
   * @param distinctAttribute - Field name of the distinct-attribute
   * @returns Promise containing an EnqueuedTask
   */
  async updateDistinctAttribute(
    distinctAttribute: DistinctAttribute
  ): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/distinct-attribute`
    const task = await this.httpRequest.put(url, distinctAttribute)

    return new EnqueuedTask(task)
  }

  /**
   * Reset the distinct-attribute.
   *
   * @returns Promise containing an EnqueuedTask
   */
  async resetDistinctAttribute(): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/distinct-attribute`
    const task = await this.httpRequest.delete<EnqueuedTask>(url)

    task.enqueuedAt = new Date(task.enqueuedAt)

    return task
  }

  ///
  /// FILTERABLE ATTRIBUTES
  ///

  /**
   * Get the filterable-attributes
   *
   * @returns Promise containing an array of filterable-attributes
   */
  async getFilterableAttributes(): Promise<string[]> {
    const url = `indexes/${this.uid}/settings/filterable-attributes`
    return await this.httpRequest.get<string[]>(url)
  }

  /**
   * Update the filterable-attributes.
   *
   * @param filterableAttributes - Array of strings containing the attributes
   *   that can be used as filters at query time
   * @returns Promise containing an EnqueuedTask
   */
  async updateFilterableAttributes(
    filterableAttributes: FilterableAttributes
  ): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/filterable-attributes`
    const task = await this.httpRequest.put(url, filterableAttributes)

    return new EnqueuedTask(task)
  }

  /**
   * Reset the filterable-attributes.
   *
   * @returns Promise containing an EnqueuedTask
   */
  async resetFilterableAttributes(): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/filterable-attributes`
    const task = await this.httpRequest.delete<EnqueuedTask>(url)

    task.enqueuedAt = new Date(task.enqueuedAt)

    return task
  }

  ///
  /// SORTABLE ATTRIBUTES
  ///

  /**
   * Get the sortable-attributes
   *
   * @returns Promise containing array of sortable-attributes
   */
  async getSortableAttributes(): Promise<string[]> {
    const url = `indexes/${this.uid}/settings/sortable-attributes`
    return await this.httpRequest.get<string[]>(url)
  }

  /**
   * Update the sortable-attributes.
   *
   * @param sortableAttributes - Array of strings containing the attributes that
   *   can be used to sort search results at query time
   * @returns Promise containing an EnqueuedTask
   */
  async updateSortableAttributes(
    sortableAttributes: SortableAttributes
  ): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/sortable-attributes`
    const task = await this.httpRequest.put(url, sortableAttributes)

    return new EnqueuedTask(task)
  }

  /**
   * Reset the sortable-attributes.
   *
   * @returns Promise containing an EnqueuedTask
   */
  async resetSortableAttributes(): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/sortable-attributes`
    const task = await this.httpRequest.delete<EnqueuedTask>(url)

    task.enqueuedAt = new Date(task.enqueuedAt)

    return task
  }

  ///
  /// SEARCHABLE ATTRIBUTE
  ///

  /**
   * Get the searchable-attributes
   *
   * @returns Promise containing array of searchable-attributes
   */
  async getSearchableAttributes(): Promise<string[]> {
    const url = `indexes/${this.uid}/settings/searchable-attributes`
    return await this.httpRequest.get<string[]>(url)
  }

  /**
   * Update the searchable-attributes.
   *
   * @param searchableAttributes - Array of strings that contains searchable
   *   attributes sorted by order of importance(most to least important)
   * @returns Promise containing an EnqueuedTask
   */
  async updateSearchableAttributes(
    searchableAttributes: SearchableAttributes
  ): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/searchable-attributes`
    const task = await this.httpRequest.put(url, searchableAttributes)

    return new EnqueuedTask(task)
  }

  /**
   * Reset the searchable-attributes.
   *
   * @returns Promise containing an EnqueuedTask
   */
  async resetSearchableAttributes(): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/searchable-attributes`
    const task = await this.httpRequest.delete<EnqueuedTask>(url)

    task.enqueuedAt = new Date(task.enqueuedAt)

    return task
  }

  ///
  /// DISPLAYED ATTRIBUTE
  ///

  /**
   * Get the displayed-attributes
   *
   * @returns Promise containing array of displayed-attributes
   */
  async getDisplayedAttributes(): Promise<string[]> {
    const url = `indexes/${this.uid}/settings/displayed-attributes`
    return await this.httpRequest.get<string[]>(url)
  }

  /**
   * Update the displayed-attributes.
   *
   * @param displayedAttributes - Array of strings that contains attributes of
   *   an index to display
   * @returns Promise containing an EnqueuedTask
   */
  async updateDisplayedAttributes(
    displayedAttributes: DisplayedAttributes
  ): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/displayed-attributes`
    const task = await this.httpRequest.put(url, displayedAttributes)

    return new EnqueuedTask(task)
  }

  /**
   * Reset the displayed-attributes.
   *
   * @returns Promise containing an EnqueuedTask
   */
  async resetDisplayedAttributes(): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/displayed-attributes`
    const task = await this.httpRequest.delete<EnqueuedTask>(url)

    task.enqueuedAt = new Date(task.enqueuedAt)

    return task
  }

  ///
  /// TYPO TOLERANCE
  ///

  /**
   * Get the typo tolerance settings.
   *
   * @returns Promise containing the typo tolerance settings.
   */
  async getTypoTolerance(): Promise<string[]> {
    const url = `indexes/${this.uid}/settings/typo-tolerance`
    return await this.httpRequest.get<string[]>(url)
  }

  /**
   * Update the typo tolerance settings.
   *
   * @param typoTolerance - Object containing the custom typo tolerance
   *   settings.
   * @returns Promise containing object of the enqueued update
   */
  async updateTypoTolerance(
    typoTolerance: TypoTolerance
  ): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/typo-tolerance`
    const task = await this.httpRequest.patch(url, typoTolerance)

    task.enqueuedAt = new Date(task.enqueuedAt)

    return task
  }

  /**
   * Reset the typo tolerance settings.
   *
   * @returns Promise containing object of the enqueued update
   */
  async resetTypoTolerance(): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/typo-tolerance`
    const task = await this.httpRequest.delete<EnqueuedTask>(url)

    task.enqueuedAt = new Date(task.enqueuedAt)

    return task
  }

  ///
  /// FACETING
  ///

  /**
   * Get the faceting settings.
   *
   * @returns Promise containing object of faceting index settings
   */
  async getFaceting(): Promise<Faceting> {
    const url = `indexes/${this.uid}/settings/faceting`
    return await this.httpRequest.get<Faceting>(url)
  }

  /**
   * Update the faceting settings.
   *
   * @param faceting - Faceting index settings object
   * @returns Promise containing an EnqueuedTask
   */
  async updateFaceting(faceting: Faceting): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/faceting`
    const task = await this.httpRequest.patch(url, faceting)

    return new EnqueuedTask(task)
  }

  /**
   * Reset the faceting settings.
   *
   * @returns Promise containing an EnqueuedTask
   */
  async resetFaceting(): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/faceting`
    const task = await this.httpRequest.delete(url)

    return new EnqueuedTask(task)
  }
}

export { Index }
