// Canonical departments list provided earlier by the user
// Use this list for creating/editing users and for filters where appropriate
export const DEPARTMENTS = [
  'Accounting & Advisory',
  'Audit & Assurance',
  'Client Relationship',
  'Finance',
  'Human Resources',
  'Tax',
  'Technology',
  'Admin',
  'IT'
];

// Optional: include legacy/alternate labels used historically in filters
export const DEPARTMENT_FILTERS = [
  ...DEPARTMENTS,
  // legacy/common shortcuts to support searches on existing data
  'HR',
  'Operations',
  'Sales',
  'Marketing'
];

export default DEPARTMENTS;
