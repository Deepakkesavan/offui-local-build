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
} as const;

/**
 * JWT tokens keyed by role.
 * In production these should come from your auth service, not be hard-coded.
 */
export const JWT_TOKENS = {
  employee: 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJub2JlbGZyYW5rbGlubEBjbGFyaXVtLnRlY2giLCJlbXBJZCI6MTIzMiwiZGVzaWduYXRpb24iOiJUcmFpbmVlIFNvZnR3YXJlIEVuZ2luZWVyIiwiaWF0IjoxNzgxNTA5MTMzLCJleHAiOjE4ODE1MTI3MzN9.JLPXsPNhHHc5tpc2nngY9P0bMYvDCD0jhX5HKImZGKQ3MKAECfmwq7BwmviDPfnu1DwP10X8VfXgufUKD8rHVw',
  manager:  'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJBZ3VzdGluSmVuaWxSYWpQQGNsYXJpdW0udGVjaCIsImVtcElkIjoxMDgxLCJkZXNpZ25hdGlvbiI6IlRlY2huaWNhbCBMZWFkIiwiaWF0IjoxNzgxNTA5MTMzLCJleHAiOjE5ODE1MTI3MzN9.EG0UdmRFpgukHuboycJj6ofjSG2BltlXQG04iJVyHnaBDNtjuWkIgfJ2j5S26PSRaZ7j5FSshuAQ-ZTkBqqBHw',
  // HR token is a placeholder — swap in a real HR-role JWT once issued.
  hr:       'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJzaGlsdmV5YXJhbmV0YXJAY2xhcml1bS50ZWNoIiwiZW1wSWQiOjExODAsImRlc2lnbmF0aW9uIjoiVGVhbSBMZWFkIC0gSFIiLCJpYXQiOjE3ODE1MDkxMzMsImV4cCI6MTk4MTUxMjczM30.6JPub-A9G_BqRoMh4otRlBQoFf7TsDL_Bb86a7fq1FPT891LPipqF7Vadh5LGrcCsF84HAnnmQawvex15Fue-A',
} as const;