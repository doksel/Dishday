import { AppShell } from '@/components/AppShell';
import { AiTipCard } from '@/components/home/AiTipCard';
import { DayCard, type DayCardMeal } from '@/components/home/DayCard';
import { GroceryPreview, type GroceryItem } from '@/components/home/GroceryPreview';
import { NutritionGoals } from '@/components/home/NutritionGoals';

/**
 * Demo data — static for now. Once the API + auth wiring is hooked up,
 * we'll swap these for `useQuery` calls in client components.
 */
const DEMO_WEEK: Array<{
  weekday: string;
  dayOfMonth: number;
  kcal?: number;
  isToday?: boolean;
  meals: DayCardMeal[];
}> = [
  {
    weekday: 'Mon',
    dayOfMonth: 23,
    kcal: 1850,
    meals: [
      {
        type: 'Breakfast',
        title: 'Avocado Poached Eggs',
        imageUrl:
          'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200&h=200&fit=crop',
      },
      {
        type: 'Lunch',
        title: 'Quinoa Salmon Salad',
        imageUrl:
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop',
      },
      {
        type: 'Dinner',
        title: 'Herbed Roasted Chicken',
        imageUrl:
          'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=200&h=200&fit=crop',
      },
    ],
  },
  {
    weekday: 'Tue',
    dayOfMonth: 24,
    isToday: true,
    meals: [
      {
        type: 'Breakfast',
        title: 'Wild Berry Smoothie Bowl',
        imageUrl:
          'https://images.unsplash.com/photo-1494390248081-4e521a5940db?w=200&h=200&fit=crop',
      },
      {
        type: 'Lunch',
        title: 'Falafel Veggie Wrap',
        imageUrl:
          'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=200&h=200&fit=crop',
      },
      {
        type: 'Dinner',
        title: 'Pesto Zoodles & Tofu',
        imageUrl:
          'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=200&h=200&fit=crop',
      },
    ],
  },
  {
    weekday: 'Wed',
    dayOfMonth: 25,
    kcal: 2100,
    meals: [
      {
        type: 'Breakfast',
        title: 'Blueberry Overnight Oats',
        imageUrl:
          'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=200&h=200&fit=crop',
      },
      {
        type: 'Lunch',
        title: 'Hearty Lentil Soup',
        imageUrl:
          'https://images.unsplash.com/photo-1547592180-85f173990554?w=200&h=200&fit=crop',
      },
      {
        type: 'Dinner',
        title: 'Ginger Beef Stir Fry',
        imageUrl:
          'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=200&h=200&fit=crop',
      },
    ],
  },
  {
    weekday: 'Thu',
    dayOfMonth: 26,
    kcal: 1920,
    meals: [
      {
        type: 'Breakfast',
        title: 'Greek Yogurt Pancakes',
        imageUrl:
          'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&h=200&fit=crop',
      },
      {
        type: 'Lunch',
        title: 'Roasted Buddha Bowl',
        imageUrl:
          'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop',
      },
      {
        type: 'Dinner',
        title: 'Lemon Herb Sea Bass',
        imageUrl:
          'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&h=200&fit=crop',
      },
    ],
  },
];

const DEMO_GROCERY: GroceryItem[] = [
  { id: '1', name: 'Fresh Atlantic Salmon', amount: '2 fillets', category: 'Meat' },
  { id: '2', name: 'Organic Baby Spinach', amount: '200g bag', category: 'Produce', checked: true },
  { id: '3', name: 'Avocados (Ripe)', amount: '3 units', category: 'Produce' },
  { id: '4', name: 'Quinoa (White or Red)', amount: '500g pack', category: 'Pantry' },
  { id: '5', name: 'Greek Yogurt (0%)', amount: '1kg tub', category: 'Dairy' },
];

export default function HomePage() {
  return (
    <AppShell
      title="Weekly Meal Plan"
      subtitle="Oct 23 — Oct 29, 2023"
      toolbar={
        <div className="flex items-center rounded-full border border-zinc-200 bg-white p-1 text-xs font-semibold">
          <button className="rounded-full bg-zinc-900 px-3 py-1 text-white">Weekly View</button>
          <button className="rounded-full px-3 py-1 text-zinc-600 hover:text-zinc-900">
            List View
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Horizontal weekly calendar */}
        <section className="-mx-4 overflow-x-auto px-4 pb-2 md:-mx-6 md:px-6">
          <div className="flex min-w-max gap-4">
            {DEMO_WEEK.map((d) => (
              <DayCard key={d.dayOfMonth} {...d} active={d.isToday} />
            ))}
          </div>
        </section>

        {/* Bottom row: nutrition + AI tip + grocery */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <NutritionGoals
              calories={{ current: 1332, target: 1850 }}
              protein={{ current: 65, target: 140 }}
              carbs={{ current: 176, target: 200 }}
              fat={{ current: 24, target: 80 }}
            />
            <AiTipCard
              body="Adding more leafy greens to your Tuesday dinner would help you hit your fiber goal for the week without increasing calories significantly."
            />
          </div>
          <GroceryPreview items={DEMO_GROCERY} totalCount={12} />
        </div>
      </div>
    </AppShell>
  );
}
