import type { PrismaClient } from '@prisma/client';
import type { User, UserProfile } from '@dishday/types';
import type {
  CreateUserInput,
  UpdateUserInput,
  UserRepository,
} from '../interfaces.js';
import { userFromPrisma, userProfileFromPrisma } from './mappers.js';

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const u = await this.prisma.user.findUnique({ where: { id } });
    return u ? userFromPrisma(u) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const u = await this.prisma.user.findUnique({ where: { email } });
    return u ? userFromPrisma(u) : null;
  }

  async create(data: CreateUserInput): Promise<User> {
    const u = await this.prisma.user.create({
      data: {
        id: data.id,
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash ?? null,
        avatarUrl: data.avatarUrl ?? null,
        plan: data.plan ?? 'free',
        ...(data.locale !== undefined && { locale: data.locale }),
      },
    });
    return userFromPrisma(u);
  }

  async update(id: string, data: UpdateUserInput): Promise<User> {
    const u = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        ...(data.plan !== undefined && { plan: data.plan }),
        ...(data.planExpiresAt !== undefined && {
          planExpiresAt: data.planExpiresAt ? new Date(data.planExpiresAt) : null,
        }),
        ...(data.onboardingDone !== undefined && { onboardingDone: data.onboardingDone }),
        ...(data.locale !== undefined && { locale: data.locale }),
      },
    });
    return userFromPrisma(u);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const p = await this.prisma.userProfile.findUnique({ where: { userId } });
    return p ? userProfileFromPrisma(p) : null;
  }

  async upsertProfile(
    userId: string,
    data: Partial<Omit<UserProfile, 'id' | 'userId'>>,
  ): Promise<UserProfile> {
    const p = await this.prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        dietaryGoals: data.dietaryGoals ?? undefined,
        allergies: data.allergies ?? [],
        diets: data.diets ?? [],
        cookingSkill: data.cookingSkill ?? null,
        householdSize: data.householdSize ?? 1,
        preferredCuisines: data.preferredCuisines ?? [],
        dislikedIngredients: data.dislikedIngredients ?? [],
      },
      update: {
        ...(data.dietaryGoals !== undefined && { dietaryGoals: data.dietaryGoals ?? undefined }),
        ...(data.allergies !== undefined && { allergies: data.allergies }),
        ...(data.diets !== undefined && { diets: data.diets }),
        ...(data.cookingSkill !== undefined && { cookingSkill: data.cookingSkill }),
        ...(data.householdSize !== undefined && { householdSize: data.householdSize }),
        ...(data.preferredCuisines !== undefined && { preferredCuisines: data.preferredCuisines }),
        ...(data.dislikedIngredients !== undefined && {
          dislikedIngredients: data.dislikedIngredients,
        }),
      },
    });
    return userProfileFromPrisma(p);
  }
}
