export enum ViewMode {
    EXPLORER = 'explorer',
    DETAIL = 'detail'
  }

  export enum Theme {
    DARK = 'dark',
    LIGHT = 'light',
    SYSTEM = 'system'
  }

  export interface TimeRange {
    start: Date;
    end: Date;
  }

  export interface PlaybackSettings {
    isPlaying: boolean;
    speed: number;
    loop: boolean;
  }

  export interface ExportOptions {
    includeMap: boolean;
    includeTimeline: boolean;
    includeStats: boolean;
    format: 'png' | 'jpg' | 'pdf';
    resolution: 'low' | 'medium' | 'high';
  }

  export interface UserPreferences {
    theme: Theme;
    defaultMapStyle: string;
    defaultViewMode: ViewMode;
    showIntro: boolean;
    autoPlayAnimation: boolean;
    defaultTimeRange: TimeRange;
    defaultFilters: {
      minFireArea: number;
      maxFireArea: number;
      minDuration: number;
      maxDuration: number;
      minMeanFrp: number;
      maxMeanFrp: number;
    };
  }

  export interface ChartProperty {
    value: string;
    label: string;
    formatter: (value: number) => string;
    color?: string;
    fill?: boolean;
    yAxisLabel?: string;
  }

  export interface FilterOption {
    id: string;
    label: string;
    unit: string;
    min: number;
    max: number;
    step?: number;
    defaultValue?: number;
  }

  export interface ToastNotification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    autoClose?: boolean;
    duration?: number;
  }

  export interface MenuItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    action?: () => void;
    url?: string;
    disabled?: boolean;
    children?: MenuItem[];
  }