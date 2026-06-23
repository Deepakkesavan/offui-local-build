export const BASE_URL = 'http://localhost:5206';

export const API_ENDPOINTS = {
  emsData:           `${BASE_URL}/api/EmsData`,
  submit:            `${BASE_URL}/api/submission/submit`,
  getSubmit:         `${BASE_URL}/api/submission/getsubmit`,
  managerInfo:       `${BASE_URL}/api/managerinfo`,
  approveOffboarding:`${BASE_URL}/api/ApproveOffboarding`,
  getApproval:       (logId: string) => `${BASE_URL}/api/GetApproveOffboarding/${logId}`,

  // ── HR Dashboard ──────────────────────────────────────────────
  allSubmissionLogs: `${BASE_URL}/api/submission/all`,
  allManagerApprovals: `${BASE_URL}/api/ApproveOffboarding/all`,

  // ── HR Employee Details ──────────────────────────────────────
  hrInitiation:      `${BASE_URL}/api/HRInitiation`,
  getHrInitiation:   (logId: string) => `${BASE_URL}/api/GetHRInitiation/${logId}`,

  // ── IT Department ─────────────────────────────────────────────
  itClearance:       `${BASE_URL}/api/ItDepartment`,
  getItClearance:    (logId: string) => `${BASE_URL}/api/GetItClearance/${logId}`,
} as const;

/**
 * JWT tokens keyed by role.
 * In production these should come from your auth service, not be hard-coded.
 */
export const JWT_TOKENS = {
  employee: 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJqb3lpbmZhbnRhakBjbGFyaXVtLnRlY2giLCJlbXBJZCI6MTE3MywiZGVzaWduYXRpb24iOiJKdW5pb3IgU29mdHdhcmUgRW5naW5lZXIiLCJpYXQiOjE3ODE1MDkxMzMsImV4cCI6MTk4MTUxMjczM30.bWR-q9kGCWqidjnwbDsbxUQ3GJempRfSstUv1IK9fTalKgnV4BCEoPN_mtBH9K5-54uDRA74c5bAQRwwopnW7A',
  manager:  'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJBZ3VzdGluSmVuaWxSYWpQQGNsYXJpdW0udGVjaCIsImVtcElkIjoxMDgxLCJkZXNpZ25hdGlvbiI6IlRlY2huaWNhbCBMZWFkIiwiaWF0IjoxNzgxNTA5MTMzLCJleHAiOjE5ODE1MTI3MzN9.EG0UdmRFpgukHuboycJj6ofjSG2BltlXQG04iJVyHnaBDNtjuWkIgfJ2j5S26PSRaZ7j5FSshuAQ-ZTkBqqBHw',
  // HR token is a placeholder — swap in a real HR-role JWT once issued.
  hr:       'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJzaGlsdmV5YXJhbmV0YXJAY2xhcml1bS50ZWNoIiwiZW1wSWQiOjExODAsImRlc2lnbmF0aW9uIjoiVGVhbSBMZWFkIC0gSFIiLCJpYXQiOjE3ODE1MDkxMzMsImV4cCI6MTk4MTUxMjczM30.6JPub-A9G_BqRoMh4otRlBQoFf7TsDL_Bb86a7fq1FPT891LPipqF7Vadh5LGrcCsF84HAnnmQawvex15Fue-A',
  // IT token is a placeholder — swap in a real IT-role JWT once issued.
  it:       'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJzYW50aG9zaGt1bWFya0BjbGFyaXVtLnRlY2giLCJlbXBJZCI6MTA0MCwiZGVzaWduYXRpb24iOiJBc3NvY2lhdGUgU29mdHdhcmUgRW5naW5lZXIiLCJpYXQiOjE3ODE1MDkxMzMsImV4cCI6MTk4MTUxMjczM30.fSsLdak54LoHYDKjRXLByJyf98CwOsUmMGYQGmXVfFSLiy6ifl0JVKKKbnG57T-hdwfvp2sNPaQTNh45EPz0yA',
} as const;