import { Button, Card } from '@dishday/ui';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-start gap-8 px-6 py-16">
      <header>
        <h1 className="text-4xl font-bold tracking-tight">Dishday</h1>
        <p className="mt-2 text-zinc-600">
          AI-powered weekly meal plans, smart shopping lists, and nutrition that fits your goals.
        </p>
      </header>

      <Card className="w-full">
        <h2 className="text-lg font-semibold">Get started</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Sign up to generate your first AI meal plan for the week.
        </p>
        <div className="mt-4 flex gap-2">
          <Button>Generate meal plan</Button>
          <Button variant="secondary">Browse recipes</Button>
        </div>
      </Card>
    </main>
  );
}
