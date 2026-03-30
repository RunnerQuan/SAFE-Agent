import { loadConfig, requireConfig, type SendGridConfig } from "./config.ts";

const BASE_URL = "https://api.sendgrid.com";

export interface ApiError {
  message: string;
  field?: string;
  help?: string;
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  errors?: ApiError[];
  status: number;
}

export class SendGridClient {
  private config: SendGridConfig;
  private apiKey: string;

  private constructor(config: SendGridConfig) {
    this.config = config;
    this.apiKey = requireConfig(config, "apiKey");
  }

  static async create(): Promise<SendGridClient> {
    const config = await loadConfig();
    return new SendGridClient(config);
  }

  static async createWithConfig(config: SendGridConfig): Promise<SendGridClient> {
    return new SendGridClient(config);
  }

  getConfig(): SendGridConfig {
    return this.config;
  }

  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
    body?: unknown,
    queryParams?: Record<string, string | number | boolean | undefined>
  ): Promise<ApiResponse<T>> {
    let url = `${BASE_URL}${endpoint}`;

    if (queryParams) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(queryParams)) {
        if (value !== undefined) {
          params.set(key, String(value));
        }
      }
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const headers: Record<string, string> = {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "sendgrid-cli/0.1.0",
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === "POST" || method === "PATCH" || method === "PUT")) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      const text = await response.text();

      let data: T | undefined;
      let errors: ApiError[] | undefined;

      if (text) {
        try {
          const json = JSON.parse(text);
          if (response.ok) {
            data = json as T;
          } else {
            errors = json.errors || [{ message: json.message || text }];
          }
        } catch {
          if (!response.ok) {
            errors = [{ message: text || response.statusText }];
          }
        }
      }

      return {
        ok: response.ok,
        data,
        errors,
        status: response.status,
      };
    } catch (err) {
      return {
        ok: false,
        errors: [{
          message: err instanceof Error ? err.message : String(err),
        }],
        status: 0,
      };
    }
  }

  async get<T>(endpoint: string, queryParams?: Record<string, string | number | undefined>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "GET", undefined, queryParams);
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "POST", body);
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "PATCH", body);
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "PUT", body);
  }

  async delete<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, "DELETE", body);
  }

  // ============ User / Auth ============

  async verifyAuth(): Promise<ApiResponse<{ email: string; username: string }>> {
    return this.get("/v3/user/profile");
  }

  // ============ Mail Send ============

  async sendMail(mail: MailSendRequest): Promise<ApiResponse<void>> {
    return this.post("/v3/mail/send", mail);
  }

  // ============ Templates ============

  async listTemplates(params?: { generations?: "legacy" | "dynamic"; page_size?: number }): Promise<ApiResponse<{ templates: Template[]; result: Template[] }>> {
    return this.get("/v3/templates", params);
  }

  async getTemplate(templateId: string): Promise<ApiResponse<Template>> {
    return this.get(`/v3/templates/${templateId}`);
  }

  async createTemplate(input: { name: string; generation?: "legacy" | "dynamic" }): Promise<ApiResponse<Template>> {
    return this.post("/v3/templates", input);
  }

  async updateTemplate(templateId: string, input: { name: string }): Promise<ApiResponse<Template>> {
    return this.patch(`/v3/templates/${templateId}`, input);
  }

  async deleteTemplate(templateId: string): Promise<ApiResponse<void>> {
    return this.delete(`/v3/templates/${templateId}`);
  }

  async createTemplateVersion(
    templateId: string,
    input: TemplateVersionInput
  ): Promise<ApiResponse<TemplateVersion>> {
    return this.post(`/v3/templates/${templateId}/versions`, input);
  }

  async updateTemplateVersion(
    templateId: string,
    versionId: string,
    input: Partial<TemplateVersionInput>
  ): Promise<ApiResponse<TemplateVersion>> {
    return this.patch(`/v3/templates/${templateId}/versions/${versionId}`, input);
  }

  async deleteTemplateVersion(templateId: string, versionId: string): Promise<ApiResponse<void>> {
    return this.delete(`/v3/templates/${templateId}/versions/${versionId}`);
  }

  async activateTemplateVersion(templateId: string, versionId: string): Promise<ApiResponse<TemplateVersion>> {
    return this.post(`/v3/templates/${templateId}/versions/${versionId}/activate`);
  }

  // ============ Contacts ============

  async addContacts(contacts: ContactInput[], listIds?: string[]): Promise<ApiResponse<{ job_id: string }>> {
    const body: { contacts: ContactInput[]; list_ids?: string[] } = { contacts };
    if (listIds?.length) {
      body.list_ids = listIds;
    }
    return this.put("/v3/marketing/contacts", body);
  }

  async searchContacts(query: string): Promise<ApiResponse<{ result: Contact[]; contact_count: number }>> {
    return this.post("/v3/marketing/contacts/search", { query });
  }

  async getContact(contactId: string): Promise<ApiResponse<Contact>> {
    return this.get(`/v3/marketing/contacts/${contactId}`);
  }

  async getContactByEmail(email: string): Promise<ApiResponse<{ result: Record<string, Contact> }>> {
    return this.post("/v3/marketing/contacts/search/emails", { emails: [email] });
  }

  async deleteContacts(ids?: string[], deleteAllContacts?: boolean): Promise<ApiResponse<{ job_id: string }>> {
    const params: Record<string, string | undefined> = {};
    if (deleteAllContacts) {
      params.delete_all_contacts = "true";
    } else if (ids?.length) {
      params.ids = ids.join(",");
    }
    return this.delete("/v3/marketing/contacts", params);
  }

  async getContactCount(): Promise<ApiResponse<{ contact_count: number; billable_count: number }>> {
    return this.get("/v3/marketing/contacts/count");
  }

  async exportContacts(listIds?: string[], segmentIds?: string[]): Promise<ApiResponse<{ id: string }>> {
    const body: { list_ids?: string[]; segment_ids?: string[] } = {};
    if (listIds?.length) body.list_ids = listIds;
    if (segmentIds?.length) body.segment_ids = segmentIds;
    return this.post("/v3/marketing/contacts/exports", body);
  }

  async getExportStatus(exportId: string): Promise<ApiResponse<ContactExport>> {
    return this.get(`/v3/marketing/contacts/exports/${exportId}`);
  }

  async importContacts(fileType: "csv" | "json", fieldMappings: FieldMapping[]): Promise<ApiResponse<{ job_id: string; upload_uri: string }>> {
    return this.put("/v3/marketing/contacts/imports", { file_type: fileType, field_mappings: fieldMappings });
  }

  // ============ Lists ============

  async listLists(params?: { page_size?: number; page_token?: string }): Promise<ApiResponse<{ result: ContactList[]; _metadata: { count: number } }>> {
    return this.get("/v3/marketing/lists", params);
  }

  async getList(listId: string, params?: { contact_sample?: boolean }): Promise<ApiResponse<ContactList>> {
    const queryParams = params?.contact_sample !== undefined 
      ? { contact_sample: String(params.contact_sample) } 
      : undefined;
    return this.get(`/v3/marketing/lists/${listId}`, queryParams);
  }

  async createList(name: string): Promise<ApiResponse<ContactList>> {
    return this.post("/v3/marketing/lists", { name });
  }

  async updateList(listId: string, name: string): Promise<ApiResponse<ContactList>> {
    return this.patch(`/v3/marketing/lists/${listId}`, { name });
  }

  async deleteList(listId: string, deleteContacts?: boolean): Promise<ApiResponse<void>> {
    return this.delete(`/v3/marketing/lists/${listId}`, { delete_contacts: deleteContacts });
  }

  async getListContactCount(listId: string): Promise<ApiResponse<{ contact_count: number; billable_count: number }>> {
    return this.get(`/v3/marketing/lists/${listId}/contacts/count`);
  }

  async removeContactsFromList(listId: string, contactIds: string[]): Promise<ApiResponse<{ job_id: string }>> {
    return this.delete(`/v3/marketing/lists/${listId}/contacts`, { contact_ids: contactIds.join(",") });
  }

  // ============ Segments ============

  async listSegments(): Promise<ApiResponse<{ results: Segment[] }>> {
    return this.get("/v3/marketing/segments/2.0");
  }

  async getSegment(segmentId: string): Promise<ApiResponse<Segment>> {
    return this.get(`/v3/marketing/segments/2.0/${segmentId}`);
  }

  async createSegment(input: SegmentInput): Promise<ApiResponse<Segment>> {
    return this.post("/v3/marketing/segments/2.0", input);
  }

  async updateSegment(segmentId: string, input: Partial<SegmentInput>): Promise<ApiResponse<Segment>> {
    return this.patch(`/v3/marketing/segments/2.0/${segmentId}`, input);
  }

  async deleteSegment(segmentId: string): Promise<ApiResponse<void>> {
    return this.delete(`/v3/marketing/segments/2.0/${segmentId}`);
  }

  // ============ Suppressions ============

  async listBounces(params?: SuppressionParams): Promise<ApiResponse<Bounce[]>> {
    return this.get("/v3/suppression/bounces", params);
  }

  async deleteBounce(email: string): Promise<ApiResponse<void>> {
    return this.delete(`/v3/suppression/bounces/${email}`);
  }

  async deleteAllBounces(): Promise<ApiResponse<void>> {
    return this.delete("/v3/suppression/bounces", { delete_all: true });
  }

  async listBlocks(params?: SuppressionParams): Promise<ApiResponse<Block[]>> {
    return this.get("/v3/suppression/blocks", params);
  }

  async deleteBlock(email: string): Promise<ApiResponse<void>> {
    return this.delete(`/v3/suppression/blocks/${email}`);
  }

  async listSpamReports(params?: SuppressionParams): Promise<ApiResponse<SpamReport[]>> {
    return this.get("/v3/suppression/spam_reports", params);
  }

  async deleteSpamReport(email: string): Promise<ApiResponse<void>> {
    return this.delete(`/v3/suppression/spam_reports/${email}`);
  }

  async listUnsubscribes(params?: SuppressionParams): Promise<ApiResponse<Unsubscribe[]>> {
    return this.get("/v3/suppression/unsubscribes", params);
  }

  async listInvalidEmails(params?: SuppressionParams): Promise<ApiResponse<InvalidEmail[]>> {
    return this.get("/v3/suppression/invalid_emails", params);
  }

  async deleteInvalidEmail(email: string): Promise<ApiResponse<void>> {
    return this.delete(`/v3/suppression/invalid_emails/${email}`);
  }

  async addToGlobalUnsubscribe(emails: string[]): Promise<ApiResponse<void>> {
    return this.post("/v3/asm/suppressions/global", { recipient_emails: emails });
  }

  async listSuppressionGroups(): Promise<ApiResponse<SuppressionGroup[]>> {
    return this.get("/v3/asm/groups");
  }

  // ============ Stats ============

  async getGlobalStats(params: StatsParams): Promise<ApiResponse<Stat[]>> {
    return this.get("/v3/stats", params);
  }

  async getCategoryStats(params: StatsParams & { categories: string }): Promise<ApiResponse<Stat[]>> {
    return this.get("/v3/categories/stats", params);
  }

  async getMailboxProviderStats(params: StatsParams): Promise<ApiResponse<Stat[]>> {
    return this.get("/v3/mailbox_providers/stats", params);
  }

  async getBrowserStats(params: StatsParams): Promise<ApiResponse<Stat[]>> {
    return this.get("/v3/browsers/stats", params);
  }

  async getDeviceStats(params: StatsParams): Promise<ApiResponse<Stat[]>> {
    return this.get("/v3/devices/stats", params);
  }

  async getGeoStats(params: StatsParams): Promise<ApiResponse<Stat[]>> {
    return this.get("/v3/geo/stats", params);
  }

  // ============ Senders ============

  async listSenders(): Promise<ApiResponse<{ results: Sender[] }>> {
    return this.get("/v3/marketing/senders");
  }

  async getSender(senderId: number): Promise<ApiResponse<Sender>> {
    return this.get(`/v3/marketing/senders/${senderId}`);
  }

  async createSender(input: SenderInput): Promise<ApiResponse<Sender>> {
    return this.post("/v3/marketing/senders", input);
  }

  async updateSender(senderId: number, input: Partial<SenderInput>): Promise<ApiResponse<Sender>> {
    return this.patch(`/v3/marketing/senders/${senderId}`, input);
  }

  async deleteSender(senderId: number): Promise<ApiResponse<void>> {
    return this.delete(`/v3/marketing/senders/${senderId}`);
  }

  async resendSenderVerification(senderId: number): Promise<ApiResponse<void>> {
    return this.post(`/v3/marketing/senders/${senderId}/resend_verification`);
  }

  // ============ Verified Senders (Sender Verification) ============

  async listVerifiedSenders(): Promise<ApiResponse<{ results: VerifiedSender[] }>> {
    return this.get("/v3/verified_senders");
  }

  async createVerifiedSender(input: VerifiedSenderInput): Promise<ApiResponse<VerifiedSender>> {
    return this.post("/v3/verified_senders", input);
  }

  async updateVerifiedSender(senderId: number, input: Partial<VerifiedSenderInput>): Promise<ApiResponse<VerifiedSender>> {
    return this.patch(`/v3/verified_senders/${senderId}`, input);
  }

  async deleteVerifiedSender(senderId: number): Promise<ApiResponse<void>> {
    return this.delete(`/v3/verified_senders/${senderId}`);
  }

  async resendVerifiedSenderVerification(senderId: number): Promise<ApiResponse<void>> {
    return this.post(`/v3/verified_senders/resend/${senderId}`);
  }

  // ============ Domain Authentication ============

  async listAuthenticatedDomains(): Promise<ApiResponse<DomainAuthentication[]>> {
    return this.get("/v3/whitelabel/domains");
  }

  async getAuthenticatedDomain(domainId: number): Promise<ApiResponse<DomainAuthentication>> {
    return this.get(`/v3/whitelabel/domains/${domainId}`);
  }

  async authenticateDomain(input: DomainAuthInput): Promise<ApiResponse<DomainAuthentication>> {
    return this.post("/v3/whitelabel/domains", input);
  }

  async validateDomain(domainId: number): Promise<ApiResponse<DomainValidation>> {
    return this.post(`/v3/whitelabel/domains/${domainId}/validate`);
  }

  async deleteDomain(domainId: number): Promise<ApiResponse<void>> {
    return this.delete(`/v3/whitelabel/domains/${domainId}`);
  }

  // ============ Link Branding ============

  async listBrandedLinks(): Promise<ApiResponse<BrandedLink[]>> {
    return this.get("/v3/whitelabel/links");
  }

  async createBrandedLink(input: { domain: string; subdomain?: string; default?: boolean }): Promise<ApiResponse<BrandedLink>> {
    return this.post("/v3/whitelabel/links", input);
  }

  async validateBrandedLink(linkId: number): Promise<ApiResponse<{ valid: boolean }>> {
    return this.post(`/v3/whitelabel/links/${linkId}/validate`);
  }

  async deleteBrandedLink(linkId: number): Promise<ApiResponse<void>> {
    return this.delete(`/v3/whitelabel/links/${linkId}`);
  }

  // ============ Webhooks ============

  async listWebhooks(): Promise<ApiResponse<{ webhooks: Webhook[]; max_allowed: number }>> {
    return this.get("/v3/user/webhooks/event/settings/all");
  }

  async getWebhook(webhookId: string): Promise<ApiResponse<Webhook>> {
    return this.get(`/v3/user/webhooks/event/settings/${webhookId}`);
  }

  async createWebhook(input: WebhookInput): Promise<ApiResponse<Webhook>> {
    return this.post("/v3/user/webhooks/event/settings", input);
  }

  async updateWebhook(webhookId: string, input: Partial<WebhookInput>): Promise<ApiResponse<Webhook>> {
    return this.patch(`/v3/user/webhooks/event/settings/${webhookId}`, input);
  }

  async deleteWebhook(webhookId: string): Promise<ApiResponse<void>> {
    return this.delete(`/v3/user/webhooks/event/settings/${webhookId}`);
  }

  async testWebhook(webhookId: string): Promise<ApiResponse<void>> {
    return this.post(`/v3/user/webhooks/event/test`, { id: webhookId });
  }

  async getWebhookSigningKey(webhookId: string): Promise<ApiResponse<{ public_key: string }>> {
    return this.get(`/v3/user/webhooks/event/settings/${webhookId}/signed`);
  }

  // ============ API Keys ============

  async listApiKeys(): Promise<ApiResponse<{ result: ApiKey[] }>> {
    return this.get("/v3/api_keys");
  }

  async getApiKey(apiKeyId: string): Promise<ApiResponse<ApiKey>> {
    return this.get(`/v3/api_keys/${apiKeyId}`);
  }

  async createApiKey(input: ApiKeyInput): Promise<ApiResponse<ApiKeyCreated>> {
    return this.post("/v3/api_keys", input);
  }

  async updateApiKeyName(apiKeyId: string, name: string): Promise<ApiResponse<ApiKey>> {
    return this.patch(`/v3/api_keys/${apiKeyId}`, { name });
  }

  async updateApiKey(apiKeyId: string, input: ApiKeyInput): Promise<ApiResponse<ApiKey>> {
    return this.put(`/v3/api_keys/${apiKeyId}`, input);
  }

  async deleteApiKey(apiKeyId: string): Promise<ApiResponse<void>> {
    return this.delete(`/v3/api_keys/${apiKeyId}`);
  }

  async listScopes(): Promise<ApiResponse<{ scopes: string[] }>> {
    return this.get("/v3/scopes");
  }

  // ============ Email Validation ============

  async validateEmail(email: string, source?: string): Promise<ApiResponse<EmailValidation>> {
    return this.post("/v3/validations/email", { email, source });
  }

  // ============ Subusers ============

  async listSubusers(params?: { username?: string; limit?: number; offset?: number }): Promise<ApiResponse<Subuser[]>> {
    return this.get("/v3/subusers", params);
  }

  async createSubuser(input: SubuserInput): Promise<ApiResponse<Subuser>> {
    return this.post("/v3/subusers", input);
  }

  async deleteSubuser(username: string): Promise<ApiResponse<void>> {
    return this.delete(`/v3/subusers/${username}`);
  }

  async enableSubuser(username: string): Promise<ApiResponse<void>> {
    return this.patch(`/v3/subusers/${username}`, { disabled: false });
  }

  async disableSubuser(username: string): Promise<ApiResponse<void>> {
    return this.patch(`/v3/subusers/${username}`, { disabled: true });
  }

  // ============ Single Sends (Marketing) ============

  async listSingleSends(params?: { page_size?: number; page_token?: string }): Promise<ApiResponse<{ result: SingleSend[] }>> {
    return this.get("/v3/marketing/singlesends", params);
  }

  async getSingleSend(singleSendId: string): Promise<ApiResponse<SingleSend>> {
    return this.get(`/v3/marketing/singlesends/${singleSendId}`);
  }

  async createSingleSend(input: SingleSendInput): Promise<ApiResponse<SingleSend>> {
    return this.post("/v3/marketing/singlesends", input);
  }

  async updateSingleSend(singleSendId: string, input: Partial<SingleSendInput>): Promise<ApiResponse<SingleSend>> {
    return this.patch(`/v3/marketing/singlesends/${singleSendId}`, input);
  }

  async deleteSingleSend(singleSendId: string): Promise<ApiResponse<void>> {
    return this.delete(`/v3/marketing/singlesends/${singleSendId}`);
  }

  async scheduleSingleSend(singleSendId: string, sendAt?: string): Promise<ApiResponse<SingleSend>> {
    const body = sendAt ? { send_at: sendAt } : { send_at: "now" };
    return this.put(`/v3/marketing/singlesends/${singleSendId}/schedule`, body);
  }

  // ============ Batch IDs for Scheduled Sends ============

  async createBatchId(): Promise<ApiResponse<{ batch_id: string }>> {
    return this.post("/v3/mail/batch");
  }

  async validateBatchId(batchId: string): Promise<ApiResponse<{ batch_id: string }>> {
    return this.get(`/v3/mail/batch/${batchId}`);
  }

  async cancelScheduledSend(batchId: string): Promise<ApiResponse<void>> {
    return this.post("/v3/user/scheduled_sends", { batch_id: batchId, status: "cancel" });
  }

  async pauseScheduledSend(batchId: string): Promise<ApiResponse<void>> {
    return this.post("/v3/user/scheduled_sends", { batch_id: batchId, status: "pause" });
  }
}

// ============ Type Definitions ============

export interface MailSendRequest {
  personalizations: Personalization[];
  from: EmailAddress;
  reply_to?: EmailAddress;
  reply_to_list?: EmailAddress[];
  subject?: string;
  content?: Content[];
  attachments?: Attachment[];
  template_id?: string;
  headers?: Record<string, string>;
  categories?: string[];
  custom_args?: Record<string, string>;
  send_at?: number;
  batch_id?: string;
  asm?: AsmSettings;
  ip_pool_name?: string;
  mail_settings?: MailSettings;
  tracking_settings?: TrackingSettings;
}

export interface Personalization {
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  from?: EmailAddress;
  subject?: string;
  headers?: Record<string, string>;
  substitutions?: Record<string, string>;
  dynamic_template_data?: Record<string, unknown>;
  custom_args?: Record<string, string>;
  send_at?: number;
}

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface Content {
  type: string;
  value: string;
}

export interface Attachment {
  content: string;
  type?: string;
  filename: string;
  disposition?: "attachment" | "inline";
  content_id?: string;
}

export interface AsmSettings {
  group_id: number;
  groups_to_display?: number[];
}

export interface MailSettings {
  bypass_list_management?: { enable?: boolean };
  bypass_spam_management?: { enable?: boolean };
  bypass_bounce_management?: { enable?: boolean };
  bypass_unsubscribe_management?: { enable?: boolean };
  footer?: { enable?: boolean; text?: string; html?: string };
  sandbox_mode?: { enable?: boolean };
}

export interface TrackingSettings {
  click_tracking?: { enable?: boolean; enable_text?: boolean };
  open_tracking?: { enable?: boolean; substitution_tag?: string };
  subscription_tracking?: { enable?: boolean; text?: string; html?: string; substitution_tag?: string };
  ganalytics?: {
    enable?: boolean;
    utm_source?: string;
    utm_medium?: string;
    utm_term?: string;
    utm_content?: string;
    utm_campaign?: string;
  };
}

export interface Template {
  id: string;
  name: string;
  generation: "legacy" | "dynamic";
  updated_at: string;
  versions?: TemplateVersion[];
}

export interface TemplateVersion {
  id: string;
  template_id: string;
  name: string;
  subject?: string;
  html_content?: string;
  plain_content?: string;
  active: number;
  editor?: "code" | "design";
  generate_plain_content?: boolean;
  updated_at: string;
}

export interface TemplateVersionInput {
  name: string;
  subject?: string;
  html_content?: string;
  plain_content?: string;
  active?: number;
  editor?: "code" | "design";
  generate_plain_content?: boolean;
  test_data?: string;
}

export interface Contact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  alternate_emails?: string[];
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state_province_region?: string;
  postal_code?: string;
  country?: string;
  phone_number?: string;
  whatsapp?: string;
  line?: string;
  facebook?: string;
  unique_name?: string;
  custom_fields?: Record<string, string>;
  list_ids?: string[];
  segment_ids?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ContactInput {
  email: string;
  first_name?: string;
  last_name?: string;
  alternate_emails?: string[];
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state_province_region?: string;
  postal_code?: string;
  country?: string;
  phone_number?: string;
  whatsapp?: string;
  line?: string;
  facebook?: string;
  unique_name?: string;
  custom_fields?: Record<string, string>;
}

export interface ContactExport {
  id: string;
  status: "pending" | "ready" | "failure";
  urls?: string[];
  message?: string;
  created_at: string;
  completed_at?: string;
  expires_at?: string;
  contact_count?: number;
}

export interface FieldMapping {
  field_name: string;
  column_name: string;
}

export interface ContactList {
  id: string;
  name: string;
  contact_count: number;
  _metadata?: {
    self: string;
  };
}

export interface Segment {
  id: string;
  name: string;
  contacts_count: number;
  query_dsl: string;
  parent_list_ids?: string[];
  sample_updated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SegmentInput {
  name: string;
  query_dsl: string;
  parent_list_ids?: string[];
}

export interface SuppressionParams {
  start_time?: number;
  end_time?: number;
  limit?: number;
  offset?: number;
  email?: string;
  [key: string]: string | number | undefined;
}

export interface Bounce {
  email: string;
  created: number;
  reason: string;
  status: string;
}

export interface Block {
  email: string;
  created: number;
  reason: string;
  status: string;
}

export interface SpamReport {
  email: string;
  created: number;
  ip?: string;
}

export interface Unsubscribe {
  email: string;
  created: number;
}

export interface InvalidEmail {
  email: string;
  created: number;
  reason: string;
}

export interface SuppressionGroup {
  id: number;
  name: string;
  description: string;
  is_default: boolean;
  last_email_sent_at?: string;
  unsubscribes?: number;
}

export interface StatsParams {
  start_date: string;
  end_date?: string;
  aggregated_by?: "day" | "week" | "month";
  [key: string]: string | undefined;
}

export interface Stat {
  date: string;
  stats: {
    metrics: {
      blocks?: number;
      bounce_drops?: number;
      bounces?: number;
      clicks?: number;
      deferred?: number;
      delivered?: number;
      invalid_emails?: number;
      opens?: number;
      processed?: number;
      requests?: number;
      spam_report_drops?: number;
      spam_reports?: number;
      unique_clicks?: number;
      unique_opens?: number;
      unsubscribe_drops?: number;
      unsubscribes?: number;
    };
    name?: string;
    type?: string;
  }[];
}

export interface Sender {
  id: number;
  nickname: string;
  from: { email: string; name: string };
  reply_to: { email: string; name?: string };
  address: string;
  address_2?: string;
  city: string;
  state?: string;
  zip?: string;
  country: string;
  verified: { status: boolean; reason?: string };
  locked: boolean;
  created_at: number;
  updated_at: number;
}

export interface SenderInput {
  nickname: string;
  from: { email: string; name: string };
  reply_to: { email: string; name?: string };
  address: string;
  address_2?: string;
  city: string;
  state?: string;
  zip?: string;
  country: string;
}

export interface VerifiedSender {
  id: number;
  nickname: string;
  from_email: string;
  from_name?: string;
  reply_to: string;
  reply_to_name?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  verified: boolean;
  locked: boolean;
}

export interface VerifiedSenderInput {
  nickname: string;
  from_email: string;
  from_name?: string;
  reply_to: string;
  reply_to_name?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface DomainAuthentication {
  id: number;
  domain: string;
  subdomain?: string;
  username: string;
  user_id: number;
  ips: string[];
  custom_spf: boolean;
  default: boolean;
  legacy: boolean;
  automatic_security: boolean;
  valid: boolean;
  dns: {
    mail_cname?: DnsRecord;
    dkim1?: DnsRecord;
    dkim2?: DnsRecord;
    mail_server?: DnsRecord;
    subdomain_spf?: DnsRecord;
  };
}

export interface DnsRecord {
  host: string;
  type: string;
  data: string;
  valid: boolean;
}

export interface DomainAuthInput {
  domain: string;
  subdomain?: string;
  username?: string;
  ips?: string[];
  custom_spf?: boolean;
  default?: boolean;
  automatic_security?: boolean;
}

export interface DomainValidation {
  id: number;
  valid: boolean;
  validation_results: {
    mail_cname?: { valid: boolean; reason?: string };
    dkim1?: { valid: boolean; reason?: string };
    dkim2?: { valid: boolean; reason?: string };
  };
}

export interface BrandedLink {
  id: number;
  domain: string;
  subdomain: string;
  username: string;
  user_id: number;
  default: boolean;
  valid: boolean;
  legacy: boolean;
  dns: {
    domain_cname: DnsRecord;
    owner_cname: DnsRecord;
  };
}

export interface Webhook {
  id: string;
  enabled: boolean;
  url: string;
  group_resubscribe: boolean;
  delivered: boolean;
  group_unsubscribe: boolean;
  spam_report: boolean;
  bounce: boolean;
  deferred: boolean;
  unsubscribe: boolean;
  processed: boolean;
  open: boolean;
  click: boolean;
  dropped: boolean;
  oauth_client_id?: string;
  oauth_token_url?: string;
  friendly_name?: string;
}

export interface WebhookInput {
  enabled: boolean;
  url: string;
  group_resubscribe?: boolean;
  delivered?: boolean;
  group_unsubscribe?: boolean;
  spam_report?: boolean;
  bounce?: boolean;
  deferred?: boolean;
  unsubscribe?: boolean;
  processed?: boolean;
  open?: boolean;
  click?: boolean;
  dropped?: boolean;
  friendly_name?: string;
  oauth_client_id?: string;
  oauth_client_secret?: string;
  oauth_token_url?: string;
}

export interface ApiKey {
  api_key_id: string;
  name: string;
  scopes?: string[];
}

export interface ApiKeyCreated extends ApiKey {
  api_key: string;
}

export interface ApiKeyInput {
  name: string;
  scopes?: string[];
}

export interface EmailValidation {
  email: string;
  verdict: "Valid" | "Risky" | "Invalid";
  score: number;
  local: string;
  host: string;
  suggestion?: string;
  checks: {
    domain: { has_valid_address_syntax: boolean; has_mx_or_a_record: boolean; is_suspected_disposable_address: boolean };
    local_part: { is_suspected_role_address: boolean };
    additional: { has_known_bounces: boolean; has_suspected_bounces: boolean };
  };
  source?: string;
  ip_address?: string;
}

export interface Subuser {
  id: number;
  username: string;
  email: string;
  disabled: boolean;
}

export interface SubuserInput {
  username: string;
  email: string;
  password: string;
  ips: string[];
}

export interface SingleSend {
  id: string;
  name: string;
  status: "draft" | "scheduled" | "triggered";
  categories?: string[];
  send_at?: string;
  send_to?: { list_ids?: string[]; segment_ids?: string[]; all?: boolean };
  email_config?: {
    subject?: string;
    html_content?: string;
    plain_content?: string;
    generate_plain_content?: boolean;
    design_id?: string;
    editor?: string;
    suppression_group_id?: number;
    custom_unsubscribe_url?: string;
    sender_id?: number;
    ip_pool?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface SingleSendInput {
  name: string;
  categories?: string[];
  send_at?: string;
  send_to?: { list_ids?: string[]; segment_ids?: string[]; all?: boolean };
  email_config?: {
    subject?: string;
    html_content?: string;
    plain_content?: string;
    generate_plain_content?: boolean;
    design_id?: string;
    editor?: string;
    suppression_group_id?: number;
    custom_unsubscribe_url?: string;
    sender_id?: number;
    ip_pool?: string;
  };
}
