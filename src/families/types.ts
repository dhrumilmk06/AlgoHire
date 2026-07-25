/**
 * Minimal Step type for the new family-based architecture.
 * This is distinct from the legacy Algorithm Step type.
 */
export interface Step {
    kind: string;
    payload?: unknown;
}
