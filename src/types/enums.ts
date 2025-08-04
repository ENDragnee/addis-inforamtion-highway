export enum SignatureType {
  REQUESTER = "REQUESTER",
  PLATFORM = "PLATFORM",
  PROVIDER = "PROVIDER",
}

export enum DataRequestStatus {
  INITIATED = "INITIATED",
  AWAITING_CONSENT = "AWAITING_CONSENT",
  APPROVED = "APPROVED",
  DENIED = "DENIED",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  EXPIRED = "EXPIRED",
}

export enum RelationshipStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  REJECTED = "REJECTED",
  REVOKED = "REVOKED",
}

export enum SuperUserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
}
