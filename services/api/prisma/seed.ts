import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper: standard Unsplash CDN URL sized for mobile cards.
const img = (id: string) =>
  `https://images.unsplash.com/${id}?w=600&h=400&fit=crop&q=80&auto=format`;

interface SeedRecipe {
  title: string;
  slug: string;
  description: string;
  imageUrl: string;
  prepTimeMin: number;
  cookTimeMin: number;
  servings: number;
  caloriesPerServing: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  tags: string[];
  cuisine: string;
  mealType: ('breakfast' | 'lunch' | 'dinner' | 'snack')[];
  ingredients: { name: string; quantity: number; unit: string; orderIndex: number }[];
}

const RECIPES: SeedRecipe[] = [
  // ─── Breakfast ─────────────────────────────────────────
  {
    title: 'Greek Yogurt Parfait',
    slug: 'greek-yogurt-parfait',
    description: 'Layered Greek yogurt with berries, granola, and honey.',
    imageUrl: img('photo-1488477181946-6428a0291777'),
    prepTimeMin: 5, cookTimeMin: 0, servings: 1,
    caloriesPerServing: 350, proteinG: 22, carbsG: 45, fatG: 8,
    tags: ['high-protein', 'quick', 'vegetarian'],
    cuisine: 'mediterranean',
    mealType: ['breakfast'],
    ingredients: [
      { name: 'Greek yogurt', quantity: 200, unit: 'g', orderIndex: 0 },
      { name: 'Mixed berries', quantity: 80, unit: 'g', orderIndex: 1 },
      { name: 'Granola', quantity: 40, unit: 'g', orderIndex: 2 },
      { name: 'Honey', quantity: 1, unit: 'tbsp', orderIndex: 3 },
    ],
  },
  {
    title: 'Avocado Toast with Poached Egg',
    slug: 'avocado-toast-poached-egg',
    description: 'Sourdough toast topped with smashed avocado and a poached egg.',
    imageUrl: img('photo-1525351484163-7529414344d8'),
    prepTimeMin: 5, cookTimeMin: 5, servings: 1,
    caloriesPerServing: 420, proteinG: 18, carbsG: 32, fatG: 24,
    tags: ['vegetarian', 'quick'],
    cuisine: 'american',
    mealType: ['breakfast'],
    ingredients: [
      { name: 'Sourdough bread', quantity: 2, unit: 'slices', orderIndex: 0 },
      { name: 'Avocado', quantity: 0.5, unit: 'piece', orderIndex: 1 },
      { name: 'Egg', quantity: 1, unit: 'piece', orderIndex: 2 },
      { name: 'Lemon juice', quantity: 1, unit: 'tsp', orderIndex: 3 },
      { name: 'Sea salt', quantity: 1, unit: 'pinch', orderIndex: 4 },
    ],
  },
  {
    title: 'Oatmeal with Banana & Almonds',
    slug: 'oatmeal-banana-almonds',
    description: 'Rolled oats cooked in milk, topped with banana slices and almonds.',
    imageUrl: img('photo-1517673400267-0251440c45dc'),
    prepTimeMin: 2, cookTimeMin: 8, servings: 1,
    caloriesPerServing: 380, proteinG: 14, carbsG: 60, fatG: 10,
    tags: ['vegetarian', 'high-fiber'],
    cuisine: 'international',
    mealType: ['breakfast'],
    ingredients: [
      { name: 'Rolled oats', quantity: 60, unit: 'g', orderIndex: 0 },
      { name: 'Milk', quantity: 200, unit: 'ml', orderIndex: 1 },
      { name: 'Banana', quantity: 1, unit: 'piece', orderIndex: 2 },
      { name: 'Almonds', quantity: 20, unit: 'g', orderIndex: 3 },
    ],
  },
  {
    title: 'Veggie Scramble',
    slug: 'veggie-scramble',
    description: 'Scrambled eggs with spinach, tomatoes, and feta cheese.',
    imageUrl: img('photo-1606787366850-de6330128bfc'),
    prepTimeMin: 5, cookTimeMin: 7, servings: 1,
    caloriesPerServing: 340, proteinG: 24, carbsG: 8, fatG: 22,
    tags: ['low-carb', 'vegetarian', 'keto'],
    cuisine: 'mediterranean',
    mealType: ['breakfast'],
    ingredients: [
      { name: 'Egg', quantity: 3, unit: 'piece', orderIndex: 0 },
      { name: 'Spinach', quantity: 50, unit: 'g', orderIndex: 1 },
      { name: 'Cherry tomatoes', quantity: 80, unit: 'g', orderIndex: 2 },
      { name: 'Feta', quantity: 30, unit: 'g', orderIndex: 3 },
      { name: 'Olive oil', quantity: 1, unit: 'tsp', orderIndex: 4 },
    ],
  },
  {
    title: 'Berry Smoothie Bowl',
    slug: 'berry-smoothie-bowl',
    description: 'Frozen berries blended with yogurt, topped with chia and coconut.',
    imageUrl: img('photo-1494390248081-4e521a5940db'),
    prepTimeMin: 7, cookTimeMin: 0, servings: 1,
    caloriesPerServing: 310, proteinG: 12, carbsG: 50, fatG: 9,
    tags: ['vegetarian', 'no-cook'],
    cuisine: 'international',
    mealType: ['breakfast', 'snack'],
    ingredients: [
      { name: 'Frozen mixed berries', quantity: 150, unit: 'g', orderIndex: 0 },
      { name: 'Greek yogurt', quantity: 100, unit: 'g', orderIndex: 1 },
      { name: 'Chia seeds', quantity: 1, unit: 'tbsp', orderIndex: 2 },
      { name: 'Coconut flakes', quantity: 10, unit: 'g', orderIndex: 3 },
    ],
  },

  // ─── Lunch ─────────────────────────────────────────────
  {
    title: 'Mediterranean Quinoa Bowl',
    slug: 'mediterranean-quinoa-bowl',
    description: 'Quinoa with chickpeas, cucumber, feta, and lemon dressing.',
    imageUrl: img('photo-1546069901-ba9599a7e63c'),
    prepTimeMin: 10, cookTimeMin: 15, servings: 1,
    caloriesPerServing: 520, proteinG: 22, carbsG: 65, fatG: 18,
    tags: ['vegetarian', 'high-fiber'],
    cuisine: 'mediterranean',
    mealType: ['lunch'],
    ingredients: [
      { name: 'Quinoa', quantity: 80, unit: 'g', orderIndex: 0 },
      { name: 'Chickpeas', quantity: 100, unit: 'g', orderIndex: 1 },
      { name: 'Cucumber', quantity: 100, unit: 'g', orderIndex: 2 },
      { name: 'Feta', quantity: 40, unit: 'g', orderIndex: 3 },
      { name: 'Olive oil', quantity: 1, unit: 'tbsp', orderIndex: 4 },
      { name: 'Lemon juice', quantity: 1, unit: 'tbsp', orderIndex: 5 },
    ],
  },
  {
    title: 'Chicken Caesar Wrap',
    slug: 'chicken-caesar-wrap',
    description: 'Grilled chicken, romaine, parmesan and Caesar dressing in a tortilla.',
    imageUrl: img('photo-1626700051175-6818013e1d4f'),
    prepTimeMin: 5, cookTimeMin: 10, servings: 1,
    caloriesPerServing: 560, proteinG: 35, carbsG: 42, fatG: 26,
    tags: ['high-protein'],
    cuisine: 'american',
    mealType: ['lunch'],
    ingredients: [
      { name: 'Tortilla', quantity: 1, unit: 'piece', orderIndex: 0 },
      { name: 'Grilled chicken breast', quantity: 120, unit: 'g', orderIndex: 1 },
      { name: 'Romaine lettuce', quantity: 60, unit: 'g', orderIndex: 2 },
      { name: 'Parmesan', quantity: 20, unit: 'g', orderIndex: 3 },
      { name: 'Caesar dressing', quantity: 2, unit: 'tbsp', orderIndex: 4 },
    ],
  },
  {
    title: 'Tomato Basil Soup with Grilled Cheese',
    slug: 'tomato-basil-soup-grilled-cheese',
    description: 'Creamy tomato soup with a classic cheddar grilled cheese.',
    imageUrl: img('photo-1547592180-85f173990554'),
    prepTimeMin: 10, cookTimeMin: 20, servings: 1,
    caloriesPerServing: 580, proteinG: 18, carbsG: 60, fatG: 28,
    tags: ['vegetarian', 'comfort'],
    cuisine: 'american',
    mealType: ['lunch'],
    ingredients: [
      { name: 'Tomatoes', quantity: 300, unit: 'g', orderIndex: 0 },
      { name: 'Cream', quantity: 50, unit: 'ml', orderIndex: 1 },
      { name: 'Bread', quantity: 2, unit: 'slices', orderIndex: 2 },
      { name: 'Cheddar', quantity: 40, unit: 'g', orderIndex: 3 },
      { name: 'Fresh basil', quantity: 10, unit: 'g', orderIndex: 4 },
    ],
  },
  {
    title: 'Buddha Bowl',
    slug: 'buddha-bowl',
    description: 'Brown rice, roasted sweet potato, kale, edamame, and tahini drizzle.',
    imageUrl: img('photo-1512621776951-a57141f2eefd'),
    prepTimeMin: 10, cookTimeMin: 30, servings: 1,
    caloriesPerServing: 540, proteinG: 18, carbsG: 78, fatG: 14,
    tags: ['vegan', 'high-fiber'],
    cuisine: 'asian',
    mealType: ['lunch'],
    ingredients: [
      { name: 'Brown rice', quantity: 80, unit: 'g', orderIndex: 0 },
      { name: 'Sweet potato', quantity: 150, unit: 'g', orderIndex: 1 },
      { name: 'Kale', quantity: 60, unit: 'g', orderIndex: 2 },
      { name: 'Edamame', quantity: 80, unit: 'g', orderIndex: 3 },
      { name: 'Tahini', quantity: 1, unit: 'tbsp', orderIndex: 4 },
    ],
  },
  {
    title: 'Tuna Niçoise Salad',
    slug: 'tuna-nicoise-salad',
    description: 'French-style salad with tuna, green beans, potatoes, olives, and egg.',
    imageUrl: img('photo-1540420773420-3366772f4999'),
    prepTimeMin: 15, cookTimeMin: 15, servings: 1,
    caloriesPerServing: 480, proteinG: 30, carbsG: 32, fatG: 22,
    tags: ['high-protein', 'pescetarian'],
    cuisine: 'french',
    mealType: ['lunch'],
    ingredients: [
      { name: 'Tuna in oil', quantity: 100, unit: 'g', orderIndex: 0 },
      { name: 'Green beans', quantity: 80, unit: 'g', orderIndex: 1 },
      { name: 'Baby potatoes', quantity: 120, unit: 'g', orderIndex: 2 },
      { name: 'Black olives', quantity: 30, unit: 'g', orderIndex: 3 },
      { name: 'Hard-boiled egg', quantity: 1, unit: 'piece', orderIndex: 4 },
    ],
  },

  // ─── Dinner ────────────────────────────────────────────
  {
    title: 'Salmon with Roasted Vegetables',
    slug: 'salmon-roasted-vegetables',
    description: 'Pan-seared salmon with asparagus and baby potatoes.',
    imageUrl: img('photo-1467003909585-2f8a72700288'),
    prepTimeMin: 10, cookTimeMin: 25, servings: 1,
    caloriesPerServing: 620, proteinG: 38, carbsG: 42, fatG: 28,
    tags: ['high-protein', 'pescetarian'],
    cuisine: 'european',
    mealType: ['dinner'],
    ingredients: [
      { name: 'Salmon fillet', quantity: 150, unit: 'g', orderIndex: 0 },
      { name: 'Asparagus', quantity: 150, unit: 'g', orderIndex: 1 },
      { name: 'Baby potatoes', quantity: 200, unit: 'g', orderIndex: 2 },
      { name: 'Olive oil', quantity: 1, unit: 'tbsp', orderIndex: 3 },
      { name: 'Lemon', quantity: 0.5, unit: 'piece', orderIndex: 4 },
    ],
  },
  {
    title: 'Spaghetti Bolognese',
    slug: 'spaghetti-bolognese',
    description: 'Classic beef ragù over spaghetti, finished with parmesan.',
    imageUrl: img('photo-1551892374-ecf8754cf8b0'),
    prepTimeMin: 10, cookTimeMin: 35, servings: 1,
    caloriesPerServing: 680, proteinG: 32, carbsG: 78, fatG: 22,
    tags: ['comfort', 'classic'],
    cuisine: 'italian',
    mealType: ['dinner'],
    ingredients: [
      { name: 'Spaghetti', quantity: 100, unit: 'g', orderIndex: 0 },
      { name: 'Ground beef', quantity: 120, unit: 'g', orderIndex: 1 },
      { name: 'Tomato sauce', quantity: 150, unit: 'ml', orderIndex: 2 },
      { name: 'Onion', quantity: 0.5, unit: 'piece', orderIndex: 3 },
      { name: 'Parmesan', quantity: 20, unit: 'g', orderIndex: 4 },
    ],
  },
  {
    title: 'Thai Green Curry',
    slug: 'thai-green-curry',
    description: 'Chicken in green curry with coconut milk, over jasmine rice.',
    imageUrl: img('photo-1455619452474-d2be8b1e70cd'),
    prepTimeMin: 15, cookTimeMin: 25, servings: 1,
    caloriesPerServing: 640, proteinG: 30, carbsG: 60, fatG: 26,
    tags: ['spicy'],
    cuisine: 'thai',
    mealType: ['dinner'],
    ingredients: [
      { name: 'Chicken thigh', quantity: 150, unit: 'g', orderIndex: 0 },
      { name: 'Green curry paste', quantity: 2, unit: 'tbsp', orderIndex: 1 },
      { name: 'Coconut milk', quantity: 150, unit: 'ml', orderIndex: 2 },
      { name: 'Jasmine rice', quantity: 80, unit: 'g', orderIndex: 3 },
      { name: 'Thai basil', quantity: 10, unit: 'g', orderIndex: 4 },
    ],
  },
  {
    title: 'Classic Margherita Pizza',
    slug: 'classic-margherita-pizza',
    description: 'Simple Italian classic with tomato, mozzarella, and fresh basil.',
    imageUrl: img('photo-1565299624946-b28f40a0ae38'),
    prepTimeMin: 20, cookTimeMin: 12, servings: 2,
    caloriesPerServing: 540, proteinG: 22, carbsG: 65, fatG: 20,
    tags: ['vegetarian', 'classic'],
    cuisine: 'italian',
    mealType: ['lunch', 'dinner'],
    ingredients: [
      { name: 'Pizza dough', quantity: 250, unit: 'g', orderIndex: 0 },
      { name: 'Tomato sauce', quantity: 100, unit: 'ml', orderIndex: 1 },
      { name: 'Mozzarella', quantity: 150, unit: 'g', orderIndex: 2 },
      { name: 'Fresh basil', quantity: 10, unit: 'leaves', orderIndex: 3 },
    ],
  },
  {
    title: 'Beef Stir-Fry with Broccoli',
    slug: 'beef-stir-fry-broccoli',
    description: 'Tender beef strips stir-fried with broccoli in a garlic-soy sauce.',
    imageUrl: img('photo-1512058564366-18510be2db19'),
    prepTimeMin: 10, cookTimeMin: 12, servings: 1,
    caloriesPerServing: 560, proteinG: 34, carbsG: 48, fatG: 22,
    tags: ['high-protein', 'quick'],
    cuisine: 'asian',
    mealType: ['dinner'],
    ingredients: [
      { name: 'Beef strips', quantity: 150, unit: 'g', orderIndex: 0 },
      { name: 'Broccoli', quantity: 200, unit: 'g', orderIndex: 1 },
      { name: 'Garlic', quantity: 2, unit: 'cloves', orderIndex: 2 },
      { name: 'Soy sauce', quantity: 2, unit: 'tbsp', orderIndex: 3 },
      { name: 'Rice', quantity: 80, unit: 'g', orderIndex: 4 },
    ],
  },

  // ─── Snacks ────────────────────────────────────────────
  {
    title: 'Apple with Peanut Butter',
    slug: 'apple-peanut-butter',
    description: 'Sliced apple with a tablespoon of natural peanut butter.',
    imageUrl: img('photo-1568901839119-aabbc1f78d7e'),
    prepTimeMin: 3, cookTimeMin: 0, servings: 1,
    caloriesPerServing: 220, proteinG: 6, carbsG: 28, fatG: 10,
    tags: ['vegan', 'quick', 'no-cook'],
    cuisine: 'international',
    mealType: ['snack'],
    ingredients: [
      { name: 'Apple', quantity: 1, unit: 'piece', orderIndex: 0 },
      { name: 'Peanut butter', quantity: 1, unit: 'tbsp', orderIndex: 1 },
    ],
  },
  {
    title: 'Hummus & Veggie Sticks',
    slug: 'hummus-veggie-sticks',
    description: 'Carrots and bell pepper sticks with classic hummus.',
    imageUrl: img('photo-1593538212469-43c3b9f8b30c'),
    prepTimeMin: 5, cookTimeMin: 0, servings: 1,
    caloriesPerServing: 180, proteinG: 6, carbsG: 22, fatG: 8,
    tags: ['vegan', 'no-cook'],
    cuisine: 'mediterranean',
    mealType: ['snack'],
    ingredients: [
      { name: 'Hummus', quantity: 60, unit: 'g', orderIndex: 0 },
      { name: 'Carrot', quantity: 1, unit: 'piece', orderIndex: 1 },
      { name: 'Bell pepper', quantity: 0.5, unit: 'piece', orderIndex: 2 },
    ],
  },
  {
    title: 'Trail Mix',
    slug: 'trail-mix',
    description: 'Nuts, dried fruit, and dark chocolate chips.',
    imageUrl: img('photo-1599909533321-2d1d2dfdc1d4'),
    prepTimeMin: 2, cookTimeMin: 0, servings: 1,
    caloriesPerServing: 250, proteinG: 7, carbsG: 22, fatG: 16,
    tags: ['vegetarian', 'no-cook', 'energy'],
    cuisine: 'international',
    mealType: ['snack'],
    ingredients: [
      { name: 'Mixed nuts', quantity: 30, unit: 'g', orderIndex: 0 },
      { name: 'Raisins', quantity: 15, unit: 'g', orderIndex: 1 },
      { name: 'Dark chocolate chips', quantity: 10, unit: 'g', orderIndex: 2 },
    ],
  },
];

async function main() {
  let created = 0;
  let updated = 0;
  for (const recipe of RECIPES) {
    const { ingredients, ...rest } = recipe;
    const existing = await prisma.recipe.findUnique({ where: { slug: rest.slug } });
    if (existing) {
      // Update imageUrl in case it was added/changed since last seed
      await prisma.recipe.update({
        where: { slug: rest.slug },
        data: { imageUrl: rest.imageUrl },
      });
      updated += 1;
      continue;
    }
    await prisma.recipe.create({
      data: {
        ...rest,
        source: 'official',
        isPublic: true,
        isApproved: true,
        ingredients: { create: ingredients },
      },
    });
    created += 1;
  }
  console.log(`✓ Seed complete — ${created} created, ${updated} updated`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
