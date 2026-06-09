export type NavigationKey = 'dashboard' | 'products' | 'inventory' | 'new-sale' | 'sales' | 'reports';

export type NavigationItem = {
  key: NavigationKey;
  label: string;
};
