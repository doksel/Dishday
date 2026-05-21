import type { PrismaClient } from '@prisma/client';
import type { ShoppingList, ShoppingListItem } from '@dishday/types';
import type { CreateShoppingListInput, ShoppingListRepository } from '../interfaces.js';
import { shoppingListFromPrisma, shoppingListItemFromPrisma } from './mappers.js';

export class PrismaShoppingListRepository implements ShoppingListRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<ShoppingList | null> {
    const l = await this.prisma.shoppingList.findUnique({
      where: { id },
      include: { items: true },
    });
    return l ? shoppingListFromPrisma(l) : null;
  }

  async findByPlan(planId: string): Promise<ShoppingList | null> {
    const l = await this.prisma.shoppingList.findFirst({
      where: { planId },
      orderBy: { generatedAt: 'desc' },
      include: { items: true },
    });
    return l ? shoppingListFromPrisma(l) : null;
  }

  async create(data: CreateShoppingListInput): Promise<ShoppingList> {
    const l = await this.prisma.shoppingList.create({
      data: {
        planId: data.planId,
        userId: data.userId,
        items: {
          create: data.items.map((i) => ({
            ingredientName: i.ingredientName,
            totalQuantity: i.totalQuantity,
            unit: i.unit,
            category: i.category ?? null,
          })),
        },
      },
      include: { items: true },
    });
    return shoppingListFromPrisma(l);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.shoppingList.delete({ where: { id } });
  }

  async toggleItem(itemId: string, isChecked: boolean): Promise<void> {
    await this.prisma.shoppingListItem.update({
      where: { id: itemId },
      data: { isChecked },
    });
  }

  async addItem(
    listId: string,
    data: Omit<ShoppingListItem, 'id' | 'listId' | 'isChecked'>,
  ): Promise<ShoppingListItem> {
    const i = await this.prisma.shoppingListItem.create({
      data: {
        listId,
        ingredientName: data.ingredientName,
        totalQuantity: data.totalQuantity,
        unit: data.unit,
        category: data.category ?? null,
      },
    });
    return shoppingListItemFromPrisma(i);
  }

  async removeItem(itemId: string): Promise<void> {
    await this.prisma.shoppingListItem.delete({ where: { id: itemId } });
  }
}
