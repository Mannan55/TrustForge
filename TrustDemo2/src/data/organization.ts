import type { Organization, User } from "@/types";

// The canonical demo tenant. Every default value flows from here so the
// TechNova persona is never duplicated as inline string literals across pages.
export const DEMO_ORG: Organization = {
  id: "org_technova",
  legalName: "TechNova Solutions Pvt Ltd",
  displayName: "TechNova Solutions",
  cin: "U72900KA2021PTC145123",
  gstin: "29AABCT3549R1ZM",
  industry: "Enterprise Software & SaaS",
  companySize: "51-200 employees",
  primaryDomain: "technova.in",
  appDomain: "app.technova.in",
  grievanceOfficer: "Rajesh V. Sharma",
  grievanceEmail: "grievance@technova.in",
  registeredAddress:
    "Block B, Embassy TechVillage, Outer Ring Road, Devarabeesanahalli, Bengaluru, Karnataka 560103",
  dataRegion: "AWS Asia Pacific (Mumbai) ap-south-1",
  trustScore: 89,
  posture: "Strong Alignment",
  gstinVerified: true,
  domainVerified: true,
  authorizationVerified: true,
  lastAssessed: "4 September 2026",
};

export const DEMO_USER: User = {
  id: "usr_rajesh",
  name: "Rajesh Sharma",
  email: "rajesh@technova.in",
  role: "Owner",
  title: "CTO & Data Protection Officer",
  organizationId: DEMO_ORG.id,
  accountMode: "organization",
  avatarInitials: "RS",
};

export const DEMO_PERSONAL_USER: User = {
  id: "usr_personal",
  name: "Aditi Menon",
  email: "aditi.menon@gmail.com",
  role: "Member",
  accountMode: "personal",
  avatarInitials: "AM",
};

export const ADMIN_USER: User = {
  id: "usr_admin",
  name: "Platform Operations",
  email: "admin@trustforge.in",
  role: "Super Admin",
  accountMode: "organization",
  avatarInitials: "TF",
};
