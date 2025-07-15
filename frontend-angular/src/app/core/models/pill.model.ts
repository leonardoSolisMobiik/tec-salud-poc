/**
 * Pill model interfaces for API integration
 *
 * @description Defines data structures for Quick Pills functionality,
 * including create, read, update, and delete operations via REST API.
 */

/**
 * Interface for Pill data structure
 *
 * @interface Pill
 * @description Defines the complete structure for pill items returned from API
 */
export interface Pill {
  /** Unique identifier for the pill */
  id?: string;

  /** Alternative unique identifier (API inconsistency) */
  pill_id?: string;

  /** Initial starter text or template */
  starter: string;

  /** Main text content or question template */
  text: string;

  /** Icon emoji for visual representation */
  icon: string;

  /** Category classification (symptoms, diagnosis, etc.) */
  category: string;

  /** Priority level (0 = highest, higher numbers = lower priority) */
  priority: number;

  /** Active status for the pill */
  is_active?: boolean;

  /** Creation timestamp */
  created_at?: string;

  /** Last update timestamp */
  updated_at?: string;
}

/**
 * Interface for creating a new pill
 *
 * @interface CreatePillRequest
 * @description Structure for API request when creating new pills
 */
export interface CreatePillRequest {
  /** Initial starter text or template */
  starter: string;

  /** Main text content or question template */
  text: string;

  /** Icon emoji for visual representation */
  icon: string;

  /** Category classification */
  category: string;

  /** Priority level (0 = highest priority) */
  priority: number;

  /** Active status for the pill */
  is_active?: boolean;
}

/**
 * Interface for updating an existing pill
 *
 * @interface UpdatePillRequest
 * @description Structure for API request when updating pills
 */
export interface UpdatePillRequest extends Partial<CreatePillRequest> {
  /** Pill ID is required for updates */
  id: string;

  /** Active status for the pill */
  is_active?: boolean;
}

/**
 * Interface for pill API response
 *
 * @interface PillResponse
 * @description Standard API response wrapper for pill operations
 */
export interface PillResponse {
  /** Success status */
  success: boolean;

  /** Response message */
  message: string;

  /** Pill data (for single pill operations) */
  data?: Pill;

  /** Multiple pills data (for list operations) */
  pills?: Pill[];

  /** Error details if applicable */
  error?: string;
}

/**
 * Interface for pills list API response
 *
 * @interface PillsListResponse
 * @description Response structure for getting list of pills
 */
export interface PillsListResponse {
  /** Array of pills */
  pills: Pill[];

  /** Total count of pills */
  total: number;

  /** Current page (if paginated) */
  page?: number;

  /** Items per page (if paginated) */
  per_page?: number;
}
