import type { AiCompletion, AiGenerateOptions, AiProvider } from './types.js';

/**
 * Dev/offline fallback. Returns a deterministic 7-day plan built from a small
 * recipe library. Used when no real provider key is configured, so the
 * pipeline (queue → worker → DB → UI) can be tested end-to-end without paying
 * or hitting rate limits.
 *
 * NOTE: ignores `systemPrompt`/`userPrompt` entirely. If you need
 * personalisation, configure a real provider.
 */
export class MockProvider implements AiProvider {
  readonly name = 'gemini' as const; // satisfies the literal type; we log usage with type='meal_plan'
  readonly model = 'mock';

  async generate(_opts: AiGenerateOptions): Promise<AiCompletion> {
    // Simulate latency so the "Generating…" UI is visible
    await new Promise((r) => setTimeout(r, 800));

    return {
      text: JSON.stringify({ days: mockDays() }),
      inputTokens: 500,
      outputTokens: 1500,
      costUsd: 0,
    };
  }
}

// ─── Tiny recipe library ──────────────────────────────────

interface Meal {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  title: string;
  description: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  ingredients: { name: string; quantity: number; unit: string }[];
}

const BREAKFASTS: Meal[] = [
  {
    mealType: 'breakfast',
    title: 'Greek Yogurt Parfait',
    description: 'Layered Greek yogurt with berries, granola, and honey.',
    calories: 350, proteinG: 22, carbsG: 45, fatG: 8,
    ingredients: [
      { name: 'Greek yogurt', quantity: 200, unit: 'g' },
      { name: 'Mixed berries', quantity: 80, unit: 'g' },
      { name: 'Granola', quantity: 40, unit: 'g' },
      { name: 'Honey', quantity: 1, unit: 'tbsp' },
    ],
  },
  {
    mealType: 'breakfast',
    title: 'Avocado Toast with Poached Egg',
    description: 'Sourdough toast topped with smashed avocado and a poached egg.',
    calories: 420, proteinG: 18, carbsG: 32, fatG: 24,
    ingredients: [
      { name: 'Sourdough bread', quantity: 2, unit: 'slices' },
      { name: 'Avocado', quantity: 0.5, unit: 'piece' },
      { name: 'Egg', quantity: 1, unit: 'piece' },
      { name: 'Lemon juice', quantity: 1, unit: 'tsp' },
    ],
  },
  {
    mealType: 'breakfast',
    title: 'Oatmeal with Banana & Almonds',
    description: 'Rolled oats cooked in milk, topped with banana slices and almonds.',
    calories: 380, proteinG: 14, carbsG: 60, fatG: 10,
    ingredients: [
      { name: 'Rolled oats', quantity: 60, unit: 'g' },
      { name: 'Milk', quantity: 200, unit: 'ml' },
      { name: 'Banana', quantity: 1, unit: 'piece' },
      { name: 'Almonds', quantity: 20, unit: 'g' },
    ],
  },
  {
    mealType: 'breakfast',
    title: 'Veggie Scramble',
    description: 'Scrambled eggs with spinach, tomatoes, and feta.',
    calories: 340, proteinG: 24, carbsG: 8, fatG: 22,
    ingredients: [
      { name: 'Egg', quantity: 3, unit: 'piece' },
      { name: 'Spinach', quantity: 50, unit: 'g' },
      { name: 'Cherry tomatoes', quantity: 80, unit: 'g' },
      { name: 'Feta', quantity: 30, unit: 'g' },
    ],
  },
];

const LUNCHES: Meal[] = [
  {
    mealType: 'lunch',
    title: 'Mediterranean Quinoa Bowl',
    description: 'Quinoa with chickpeas, cucumber, feta, and lemon dressing.',
    calories: 520, proteinG: 22, carbsG: 65, fatG: 18,
    ingredients: [
      { name: 'Quinoa', quantity: 80, unit: 'g' },
      { name: 'Chickpeas', quantity: 100, unit: 'g' },
      { name: 'Cucumber', quantity: 100, unit: 'g' },
      { name: 'Feta', quantity: 40, unit: 'g' },
      { name: 'Olive oil', quantity: 1, unit: 'tbsp' },
    ],
  },
  {
    mealType: 'lunch',
    title: 'Chicken Caesar Wrap',
    description: 'Grilled chicken, romaine, parmesan, and caesar dressing in a wrap.',
    calories: 560, proteinG: 35, carbsG: 42, fatG: 26,
    ingredients: [
      { name: 'Tortilla', quantity: 1, unit: 'piece' },
      { name: 'Grilled chicken breast', quantity: 120, unit: 'g' },
      { name: 'Romaine lettuce', quantity: 60, unit: 'g' },
      { name: 'Parmesan', quantity: 20, unit: 'g' },
      { name: 'Caesar dressing', quantity: 2, unit: 'tbsp' },
    ],
  },
  {
    mealType: 'lunch',
    title: 'Tomato Basil Soup with Grilled Cheese',
    description: 'Creamy tomato soup paired with a classic grilled cheese sandwich.',
    calories: 580, proteinG: 18, carbsG: 60, fatG: 28,
    ingredients: [
      { name: 'Tomatoes', quantity: 300, unit: 'g' },
      { name: 'Cream', quantity: 50, unit: 'ml' },
      { name: 'Bread', quantity: 2, unit: 'slices' },
      { name: 'Cheddar', quantity: 40, unit: 'g' },
    ],
  },
  {
    mealType: 'lunch',
    title: 'Buddha Bowl',
    description: 'Brown rice, roasted sweet potato, kale, edamame, tahini drizzle.',
    calories: 540, proteinG: 18, carbsG: 78, fatG: 14,
    ingredients: [
      { name: 'Brown rice', quantity: 80, unit: 'g' },
      { name: 'Sweet potato', quantity: 150, unit: 'g' },
      { name: 'Kale', quantity: 60, unit: 'g' },
      { name: 'Edamame', quantity: 80, unit: 'g' },
      { name: 'Tahini', quantity: 1, unit: 'tbsp' },
    ],
  },
];

const DINNERS: Meal[] = [
  {
    mealType: 'dinner',
    title: 'Salmon with Roasted Vegetables',
    description: 'Pan-seared salmon, asparagus and baby potatoes roasted in olive oil.',
    calories: 620, proteinG: 38, carbsG: 42, fatG: 28,
    ingredients: [
      { name: 'Salmon fillet', quantity: 150, unit: 'g' },
      { name: 'Asparagus', quantity: 150, unit: 'g' },
      { name: 'Baby potatoes', quantity: 200, unit: 'g' },
      { name: 'Olive oil', quantity: 1, unit: 'tbsp' },
    ],
  },
  {
    mealType: 'dinner',
    title: 'Spaghetti Bolognese',
    description: 'Classic beef ragù over spaghetti, finished with parmesan.',
    calories: 680, proteinG: 32, carbsG: 78, fatG: 22,
    ingredients: [
      { name: 'Spaghetti', quantity: 100, unit: 'g' },
      { name: 'Ground beef', quantity: 120, unit: 'g' },
      { name: 'Tomato sauce', quantity: 150, unit: 'ml' },
      { name: 'Onion', quantity: 0.5, unit: 'piece' },
      { name: 'Parmesan', quantity: 20, unit: 'g' },
    ],
  },
  {
    mealType: 'dinner',
    title: 'Thai Green Curry',
    description: 'Chicken in green curry with coconut milk, served over jasmine rice.',
    calories: 640, proteinG: 30, carbsG: 60, fatG: 26,
    ingredients: [
      { name: 'Chicken thigh', quantity: 150, unit: 'g' },
      { name: 'Green curry paste', quantity: 2, unit: 'tbsp' },
      { name: 'Coconut milk', quantity: 150, unit: 'ml' },
      { name: 'Jasmine rice', quantity: 80, unit: 'g' },
      { name: 'Thai basil', quantity: 10, unit: 'g' },
    ],
  },
  {
    mealType: 'dinner',
    title: 'Margherita Pizza',
    description: 'Wood-fired style margherita with tomato, mozzarella, and basil.',
    calories: 720, proteinG: 28, carbsG: 88, fatG: 26,
    ingredients: [
      { name: 'Pizza dough', quantity: 250, unit: 'g' },
      { name: 'Tomato sauce', quantity: 100, unit: 'ml' },
      { name: 'Mozzarella', quantity: 120, unit: 'g' },
      { name: 'Fresh basil', quantity: 8, unit: 'leaves' },
    ],
  },
];

const SNACKS: Meal[] = [
  {
    mealType: 'snack',
    title: 'Apple with Peanut Butter',
    description: 'Sliced apple with a tablespoon of natural peanut butter.',
    calories: 220, proteinG: 6, carbsG: 28, fatG: 10,
    ingredients: [
      { name: 'Apple', quantity: 1, unit: 'piece' },
      { name: 'Peanut butter', quantity: 1, unit: 'tbsp' },
    ],
  },
  {
    mealType: 'snack',
    title: 'Hummus & Carrot Sticks',
    description: 'Carrots and bell pepper sticks with classic hummus.',
    calories: 180, proteinG: 6, carbsG: 22, fatG: 8,
    ingredients: [
      { name: 'Hummus', quantity: 60, unit: 'g' },
      { name: 'Carrot', quantity: 1, unit: 'piece' },
      { name: 'Bell pepper', quantity: 0.5, unit: 'piece' },
    ],
  },
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length]!;
}

function mockDays() {
  // 7 days, varying meal choices for each
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    meals: [pick(BREAKFASTS, dayOfWeek), pick(LUNCHES, dayOfWeek + 1), pick(DINNERS, dayOfWeek + 2), pick(SNACKS, dayOfWeek)],
  }));
}
