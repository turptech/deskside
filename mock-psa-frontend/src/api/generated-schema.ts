export interface paths {
  "/assets": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** List Assets */
    get: operations["list_assets_assets_get"]
    put?: never
    /** Create Asset */
    post: operations["create_asset_assets_post"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/assets/{asset_id}": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** Get Asset */
    get: operations["get_asset_assets__asset_id__get"]
    /** Replace Asset */
    put: operations["replace_asset_assets__asset_id__put"]
    post?: never
    /** Delete Asset */
    delete: operations["delete_asset_assets__asset_id__delete"]
    options?: never
    head?: never
    /** Update Asset */
    patch: operations["update_asset_assets__asset_id__patch"]
    trace?: never
  }
  "/login": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    /** Login */
    post: operations["login_login_post"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/me": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** Get Authenticated User */
    get: operations["get_authenticated_user_me_get"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/companies": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** List Companies */
    get: operations["list_companies_companies_get"]
    put?: never
    /** Create Company */
    post: operations["create_company_companies_post"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/companies/{company_id}": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** Get Company */
    get: operations["get_company_companies__company_id__get"]
    /** Replace Company */
    put: operations["replace_company_companies__company_id__put"]
    post?: never
    /** Delete Company */
    delete: operations["delete_company_companies__company_id__delete"]
    options?: never
    head?: never
    /** Update Company */
    patch: operations["update_company_companies__company_id__patch"]
    trace?: never
  }
  "/contacts": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** List Contacts */
    get: operations["list_contacts_contacts_get"]
    put?: never
    /** Create Contact */
    post: operations["create_contact_contacts_post"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/contacts/{contact_id}": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** Get Contact */
    get: operations["get_contact_contacts__contact_id__get"]
    /** Replace Contact */
    put: operations["replace_contact_contacts__contact_id__put"]
    post?: never
    /** Delete Contact */
    delete: operations["delete_contact_contacts__contact_id__delete"]
    options?: never
    head?: never
    /** Update Contact */
    patch: operations["update_contact_contacts__contact_id__patch"]
    trace?: never
  }
  "/knowledge-articles": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** List Knowledge Articles */
    get: operations["list_knowledge_articles_knowledge_articles_get"]
    put?: never
    /** Create Knowledge Article */
    post: operations["create_knowledge_article_knowledge_articles_post"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/knowledge-articles/{knowledge_article_id}": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** Get Knowledge Article */
    get: operations["get_knowledge_article_knowledge_articles__knowledge_article_id__get"]
    /** Replace Knowledge Article */
    put: operations["replace_knowledge_article_knowledge_articles__knowledge_article_id__put"]
    post?: never
    /** Delete Knowledge Article */
    delete: operations["delete_knowledge_article_knowledge_articles__knowledge_article_id__delete"]
    options?: never
    head?: never
    /** Update Knowledge Article */
    patch: operations["update_knowledge_article_knowledge_articles__knowledge_article_id__patch"]
    trace?: never
  }
  "/sites": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** List Sites */
    get: operations["list_sites_sites_get"]
    put?: never
    /** Create Site */
    post: operations["create_site_sites_post"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/sites/{site_id}": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** Get Site */
    get: operations["get_site_sites__site_id__get"]
    /** Replace Site */
    put: operations["replace_site_sites__site_id__put"]
    post?: never
    /** Delete Site */
    delete: operations["delete_site_sites__site_id__delete"]
    options?: never
    head?: never
    /** Update Site */
    patch: operations["update_site_sites__site_id__patch"]
    trace?: never
  }
  "/tickets/{ticket_id}/notes": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** List Ticket Notes */
    get: operations["list_ticket_notes_tickets__ticket_id__notes_get"]
    put?: never
    /** Create Ticket Note */
    post: operations["create_ticket_note_tickets__ticket_id__notes_post"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/tickets/{ticket_id}/notes/{note_id}": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** Get Ticket Note */
    get: operations["get_ticket_note_tickets__ticket_id__notes__note_id__get"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/tickets": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** List Tickets */
    get: operations["list_tickets_tickets_get"]
    put?: never
    /** Create Ticket */
    post: operations["create_ticket_tickets_post"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/tickets/{ticket_id}": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** Get Ticket */
    get: operations["get_ticket_tickets__ticket_id__get"]
    /** Replace Ticket */
    put: operations["replace_ticket_tickets__ticket_id__put"]
    post?: never
    /** Delete Ticket */
    delete: operations["delete_ticket_tickets__ticket_id__delete"]
    options?: never
    head?: never
    /** Update Ticket */
    patch: operations["update_ticket_tickets__ticket_id__patch"]
    trace?: never
  }
  "/tickets/{ticket_id}/time-entries": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** List Time Entries */
    get: operations["list_time_entries_tickets__ticket_id__time_entries_get"]
    put?: never
    /** Create Time Entry */
    post: operations["create_time_entry_tickets__ticket_id__time_entries_post"]
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/tickets/{ticket_id}/time-entries/{time_entry_id}": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** Get Time Entry */
    get: operations["get_time_entry_tickets__ticket_id__time_entries__time_entry_id__get"]
    /** Replace Time Entry */
    put: operations["replace_time_entry_tickets__ticket_id__time_entries__time_entry_id__put"]
    post?: never
    /** Delete Time Entry */
    delete: operations["delete_time_entry_tickets__ticket_id__time_entries__time_entry_id__delete"]
    options?: never
    head?: never
    /** Update Time Entry */
    patch: operations["update_time_entry_tickets__ticket_id__time_entries__time_entry_id__patch"]
    trace?: never
  }
  "/": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** Root */
    get: operations["root__get"]
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
}
export type webhooks = Record<string, never>
export interface components {
  schemas: {
    /** AssetCreate */
    AssetCreate: {
      /** Company Id */
      company_id: number
      /** Site Id */
      site_id?: number | null
      /** Contact Id */
      contact_id?: number | null
      /** Name */
      name: string
      asset_type: components["schemas"]["AssetType"]
      /** @default active */
      status: components["schemas"]["AssetStatus"]
      /** Manufacturer */
      manufacturer?: string | null
      /** Model */
      model?: string | null
      /** Serial Number */
      serial_number?: string | null
      /** Asset Tag */
      asset_tag?: string | null
      /** Hostname */
      hostname?: string | null
      /** Operating System */
      operating_system?: string | null
    }
    /** AssetRead */
    AssetRead: {
      /** Company Id */
      company_id: number
      /** Site Id */
      site_id?: number | null
      /** Contact Id */
      contact_id?: number | null
      /** Name */
      name: string
      asset_type: components["schemas"]["AssetType"]
      /** @default active */
      status: components["schemas"]["AssetStatus"]
      /** Manufacturer */
      manufacturer?: string | null
      /** Model */
      model?: string | null
      /** Serial Number */
      serial_number?: string | null
      /** Asset Tag */
      asset_tag?: string | null
      /** Hostname */
      hostname?: string | null
      /** Operating System */
      operating_system?: string | null
      /** Id */
      id: number
    }
    /**
     * AssetStatus
     * @enum {string}
     */
    AssetStatus: "active" | "inactive" | "in_stock" | "maintenance" | "retired"
    /**
     * AssetType
     * @enum {string}
     */
    AssetType:
      | "laptop"
      | "desktop"
      | "server"
      | "network_device"
      | "printer"
      | "mobile_device"
      | "other"
    /** AssetUpdate */
    AssetUpdate: {
      /** Company Id */
      company_id?: number | null
      /** Site Id */
      site_id?: number | null
      /** Contact Id */
      contact_id?: number | null
      /** Name */
      name?: string | null
      asset_type?: components["schemas"]["AssetType"] | null
      status?: components["schemas"]["AssetStatus"] | null
      /** Manufacturer */
      manufacturer?: string | null
      /** Model */
      model?: string | null
      /** Serial Number */
      serial_number?: string | null
      /** Asset Tag */
      asset_tag?: string | null
      /** Hostname */
      hostname?: string | null
      /** Operating System */
      operating_system?: string | null
    }
    /** AuthenticatedUserResponse */
    AuthenticatedUserResponse: {
      /** Id */
      id: number
      /** Email */
      email: string
      /** Role */
      role: string
    }
    /** Body_login_login_post */
    Body_login_login_post: {
      /** Grant Type */
      grant_type?: string | null
      /** Username */
      username: string
      /**
       * Password
       * Format: password
       */
      password: string
      /**
       * Scope
       * @default
       */
      scope: string
      /** Client Id */
      client_id?: string | null
      /**
       * Client Secret
       * Format: password
       */
      client_secret?: string | null
    }
    /** CompanyCreate */
    CompanyCreate: {
      /** Name */
      name: string
    }
    /** CompanyRead */
    CompanyRead: {
      /** Name */
      name: string
      /** Id */
      id: number
    }
    /** CompanyUpdate */
    CompanyUpdate: {
      /** Name */
      name?: string | null
    }
    /** ContactCreate */
    ContactCreate: {
      /** Company Id */
      company_id: number
      /** Site Id */
      site_id?: number | null
      /** First Name */
      first_name: string
      /** Last Name */
      last_name: string
      /**
       * Email
       * Format: email
       */
      email: string
      /** Phone */
      phone?: string | null
      /** Mobile Phone */
      mobile_phone?: string | null
      /** Job Title */
      job_title?: string | null
    }
    /** ContactRead */
    ContactRead: {
      /** Company Id */
      company_id: number
      /** Site Id */
      site_id?: number | null
      /** First Name */
      first_name: string
      /** Last Name */
      last_name: string
      /**
       * Email
       * Format: email
       */
      email: string
      /** Phone */
      phone?: string | null
      /** Mobile Phone */
      mobile_phone?: string | null
      /** Job Title */
      job_title?: string | null
      /** Id */
      id: number
    }
    /** ContactUpdate */
    ContactUpdate: {
      /** Company Id */
      company_id?: number | null
      /** Site Id */
      site_id?: number | null
      /** First Name */
      first_name?: string | null
      /** Last Name */
      last_name?: string | null
      /** Email */
      email?: string | null
      /** Phone */
      phone?: string | null
      /** Mobile Phone */
      mobile_phone?: string | null
      /** Job Title */
      job_title?: string | null
    }
    /** HTTPValidationError */
    HTTPValidationError: {
      /** Detail */
      detail?: components["schemas"]["ValidationError"][]
    }
    /** KnowledgeArticleCreate */
    KnowledgeArticleCreate: {
      /** Company Id */
      company_id?: number | null
      /** Site Id */
      site_id?: number | null
      /** Contact Id */
      contact_id?: number | null
      /** Asset Id */
      asset_id?: number | null
      /** Title */
      title: string
      /** Body */
      body: string
    }
    /** KnowledgeArticleRead */
    KnowledgeArticleRead: {
      /** Company Id */
      company_id?: number | null
      /** Site Id */
      site_id?: number | null
      /** Contact Id */
      contact_id?: number | null
      /** Asset Id */
      asset_id?: number | null
      /** Title */
      title: string
      /** Body */
      body: string
      /** Id */
      id: number
      /**
       * Created At
       * Format: date-time
       */
      created_at: string
      /**
       * Updated At
       * Format: date-time
       */
      updated_at: string
    }
    /** KnowledgeArticleUpdate */
    KnowledgeArticleUpdate: {
      /** Company Id */
      company_id?: number | null
      /** Site Id */
      site_id?: number | null
      /** Contact Id */
      contact_id?: number | null
      /** Asset Id */
      asset_id?: number | null
      /** Title */
      title?: string | null
      /** Body */
      body?: string | null
    }
    /** RootResponse */
    RootResponse: {
      /** Message */
      message: string
    }
    /** SiteCreate */
    SiteCreate: {
      /** Company Id */
      company_id: number
      /** Name */
      name: string
      /** Address Line1 */
      address_line1?: string | null
      /** Address Line2 */
      address_line2?: string | null
      /** City */
      city?: string | null
      /** State Province */
      state_province?: string | null
      /** Postal Code */
      postal_code?: string | null
      /** Country Code */
      country_code?: string | null
      /** Phone */
      phone?: string | null
      /** Timezone */
      timezone?: string | null
    }
    /** SiteRead */
    SiteRead: {
      /** Company Id */
      company_id: number
      /** Name */
      name: string
      /** Address Line1 */
      address_line1?: string | null
      /** Address Line2 */
      address_line2?: string | null
      /** City */
      city?: string | null
      /** State Province */
      state_province?: string | null
      /** Postal Code */
      postal_code?: string | null
      /** Country Code */
      country_code?: string | null
      /** Phone */
      phone?: string | null
      /** Timezone */
      timezone?: string | null
      /** Id */
      id: number
    }
    /** SiteUpdate */
    SiteUpdate: {
      /** Company Id */
      company_id?: number | null
      /** Name */
      name?: string | null
      /** Address Line1 */
      address_line1?: string | null
      /** Address Line2 */
      address_line2?: string | null
      /** City */
      city?: string | null
      /** State Province */
      state_province?: string | null
      /** Postal Code */
      postal_code?: string | null
      /** Country Code */
      country_code?: string | null
      /** Phone */
      phone?: string | null
      /** Timezone */
      timezone?: string | null
    }
    /** TicketCreate */
    TicketCreate: {
      /** Company Id */
      company_id: number
      /** Contact Id */
      contact_id: number
      /** Site Id */
      site_id?: number | null
      /** Asset Id */
      asset_id?: number | null
      /** Assigned User Id */
      assigned_user_id?: number | null
      /** Summary */
      summary: string
      /** Description */
      description?: string | null
      /** @default new */
      status: components["schemas"]["TicketStatus"]
      /** @default normal */
      priority: components["schemas"]["TicketPriority"]
      /** @default phone */
      source: components["schemas"]["TicketSource"]
    }
    /** TicketNoteCreate */
    TicketNoteCreate: {
      type: components["schemas"]["TicketNoteType"]
      /** Body */
      body: string
    }
    /** TicketNoteRead */
    TicketNoteRead: {
      type: components["schemas"]["TicketNoteType"]
      /** Body */
      body: string
      /** Id */
      id: number
      /** Ticket Id */
      ticket_id: number
      /** User Id */
      user_id: number | null
      /** Contact Id */
      contact_id: number | null
      /**
       * Created At
       * Format: date-time
       */
      created_at: string
    }
    /**
     * TicketNoteType
     * @enum {string}
     */
    TicketNoteType: "internal" | "public"
    /**
     * TicketPriority
     * @enum {string}
     */
    TicketPriority: "low" | "normal" | "high" | "urgent"
    /** TicketRead */
    TicketRead: {
      /** Company Id */
      company_id: number
      /** Contact Id */
      contact_id: number
      /** Site Id */
      site_id?: number | null
      /** Asset Id */
      asset_id?: number | null
      /** Assigned User Id */
      assigned_user_id?: number | null
      /** Summary */
      summary: string
      /** Description */
      description?: string | null
      /** @default new */
      status: components["schemas"]["TicketStatus"]
      /** @default normal */
      priority: components["schemas"]["TicketPriority"]
      /** @default phone */
      source: components["schemas"]["TicketSource"]
      /** Id */
      id: number
      /**
       * Created At
       * Format: date-time
       */
      created_at: string
      /**
       * Updated At
       * Format: date-time
       */
      updated_at: string
      /** Resolved At */
      resolved_at: string | null
    }
    /**
     * TicketSource
     * @enum {string}
     */
    TicketSource: "phone" | "email" | "portal" | "monitoring" | "other"
    /**
     * TicketStatus
     * @enum {string}
     */
    TicketStatus:
      | "new"
      | "open"
      | "in_progress"
      | "waiting_customer"
      | "resolved"
      | "closed"
    /** TicketUpdate */
    TicketUpdate: {
      /** Company Id */
      company_id?: number | null
      /** Contact Id */
      contact_id?: number | null
      /** Site Id */
      site_id?: number | null
      /** Asset Id */
      asset_id?: number | null
      /** Assigned User Id */
      assigned_user_id?: number | null
      /** Summary */
      summary?: string | null
      /** Description */
      description?: string | null
      status?: components["schemas"]["TicketStatus"] | null
      priority?: components["schemas"]["TicketPriority"] | null
      source?: components["schemas"]["TicketSource"] | null
    }
    /** TimeEntryCreate */
    TimeEntryCreate: {
      /** Ticket Note Id */
      ticket_note_id?: number | null
      /**
       * Started At
       * Format: date-time
       */
      started_at: string
      /** Duration Minutes */
      duration_minutes: number
      /** Description */
      description: string
      /**
       * Billable
       * @default true
       */
      billable: boolean
    }
    /** TimeEntryRead */
    TimeEntryRead: {
      /** Id */
      id: number
      /** Ticket Id */
      ticket_id: number
      /** User Id */
      user_id: number
      /** Ticket Note Id */
      ticket_note_id: number | null
      /**
       * Started At
       * Format: date-time
       */
      started_at: string
      /** Duration Minutes */
      duration_minutes: number
      /** Description */
      description: string
      /** Billable */
      billable: boolean
      /**
       * Created At
       * Format: date-time
       */
      created_at: string
      /**
       * Updated At
       * Format: date-time
       */
      updated_at: string
    }
    /** TimeEntryUpdate */
    TimeEntryUpdate: {
      /** Ticket Note Id */
      ticket_note_id?: number | null
      /** Started At */
      started_at?: string | null
      /** Duration Minutes */
      duration_minutes?: number | null
      /** Description */
      description?: string | null
      /** Billable */
      billable?: boolean | null
    }
    /** TokenResponse */
    TokenResponse: {
      /** Access Token */
      access_token: string
      /**
       * Token Type
       * @default bearer
       */
      token_type: string
    }
    /** ValidationError */
    ValidationError: {
      /** Location */
      loc: (string | number)[]
      /** Message */
      msg: string
      /** Error Type */
      type: string
      /** Input */
      input?: unknown
      /** Context */
      ctx?: Record<string, never>
    }
  }
  responses: never
  parameters: never
  requestBodies: never
  headers: never
  pathItems: never
}
export type $defs = Record<string, never>
export interface operations {
  list_assets_assets_get: {
    parameters: {
      query?: {
        offset?: number
        limit?: number
        company_id?: number | null
        site_id?: number | null
        contact_id?: number | null
        asset_type?: components["schemas"]["AssetType"] | null
        status?: components["schemas"]["AssetStatus"] | null
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["AssetRead"][]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  create_asset_assets_post: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["AssetCreate"]
      }
    }
    responses: {
      /** @description Successful Response */
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["AssetRead"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  get_asset_assets__asset_id__get: {
    parameters: {
      query?: never
      header?: never
      path: {
        asset_id: number
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["AssetRead"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  replace_asset_assets__asset_id__put: {
    parameters: {
      query?: never
      header?: never
      path: {
        asset_id: number
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["AssetCreate"]
      }
    }
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["AssetRead"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  delete_asset_assets__asset_id__delete: {
    parameters: {
      query?: never
      header?: never
      path: {
        asset_id: number
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description Successful Response */
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  update_asset_assets__asset_id__patch: {
    parameters: {
      query?: never
      header?: never
      path: {
        asset_id: number
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["AssetUpdate"]
      }
    }
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["AssetRead"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  login_login_post: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/x-www-form-urlencoded": components["schemas"]["Body_login_login_post"]
      }
    }
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["TokenResponse"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  get_authenticated_user_me_get: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["AuthenticatedUserResponse"]
        }
      }
    }
  }
  list_companies_companies_get: {
    parameters: {
      query?: {
        offset?: number
        limit?: number
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["CompanyRead"][]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  create_company_companies_post: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["CompanyCreate"]
      }
    }
    responses: {
      /** @description Successful Response */
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["CompanyRead"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  get_company_companies__company_id__get: {
    parameters: {
      query?: never
      header?: never
      path: {
        company_id: number
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["CompanyRead"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  replace_company_companies__company_id__put: {
    parameters: {
      query?: never
      header?: never
      path: {
        company_id: number
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["CompanyCreate"]
      }
    }
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["CompanyRead"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  delete_company_companies__company_id__delete: {
    parameters: {
      query?: never
      header?: never
      path: {
        company_id: number
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description Successful Response */
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  update_company_companies__company_id__patch: {
    parameters: {
      query?: never
      header?: never
      path: {
        company_id: number
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["CompanyUpdate"]
      }
    }
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["CompanyRead"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  list_contacts_contacts_get: {
    parameters: {
      query?: {
        offset?: number
        limit?: number
        company_id?: number | null
        site_id?: number | null
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ContactRead"][]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  create_contact_contacts_post: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["ContactCreate"]
      }
    }
    responses: {
      /** @description Successful Response */
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ContactRead"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  get_contact_contacts__contact_id__get: {
    parameters: {
      query?: never
      header?: never
      path: {
        contact_id: number
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ContactRead"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  replace_contact_contacts__contact_id__put: {
    parameters: {
      query?: never
      header?: never
      path: {
        contact_id: number
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["ContactCreate"]
      }
    }
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ContactRead"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  delete_contact_contacts__contact_id__delete: {
    parameters: {
      query?: never
      header?: never
      path: {
        contact_id: number
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description Successful Response */
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  update_contact_contacts__contact_id__patch: {
    parameters: {
      query?: never
      header?: never
      path: {
        contact_id: number
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["ContactUpdate"]
      }
    }
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["ContactRead"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  list_knowledge_articles_knowledge_articles_get: {
    parameters: {
      query?: {
        offset?: number
        limit?: number
        company_id?: number | null
        site_id?: number | null
        contact_id?: number | null
        asset_id?: number | null
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["KnowledgeArticleRead"][]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  create_knowledge_article_knowledge_articles_post: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["KnowledgeArticleCreate"]
      }
    }
    responses: {
      /** @description Successful Response */
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["KnowledgeArticleRead"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  get_knowledge_article_knowledge_articles__knowledge_article_id__get: {
    parameters: {
      query?: never
      header?: never
      path: {
        knowledge_article_id: number
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["KnowledgeArticleRead"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  replace_knowledge_article_knowledge_articles__knowledge_article_id__put: {
    parameters: {
      query?: never
      header?: never
      path: {
        knowledge_article_id: number
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["KnowledgeArticleCreate"]
      }
    }
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["KnowledgeArticleRead"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  delete_knowledge_article_knowledge_articles__knowledge_article_id__delete: {
    parameters: {
      query?: never
      header?: never
      path: {
        knowledge_article_id: number
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description Successful Response */
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  update_knowledge_article_knowledge_articles__knowledge_article_id__patch: {
    parameters: {
      query?: never
      header?: never
      path: {
        knowledge_article_id: number
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["KnowledgeArticleUpdate"]
      }
    }
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["KnowledgeArticleRead"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  list_sites_sites_get: {
    parameters: {
      query?: {
        offset?: number
        limit?: number
        company_id?: number | null
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["SiteRead"][]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  create_site_sites_post: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["SiteCreate"]
      }
    }
    responses: {
      /** @description Successful Response */
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["SiteRead"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  get_site_sites__site_id__get: {
    parameters: {
      query?: never
      header?: never
      path: {
        site_id: number
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["SiteRead"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  replace_site_sites__site_id__put: {
    parameters: {
      query?: never
      header?: never
      path: {
        site_id: number
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["SiteCreate"]
      }
    }
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["SiteRead"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  delete_site_sites__site_id__delete: {
    parameters: {
      query?: never
      header?: never
      path: {
        site_id: number
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description Successful Response */
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  update_site_sites__site_id__patch: {
    parameters: {
      query?: never
      header?: never
      path: {
        site_id: number
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["SiteUpdate"]
      }
    }
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["SiteRead"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  list_ticket_notes_tickets__ticket_id__notes_get: {
    parameters: {
      query?: {
        offset?: number
        limit?: number
        type?: components["schemas"]["TicketNoteType"] | null
        user_id?: number | null
        contact_id?: number | null
      }
      header?: never
      path: {
        ticket_id: number
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["TicketNoteRead"][]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  create_ticket_note_tickets__ticket_id__notes_post: {
    parameters: {
      query?: never
      header?: {
        "Idempotency-Key"?: string | null
      }
      path: {
        ticket_id: number
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["TicketNoteCreate"]
      }
    }
    responses: {
      /** @description Successful Response */
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["TicketNoteRead"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  get_ticket_note_tickets__ticket_id__notes__note_id__get: {
    parameters: {
      query?: never
      header?: never
      path: {
        ticket_id: number
        note_id: number
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["TicketNoteRead"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  list_tickets_tickets_get: {
    parameters: {
      query?: {
        offset?: number
        limit?: number
        company_id?: number | null
        contact_id?: number | null
        site_id?: number | null
        asset_id?: number | null
        assigned_user_id?: number | null
        status?: components["schemas"]["TicketStatus"] | null
        priority?: components["schemas"]["TicketPriority"] | null
        source?: components["schemas"]["TicketSource"] | null
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["TicketRead"][]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  create_ticket_tickets_post: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["TicketCreate"]
      }
    }
    responses: {
      /** @description Successful Response */
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["TicketRead"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  get_ticket_tickets__ticket_id__get: {
    parameters: {
      query?: never
      header?: never
      path: {
        ticket_id: number
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["TicketRead"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  replace_ticket_tickets__ticket_id__put: {
    parameters: {
      query?: never
      header?: never
      path: {
        ticket_id: number
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["TicketCreate"]
      }
    }
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["TicketRead"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  delete_ticket_tickets__ticket_id__delete: {
    parameters: {
      query?: never
      header?: never
      path: {
        ticket_id: number
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description Successful Response */
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  update_ticket_tickets__ticket_id__patch: {
    parameters: {
      query?: never
      header?: never
      path: {
        ticket_id: number
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["TicketUpdate"]
      }
    }
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["TicketRead"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  list_time_entries_tickets__ticket_id__time_entries_get: {
    parameters: {
      query?: {
        offset?: number
        limit?: number
        user_id?: number | null
        ticket_note_id?: number | null
        billable?: boolean | null
        started_at_from?: string | null
        started_at_to?: string | null
      }
      header?: never
      path: {
        ticket_id: number
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["TimeEntryRead"][]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  create_time_entry_tickets__ticket_id__time_entries_post: {
    parameters: {
      query?: never
      header?: {
        "Idempotency-Key"?: string | null
      }
      path: {
        ticket_id: number
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["TimeEntryCreate"]
      }
    }
    responses: {
      /** @description Successful Response */
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["TimeEntryRead"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  get_time_entry_tickets__ticket_id__time_entries__time_entry_id__get: {
    parameters: {
      query?: never
      header?: never
      path: {
        ticket_id: number
        time_entry_id: number
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["TimeEntryRead"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  replace_time_entry_tickets__ticket_id__time_entries__time_entry_id__put: {
    parameters: {
      query?: never
      header?: never
      path: {
        ticket_id: number
        time_entry_id: number
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["TimeEntryCreate"]
      }
    }
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["TimeEntryRead"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  delete_time_entry_tickets__ticket_id__time_entries__time_entry_id__delete: {
    parameters: {
      query?: never
      header?: never
      path: {
        ticket_id: number
        time_entry_id: number
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description Successful Response */
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  update_time_entry_tickets__ticket_id__time_entries__time_entry_id__patch: {
    parameters: {
      query?: never
      header?: never
      path: {
        ticket_id: number
        time_entry_id: number
      }
      cookie?: never
    }
    requestBody: {
      content: {
        "application/json": components["schemas"]["TimeEntryUpdate"]
      }
    }
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["TimeEntryRead"]
        }
      }
      /** @description Validation Error */
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["HTTPValidationError"]
        }
      }
    }
  }
  root__get: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          "application/json": components["schemas"]["RootResponse"]
        }
      }
    }
  }
}
