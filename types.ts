export interface ActivityItem {
  id: number;
  type: string;
  title: string;
  description: string;
  time: string;
  image: string | null;
  icon?: string;
  iconColor?: string;
  badgeColor?: string;
  fallbackIcon?: string;
  fallbackColor?: string;
  action?: string;
  actionPrimary?: boolean;
  grayscale?: boolean;
}

export interface ChartDataPoint {
  name: string;
  revenue: number;
  expense: number;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'alert' | 'info' | 'success';
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}