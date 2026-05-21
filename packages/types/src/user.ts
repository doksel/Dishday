import type { ISODateString, UUID } from './common';

export type UserPlan = 'free' | 'pro' | 'admin';
export type CookingSkill = 'beginner' | 'intermediate' | 'advanced';

export interface User {
  id: UUID;
  email: string;
  name: string;
  avatarUrl: string | null;
  plan: UserPlan;
  planExpiresAt: ISODateString | null;
  onboardingDone: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface DietaryGoals {
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
}

export interface UserProfile {
  id: UUID;
  userId: UUID;
  dietaryGoals: DietaryGoals | null;
  allergies: string[];
  diets: string[];
  cookingSkill: CookingSkill | null;
  householdSize: number;
  preferredCuisines: string[];
  dislikedIngredients: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthSession {
  user: User;
  tokens: AuthTokens;
}
