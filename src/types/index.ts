// Mirrors the backend DTOs exactly (com.seth.routebook.dto.*) - flat,
// with foreign keys as plain IDs rather than nested objects, matching
// the backend's flat-DTO design decision.

export type KnowledgeCategory =
  | 'ACCESS'
  | 'GATE_CODE'
  | 'PARKING'
  | 'HAZARD'
  | 'CONTACT'
  | 'OTHER';

export interface DriverDto {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

export interface RouteDto {
  id: number;
  name: string;
  description: string | null;
  driverId: number | null;
}

export interface StopDto {
  id: number;
  customerName: string;
  sequenceOrder: number;
  routeId: number;
  locationId: number;
}

export interface KnowledgeEntryDto {
  id: number;
  title: string;
  body: string;
  category: KnowledgeCategory;
  routeId: number | null;
  stopId: number | null;
}

export interface AttachmentDto {
  id: number;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  knowledgeEntryId: number;
  uploadedAt: string;
  downloadUrl: string;
}

// Mirrors GlobalExceptionHandler's ErrorResponse shape exactly.
export interface ErrorResponse {
  status: number;
  message: string;
  timestamp: string;
  fieldErrors: Record<string, string> | null;
}
