import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Sample official recipe
  await prisma.recipe.upsert({
    where: { slug: 'classic-margherita-pizza' },
    update: {},
    create: {
      title: 'Classic Margherita Pizza',
      slug: 'classic-margherita-pizza',
      description: 'Simple Italian classic with tomato, mozzarella, and fresh basil.',
      source: 'official',
      prepTimeMin: 20,
      cookTimeMin: 12,
      servings: 2,
      caloriesPerServing: 540,
      proteinG: 22,
      carbsG: 65,
      fatG: 20,
      isPublic: true,
      isApproved: true,
      tags: ['italian', 'vegetarian', 'classic'],
      cuisine: 'italian',
      mealType: ['lunch', 'dinner'],
      ingredients: {
        create: [
          { name: 'Pizza dough', quantity: 250, unit: 'g', orderIndex: 0 },
          { name: 'Tomato sauce', quantity: 100, unit: 'ml', orderIndex: 1 },
          { name: 'Mozzarella', quantity: 150, unit: 'g', orderIndex: 2 },
          { name: 'Fresh basil', quantity: 10, unit: 'leaves', orderIndex: 3 },
        ],
      },
    },
  });

  console.log('✓ Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
