/**
 * Shared demo recipe catalogue for the web app.
 *
 *   Three pages currently consume this:
 *     - `/recipes`           (list view with featured bento + compact cards)
 *     - `/recipes/[id]`      (detail view with hero, nutrition, ingredients, steps)
 *     - `/shopping`          (Plan Overview rail — links back to detail)
 *
 *   When the real catalogue API ships, this file disappears in favour of
 *   `useQuery(['recipes'])` / `useQuery(['recipe', id])`. Until then,
 *   every page should import from here so a single edit propagates.
 */

export type DemoTag =
  | 'vegan'
  | 'vegetarian'
  | 'quick'
  | 'high-protein'
  | 'low-carb'
  | 'gluten-free'
  | 'breakfast'
  | 'desserts';

export type DisplayTagTone = 'primary' | 'tertiary';

export interface DemoIngredient {
  id: string;
  text: string;
}

export interface DemoStep {
  heading: string;
  body: string;
}

export interface DemoNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fiber: number;
}

export interface DemoRecipe {
  id: string;
  title: string;
  /** Short blurb shown on detail page + featured card. */
  description: string;
  /** Unsplash photo id; size params are appended on demand via `recipeImage`. */
  imagePhotoId: string;
  minutes: number;
  kcal: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  servings: number;
  /** Canonical machine-readable tags (used for filtering). */
  tags: DemoTag[];
  nutrition: DemoNutrition;
  ingredients: DemoIngredient[];
  steps: DemoStep[];
  chefTip?: string;
  /** Optional rating shown on the featured card. */
  rating?: number;
  /** Marks the bento hero on `/recipes`. Exactly one in the catalogue. */
  featured?: boolean;
}

/* ─── Tag presentation ────────────────────────────────────────────── */

const TAG_LABELS: Record<DemoTag, string> = {
  vegan: 'VEGAN',
  vegetarian: 'VEGETARIAN',
  quick: 'QUICK',
  'high-protein': 'HIGH PROTEIN',
  'low-carb': 'LOW CARB',
  'gluten-free': 'GF',
  breakfast: 'BREAKFAST',
  desserts: 'DESSERTS',
};

const TAG_TONES: Record<DemoTag, DisplayTagTone> = {
  vegan: 'primary',
  vegetarian: 'primary',
  'gluten-free': 'primary',
  'low-carb': 'primary',
  breakfast: 'primary',
  'high-protein': 'tertiary',
  quick: 'tertiary',
  desserts: 'tertiary',
};

export interface DisplayTag {
  label: string;
  tone: DisplayTagTone;
}

/** Map canonical tags onto display chips, optionally capped at `limit`. */
export function getDisplayTags(recipe: DemoRecipe, limit?: number): DisplayTag[] {
  const result = recipe.tags.map((t) => ({ label: TAG_LABELS[t], tone: TAG_TONES[t] }));
  return limit != null ? result.slice(0, limit) : result;
}

/** Title-cased single tag for the compact-card corner pill. */
export function getPrimaryTagLabel(recipe: DemoRecipe): string | undefined {
  const first = recipe.tags[0];
  if (!first) return undefined;
  // Convert TAG_LABELS["high-protein"] = "HIGH PROTEIN" → "High Protein".
  return TAG_LABELS[first]
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

/* ─── Image URLs ──────────────────────────────────────────────────── */

const UNSPLASH = 'https://images.unsplash.com';

/** Build a sized Unsplash URL from a photo id. */
export function recipeImage(photoId: string, w: number, h: number): string {
  return `${UNSPLASH}/${photoId}?w=${w}&h=${h}&fit=crop&q=80&auto=format`;
}

/* ─── Catalogue ───────────────────────────────────────────────────── */

export const DEMO_RECIPES: DemoRecipe[] = [
  {
    id: 'mediterranean-harvest-bowl',
    title: 'Mediterranean Harvest Bowl',
    description:
      'A vibrant, nourishing bowl that captures the essence of the Mediterranean. This recipe combines the earthy tones of massaged kale and quinoa with the sweet depth of roasted potatoes and the satisfying crunch of spiced chickpeas. Finished with a velvety tahini dressing, it’s a high-protein plant-based powerhouse perfect for meal prep or a quick weeknight dinner.',
    imagePhotoId: 'photo-1512621776951-a57141f2eefd',
    minutes: 25,
    kcal: 480,
    difficulty: 'Easy',
    servings: 1,
    tags: ['vegan', 'high-protein'],
    nutrition: { calories: 480, protein: 18, carbs: 52, fiber: 12 },
    ingredients: [
      { id: 'mhb-1', text: '1/2 cup Quinoa, cooked' },
      { id: 'mhb-2', text: '2 cups Fresh Kale, chopped' },
      { id: 'mhb-3', text: '1 large Sweet Potato, cubed' },
      { id: 'mhb-4', text: '1/2 cup Chickpeas, canned' },
      { id: 'mhb-5', text: '2 tbsp Tahini Dressing' },
    ],
    steps: [
      {
        heading: 'Preparation',
        body: 'Preheat your oven to 400°F (200°C). Toss cubed sweet potatoes and chickpeas with olive oil, salt, and smoked paprika. Spread on a baking sheet and roast for 20–25 minutes until tender and slightly crisp.',
      },
      {
        heading: 'Massage the Kale',
        body: 'While the potatoes roast, place chopped kale in a large bowl. Add a squeeze of lemon juice and a pinch of salt. Massage with your hands for 2 minutes until the leaves become soft and dark green.',
      },
      {
        heading: 'Assembly',
        body: 'In a serving bowl, start with a base of cooked quinoa. Layer the massaged kale on top. Add the roasted sweet potatoes and chickpeas in distinct sections for a beautiful presentation.',
      },
      {
        heading: 'The Finish',
        body: 'Drizzle generously with tahini dressing. Top with sesame seeds or red pepper flakes if desired. Serve warm or at room temperature.',
      },
    ],
    chefTip:
      'For extra creaminess, add half a mashed avocado to your kale while massaging. It adds healthy fats and makes the bowl even more satisfying!',
    rating: 4.9,
    featured: true,
  },
  {
    id: 'wild-basil-pesto-linguine',
    title: 'Wild Basil Pesto Linguine',
    description:
      'Handmade basil pesto, blended fresh with toasted pine nuts and aged parmesan, then tossed through al dente linguine. Bright, fragrant, and on the table in fifteen minutes.',
    imagePhotoId: 'photo-1473093295043-cdd812d0e601',
    minutes: 15,
    kcal: 320,
    difficulty: 'Easy',
    servings: 2,
    tags: ['quick', 'vegetarian'],
    nutrition: { calories: 320, protein: 11, carbs: 48, fiber: 4 },
    ingredients: [
      { id: 'wbp-1', text: '200g Linguine pasta' },
      { id: 'wbp-2', text: '2 cups Fresh basil leaves' },
      { id: 'wbp-3', text: '1/3 cup Pine nuts, toasted' },
      { id: 'wbp-4', text: '1/2 cup Parmesan, grated' },
      { id: 'wbp-5', text: '2 cloves Garlic' },
      { id: 'wbp-6', text: '1/3 cup Extra Virgin Olive Oil' },
    ],
    steps: [
      {
        heading: 'Boil the pasta',
        body: 'Bring a large pot of salted water to a rolling boil. Add the linguine and cook to al dente, about 9 minutes. Reserve 1/2 cup of pasta water before draining.',
      },
      {
        heading: 'Blend the pesto',
        body: 'In a food processor, pulse basil, pine nuts, parmesan, and garlic until coarsely chopped. With the motor running, slowly stream in olive oil until you get a loose paste.',
      },
      {
        heading: 'Toss & finish',
        body: 'Off heat, toss the drained linguine with the pesto, loosening with a splash of pasta water until silky. Taste and season with salt.',
      },
      {
        heading: 'Serve',
        body: 'Plate immediately, topped with extra parmesan and a few whole basil leaves.',
      },
    ],
    chefTip:
      'Reserve more pasta water than you think — its starch is what lets the pesto cling to every strand instead of pooling at the bottom of the bowl.',
  },
  {
    id: 'beet-goat-cheese-salad',
    title: 'Beet & Goat Cheese Salad',
    description:
      'Earthy roasted beets, creamy goat cheese, candied walnuts, and a bright citrus-honey vinaigrette tossed through peppery mixed greens.',
    imagePhotoId: 'photo-1540420773420-3366772f4999',
    minutes: 10,
    kcal: 210,
    difficulty: 'Easy',
    servings: 2,
    tags: ['vegetarian', 'gluten-free'],
    nutrition: { calories: 210, protein: 8, carbs: 18, fiber: 5 },
    ingredients: [
      { id: 'bgc-1', text: '2 medium Roasted beets, sliced' },
      { id: 'bgc-2', text: '60g Goat cheese, crumbled' },
      { id: 'bgc-3', text: '1/4 cup Walnuts, toasted' },
      { id: 'bgc-4', text: '4 cups Mixed greens' },
      { id: 'bgc-5', text: '1 tbsp Honey' },
      { id: 'bgc-6', text: '1 tbsp Lemon juice' },
    ],
    steps: [
      {
        heading: 'Build the base',
        body: 'Arrange the mixed greens across two plates, leaving the centre slightly mounded.',
      },
      {
        heading: 'Layer the beets',
        body: 'Tuck the beet slices into the greens, fanning them gently so each bite gets a forkful.',
      },
      {
        heading: 'Top & dress',
        body: 'Scatter the crumbled goat cheese and walnuts over the top. Whisk honey and lemon juice with a pinch of salt and drizzle across each plate.',
      },
    ],
    chefTip:
      'Warm the beets for 30 seconds in the microwave before plating — the residual heat softens the goat cheese into the leaves without wilting them.',
  },
  {
    id: 'lemon-glazed-salmon',
    title: 'Lemon Glazed Atlantic Salmon',
    description:
      'Pan-seared Atlantic salmon with a glossy lemon-butter sauce, finished with briny capers and torn dill.',
    imagePhotoId: 'photo-1467003909585-2f8a72700288',
    minutes: 20,
    kcal: 450,
    difficulty: 'Medium',
    servings: 2,
    tags: ['low-carb', 'high-protein'],
    nutrition: { calories: 450, protein: 38, carbs: 4, fiber: 0 },
    ingredients: [
      { id: 'lgs-1', text: '2 Salmon fillets, skin on (~180g each)' },
      { id: 'lgs-2', text: '1 Lemon, juiced + zested' },
      { id: 'lgs-3', text: '3 tbsp Unsalted butter' },
      { id: 'lgs-4', text: '2 tbsp Capers, drained' },
      { id: 'lgs-5', text: '2 tbsp Fresh dill, torn' },
      { id: 'lgs-6', text: '1 tbsp Olive oil' },
    ],
    steps: [
      {
        heading: 'Pat & season',
        body: 'Pat the fillets bone dry with paper towel — moisture is the enemy of a crisp skin. Season both sides with salt and pepper.',
      },
      {
        heading: 'Sear skin-side',
        body: 'Heat olive oil in a heavy pan until shimmering. Place the fillets skin-side down and DO NOT MOVE for 4 minutes. Flip and cook 2 more minutes.',
      },
      {
        heading: 'Build the glaze',
        body: 'Remove fish to a plate. Add butter, lemon juice, and capers to the same pan; swirl over low heat until the butter is glossy.',
      },
      {
        heading: 'Plate & finish',
        body: 'Spoon the warm glaze over the fillets, top with dill and lemon zest, and serve immediately.',
      },
    ],
    chefTip:
      'Cold fish from the fridge will steam, not sear. Take the fillets out 15 minutes before cooking so they hit the pan at room temperature.',
  },
  {
    id: 'moroccan-falafel-bowl',
    title: 'Moroccan Falafel Bowl',
    description:
      'Crispy chickpea falafel over fluffy couscous with cucumber-mint salad, pickled onions, and a bright tahini drizzle.',
    imagePhotoId: 'photo-1626700051175-6818013e1d4f',
    minutes: 15,
    kcal: 510,
    difficulty: 'Easy',
    servings: 4,
    tags: ['vegan', 'high-protein'],
    nutrition: { calories: 510, protein: 18, carbs: 64, fiber: 12 },
    ingredients: [
      { id: 'mfb-1', text: '2 cups Chickpeas, soaked overnight' },
      { id: 'mfb-2', text: '1 cup Couscous, dry' },
      { id: 'mfb-3', text: '1 Cucumber, diced' },
      { id: 'mfb-4', text: '1/4 cup Fresh mint, chopped' },
      { id: 'mfb-5', text: '3 tbsp Tahini' },
      { id: 'mfb-6', text: '1 Lemon, juiced' },
      { id: 'mfb-7', text: '1 tsp Ground cumin' },
    ],
    steps: [
      {
        heading: 'Blend the falafel',
        body: 'Pulse chickpeas, cumin, half the mint, and a generous pinch of salt in a food processor until grainy but holding together. Chill 15 minutes.',
      },
      {
        heading: 'Pan-fry',
        body: 'Form the mixture into 12 small patties. Pan-fry in a thin layer of oil over medium heat, 3 minutes per side, until deep golden.',
      },
      {
        heading: 'Cook the couscous',
        body: 'Bring 1¼ cups water to a boil with a pinch of salt. Stir in couscous, cover, and remove from heat for 5 minutes. Fluff with a fork.',
      },
      {
        heading: 'Build the bowl',
        body: 'Divide couscous between bowls. Top with falafel, cucumber-mint salad, and a generous drizzle of tahini whisked with lemon juice and water.',
      },
    ],
    chefTip:
      'Chilling the falafel mix is non-negotiable — it lets the starches set so the patties hold their shape instead of crumbling in the pan.',
  },
  {
    id: 'blueberry-almond-oats',
    title: 'Blueberry Almond Oats',
    description:
      'Steel-cut oats simmered with warm cinnamon and almond milk, finished with juicy blueberries, toasted almond slivers, and a thread of maple.',
    imagePhotoId: 'photo-1517673400267-0251440c45dc',
    minutes: 5,
    kcal: 280,
    difficulty: 'Easy',
    servings: 1,
    tags: ['quick', 'breakfast', 'vegetarian'],
    nutrition: { calories: 280, protein: 9, carbs: 42, fiber: 6 },
    ingredients: [
      { id: 'bao-1', text: '1/2 cup Rolled oats' },
      { id: 'bao-2', text: '1 cup Almond milk, unsweetened' },
      { id: 'bao-3', text: '1/2 cup Blueberries, fresh' },
      { id: 'bao-4', text: '2 tbsp Sliced almonds, toasted' },
      { id: 'bao-5', text: '1/4 tsp Ground cinnamon' },
      { id: 'bao-6', text: '1 tbsp Maple syrup' },
    ],
    steps: [
      {
        heading: 'Simmer the milk',
        body: 'Bring almond milk to a gentle simmer in a small saucepan with the cinnamon — don’t let it boil.',
      },
      {
        heading: 'Stir in oats',
        body: 'Add the oats and reduce heat to low. Cook 3 minutes, stirring occasionally, until creamy.',
      },
      {
        heading: 'Top & drizzle',
        body: 'Pour into a bowl. Top with blueberries and toasted almonds, then drizzle the maple syrup across.',
      },
    ],
    chefTip:
      'Toast the almonds in a dry pan for 2 minutes before serving — the oils bloom into a nutty fragrance that lifts the whole bowl.',
  },
  {
    id: 'golden-chickpea-curry',
    title: 'Golden Chickpea Curry',
    description:
      'Warming chickpea curry simmered in a turmeric-coconut sauce with fresh ginger and ripe tomatoes, finished with cilantro and a squeeze of lime.',
    imagePhotoId: 'photo-1455619452474-d2be8b1e70cd',
    minutes: 35,
    kcal: 420,
    difficulty: 'Medium',
    servings: 4,
    tags: ['vegan', 'gluten-free'],
    nutrition: { calories: 420, protein: 14, carbs: 52, fiber: 11 },
    ingredients: [
      { id: 'gcc-1', text: '2 cans Chickpeas, drained' },
      { id: 'gcc-2', text: '1 can Coconut milk, full-fat' },
      { id: 'gcc-3', text: '3 medium Tomatoes, chopped' },
      { id: 'gcc-4', text: '1 Onion, diced' },
      { id: 'gcc-5', text: '1 tbsp Fresh ginger, grated' },
      { id: 'gcc-6', text: '1 tsp Ground turmeric' },
      { id: 'gcc-7', text: '1 tsp Ground cumin' },
      { id: 'gcc-8', text: '1 bunch Cilantro, chopped' },
    ],
    steps: [
      {
        heading: 'Sweat the aromatics',
        body: 'Heat oil in a wide pan over medium. Sauté onion 5 minutes until translucent, then add ginger and cook 1 minute more.',
      },
      {
        heading: 'Bloom the spices',
        body: 'Stir in turmeric and cumin. Toast 30 seconds — your nose will tell you when it’s ready.',
      },
      {
        heading: 'Simmer',
        body: 'Add tomatoes and a pinch of salt; cook 5 minutes until they break down. Stir in coconut milk and chickpeas. Simmer 20 minutes, partially covered.',
      },
      {
        heading: 'Finish',
        body: 'Off heat, stir in half the cilantro and a squeeze of lime. Taste and adjust salt. Serve over rice or with naan, garnished with the remaining cilantro.',
      },
    ],
    chefTip:
      'Blooming the dry spices in hot oil before adding any liquid is the single biggest flavour upgrade you can make to a home curry. Don’t skip it.',
  },
];

/* ─── Lookups ─────────────────────────────────────────────────────── */

const byId = new Map<string, DemoRecipe>(DEMO_RECIPES.map((r) => [r.id, r]));

/** Resolve a recipe by id, or `undefined` if unknown. */
export function getRecipeById(id: string): DemoRecipe | undefined {
  return byId.get(id);
}
