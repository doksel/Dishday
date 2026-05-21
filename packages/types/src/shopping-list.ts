import type { ISODateString, UUID } from './common';

export interface ShoppingListItem {
  id: UUID;
  listId: UUID;
  ingredientName: string;
  totalQuantity: number;
  unit: string;
  category: string | null;
  isChecked: boolean;
}

export interface ShoppingList {
  id: UUID;
  planId: UUID;
  userId: UUID;
  generatedAt: ISODateString;
  items?: ShoppingListItem[];
}
