'use client';

import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { AiTipCard } from '@/components/home/AiTipCard';
import { DayCard, type DayCardMeal } from '@/components/home/DayCard';
import { GroceryPreview, type GroceryItem } from '@/components/home/GroceryPreview';
import { MealCardBig } from '@/components/home/MealCardBig';
import { NutritionGoals } from '@/components/home/NutritionGoals';
import type { MealType } from '@dishday/types';

/**
 * Static demo until the real API + auth flow is wired up. Each day is keyed
 * by its dow index (0=Mon … 6=Sun); the calendar shows all seven and the
 * detail row below renders whichever day is `selectedDow`.
 */

interface DemoMeal extends DayCardMeal {
  mealType: MealType;
  kcal: number;
  minutes: number;
  /** Hero image used in the big meal card below the calendar. */
  heroUrl: string;
}

interface DemoDay {
  dow: number;
  weekday: string;
  dayOfMonth: number;
  kcal?: number;
  isToday?: boolean;
  meals: DemoMeal[];
}

// Tuesday (dow=1) is "today" — matches the screenshot.
const TODAY_DOW = 1;

const DEMO_WEEK: DemoDay[] = [
  {
    dow: 0,
    weekday: 'Mon',
    dayOfMonth: 23,
    kcal: 1850,
    meals: [
      makeMeal('Breakfast', 'Avocado Poached Eggs', 'photo-1525351484163-7529414344d8', 420, 12),
      makeMeal('Lunch', 'Quinoa Salmon Salad', 'photo-1546069901-ba9599a7e63c', 520, 25),
      makeMeal('Dinner', 'Herbed Roasted Chicken', 'photo-1604908176997-125f25cc6f3d', 620, 45),
    ],
  },
  {
    dow: 1,
    weekday: 'Tue',
    dayOfMonth: 24,
    isToday: true,
    meals: [
      makeMeal('Breakfast', 'Wild Berry Smoothie Bowl', 'photo-1494390248081-4e521a5940db', 310, 7),
      makeMeal('Lunch', 'Falafel Veggie Wrap', 'photo-1626700051175-6818013e1d4f', 560, 15),
      makeMeal('Dinner', 'Pesto Zoodles & Tofu', 'photo-1473093295043-cdd812d0e601', 480, 25),
    ],
  },
  {
    dow: 2,
    weekday: 'Wed',
    dayOfMonth: 25,
    kcal: 2100,
    meals: [
      makeMeal('Breakfast', 'Blueberry Overnight Oats', 'photo-1517673400267-0251440c45dc', 380, 10),
      makeMeal('Lunch', 'Hearty Lentil Soup', 'photo-1547592180-85f173990554', 540, 30),
      makeMeal('Dinner', 'Ginger Beef Stir Fry', 'photo-1512058564366-18510be2db19', 640, 22),
    ],
  },
  {
    dow: 3,
    weekday: 'Thu',
    dayOfMonth: 26,
    kcal: 1920,
    meals: [
      makeMeal('Breakfast', 'Greek Yogurt Pancakes', 'photo-1488477181946-6428a0291777', 410, 18),
      makeMeal('Lunch', 'Roasted Buddha Bowl', 'photo-1512621776951-a57141f2eefd', 540, 40),
      makeMeal('Dinner', 'Lemon Herb Sea Bass', 'photo-1467003909585-2f8a72700288', 620, 35),
    ],
  },
  {
    dow: 4,
    weekday: 'Fri',
    dayOfMonth: 27,
    kcal: 2080,
    meals: [
      makeMeal('Breakfast', 'Veggie Scramble', 'photo-1606787366850-de6330128bfc', 340, 12),
      makeMeal('Lunch', 'Tuna Niçoise Salad', 'photo-1540420773420-3366772f4999', 480, 30),
      makeMeal('Dinner', 'Spaghetti Bolognese', 'photo-1551892374-ecf8754cf8b0', 680, 45),
    ],
  },
  {
    dow: 5,
    weekday: 'Sat',
    dayOfMonth: 28,
    kcal: 2250,
    meals: [
      makeMeal('Breakfast', 'Avocado Poached Eggs', 'photo-1525351484163-7529414344d8', 420, 12),
      makeMeal('Lunch', 'Classic Margherita Pizza', 'photo-1565299624946-b28f40a0ae38', 540, 32),
      makeMeal('Dinner', 'Thai Green Curry', 'photo-1455619452474-d2be8b1e70cd', 640, 40),
    ],
  },
  {
    dow: 6,
    weekday: 'Sun',
    dayOfMonth: 29,
    kcal: 1980,
    meals: [
      makeMeal('Breakfast', 'Oatmeal with Banana & Almonds', 'photo-1517673400267-0251440c45dc', 380, 10),
      makeMeal('Lunch', 'Mediterranean Quinoa Bowl', 'photo-1546069901-ba9599a7e63c', 520, 25),
      makeMeal('Dinner', 'Beef Stir-Fry with Broccoli', 'photo-1512058564366-18510be2db19', 560, 22),
    ],
  },
];

function makeMeal(
  type: 'Breakfast' | 'Lunch' | 'Dinner',
  title: string,
  unsplashId: string,
  kcal: number,
  minutes: number,
): DemoMeal {
  const mealType = type.toLowerCase() as MealType;
  return {
    type,
    mealType,
    title,
    kcal,
    minutes,
    imageUrl: `https://images.unsplash.com/${unsplashId}?w=200&h=200&fit=crop`,
    heroUrl: `https://images.unsplash.com/${unsplashId}?w=800&h=500&fit=crop`,
  };
}

const DEMO_GROCERY: GroceryItem[] = [
  { id: '1', name: 'Fresh Atlantic Salmon', amount: '2 fillets', category: 'Meat' },
  { id: '2', name: 'Organic Baby Spinach', amount: '200g bag', category: 'Produce', checked: true },
  { id: '3', name: 'Avocados (Ripe)', amount: '3 units', category: 'Produce' },
  { id: '4', name: 'Quinoa (White or Red)', amount: '500g pack', category: 'Pantry' },
  { id: '5', name: 'Greek Yogurt (0%)', amount: '1kg tub', category: 'Dairy' },
];

export default function HomePage() {
  // Start with "today" selected so the user always lands on the most relevant day.
  const [selectedDow, setSelectedDow] = useState<number>(TODAY_DOW);
  const selectedDay = DEMO_WEEK.find((d) => d.dow === selectedDow) ?? DEMO_WEEK[0];

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
        {/* Horizontal weekly calendar (Mon–Sun) — click selects the day shown below */}
        <section className="-mx-4 overflow-x-auto px-4 pb-2 md:-mx-6 md:px-6">
          <div className="flex min-w-max gap-4">
            {DEMO_WEEK.map((d) => (
              <DayCard
                key={d.dow}
                weekday={d.weekday}
                dayOfMonth={d.dayOfMonth}
                kcal={d.kcal}
                isToday={d.isToday}
                meals={d.meals}
                active={selectedDow === d.dow}
                onClick={() => setSelectedDow(d.dow)}
              />
            ))}
          </div>
        </section>

        {/* Selected day's meals as large cards */}
        <section>
          <header className="mb-4 flex items-baseline justify-between">
            <h2 className="text-lg font-bold text-zinc-900 md:text-xl">
              {selectedDay.weekday}, {selectedDay.dayOfMonth} — meals
            </h2>
            {selectedDay.kcal && (
              <span className="text-sm text-zinc-500">
                {selectedDay.kcal.toLocaleString()} kcal total
              </span>
            )}
          </header>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {selectedDay.meals.map((m) => (
              <MealCardBig
                key={m.mealType}
                mealType={m.mealType}
                dow={selectedDay.dow}
                title={m.title}
                imageUrl={m.heroUrl}
                kcal={m.kcal}
                minutes={m.minutes}
              />
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
