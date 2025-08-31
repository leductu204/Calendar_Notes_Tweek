
export const calendars = [
  { id: 'org-abc', name: 'Công ty ABC', type: 'org', color: '#111827' },
  { id: 'dep-mkt', name: 'Marketing', type: 'department', color: '#2563EB', orgId: 'org-abc' },
  { id: 'dep-sales', name: 'Sales', type: 'department', color: '#10B981', orgId: 'org-abc' },
  { id: 'dep-hr', name: 'Nhân sự', type: 'department', color: '#F59E0B', orgId: 'org-abc' },
  { id: 'per-nguyenvana', name: 'Nguyễn Văn A', type: 'personal', color: '#8B5CF6', orgId: 'org-abc', departmentId: 'dep-mkt' },
  { id: 'per-tranthib', name: 'Trần Thị B', type: 'personal', color: '#EC4899', orgId: 'org-abc', departmentId: 'dep-sales' },
]

export const initialTasksByDate = {}
