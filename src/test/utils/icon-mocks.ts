import { vi } from 'vitest'

// Helper function to create icon mocks that handle boolean props correctly
export const createIconMock = (name: string) => {
  return vi.fn(({ fill, priority, ...props }: any) => {
    return {
      type: 'div',
      props: {
        'data-testid': `icon-${name.toLowerCase()}`,
        'data-fill': fill?.toString(),
        'data-priority': priority?.toString(),
        ...props
      }
    };
  });
}

// Standard icon mocks for common Tabler icons
export const iconMocks = {
  IconCamera: createIconMock('camera'),
  IconChartBar: createIconMock('chart-bar'),
  IconDashboard: createIconMock('dashboard'),
  IconListDetails: createIconMock('list-details'),
  IconReport: createIconMock('report'),
  IconSettings: createIconMock('settings'),
  IconUsers: createIconMock('users'),
  IconCalendar: createIconMock('calendar'),
  IconUser: createIconMock('user'),
  IconLogout: createIconMock('logout'),
  IconMenu2: createIconMock('menu2'),
  IconX: createIconMock('x'),
  IconLoader2: createIconMock('loader2'),
  IconAlertTriangle: createIconMock('alert-triangle'),
  IconChevronDown: createIconMock('chevron-down'),
  IconChevronRight: createIconMock('chevron-right'),
  IconPlus: createIconMock('plus'),
  IconEdit: createIconMock('edit'),
  IconTrash: createIconMock('trash'),
  IconEye: createIconMock('eye'),
  IconRefresh: createIconMock('refresh'),
  IconMessageCircle: createIconMock('message-circle'),
}

// Export mock factory for custom usage
export const mockTablerIcons = () => vi.mock('@tabler/icons-react', () => iconMocks)