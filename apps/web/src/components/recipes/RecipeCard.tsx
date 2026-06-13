'use client';

import Link from 'next/link';
import { useState, type MouseEvent } from 'react';
import { IconClock, IconFlame, IconHeart, IconHeartFilled, IconStar } from '../Icons';

export interface RecipeCardProps {
  id: string;
  title: string;
  imageUrl: string;
  /** Total prep+cook minutes. */
  minutes: number;
  kcal: number;
  /** Primary tag pill in the bottom-right of compact card. */
  tag?: string;
  /** Optional rating (e.g. 4.9) — only used in featured card. */
  rating?: number;
  /** Short description — only used in featured card. */
  description?: string;
  /** Extra chips overlayed on the image — only used in featured card. */
  chips?: string[];
  /**
   * Featured cards span 2 columns and 2 rows on md+; compact cards take a
   * single cell. Layout is driven by `gridClassName` so the parent stays in
   * charge of the bento math.
   */
  featured?: boolean;
  /** Pre-saved/bookmark state — caller can lift up if persistence needed. */
  bookmarked?: boolean;
}

/**
 * Recipe card. Two variants:
 *   - `featured = true` → tall card with description + rating + chips on image
 *   - `featured = false` (default) → compact card with title + meta + tag
 *
 * The whole card is a Link to `/recipes/{id}`. The heart button uses
 * `e.preventDefault()` to swallow the click so toggling the bookmark
 * doesn't also trigger navigation.
 */
export function RecipeCard({
  id,
  title,
  imageUrl,
  minutes,
  kcal,
  tag,
  rating,
  description,
  chips,
  featured,
  bookmarked: bookmarkedInitial,
}: RecipeCardProps) {
  const [bookmarked, setBookmarked] = useState(!!bookmarkedInitial);

  function toggleBookmark(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setBookmarked((b) => !b);
  }

  if (featured) {
    return (
      <Link
        href={`/recipes/${id}`}
        className="group col-span-1 flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg md:col-span-2 xl:row-span-2"
      >
        <div className="relative h-72 overflow-hidden md:h-96">
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <BookmarkButton large bookmarked={bookmarked} onClick={toggleBookmark} />
          {chips && chips.length > 0 && (
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 backdrop-blur-sm"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl font-bold leading-tight text-zinc-900 group-hover:text-emerald-700">
              {title}
            </h3>
            {rating != null && (
              <span className="flex items-center gap-1 text-sm font-semibold text-amber-500">
                <IconStar width={16} height={16} />
                {rating.toFixed(1)}
              </span>
            )}
          </div>
          {description && (
            <p className="line-clamp-2 text-sm text-zinc-600">{description}</p>
          )}
          <div className="mt-auto flex items-center gap-4 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
            <Meta minutes={minutes} kcal={kcal} />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/recipes/${id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <BookmarkButton bookmarked={bookmarked} onClick={toggleBookmark} />
      </div>
      <div className="p-4">
        <h3 className="truncate text-base font-bold text-zinc-900 group-hover:text-emerald-700">
          {title}
        </h3>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="text-xs text-zinc-500">
            {minutes} mins · {kcal} kcal
          </span>
          {tag && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              {tag}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function Meta({ minutes, kcal }: { minutes: number; kcal: number }) {
  return (
    <>
      <span className="flex items-center gap-1">
        <IconClock width={14} height={14} />
        {minutes} mins
      </span>
      <span className="flex items-center gap-1">
        <IconFlame width={14} height={14} />
        {kcal} kcal
      </span>
    </>
  );
}

function BookmarkButton({
  bookmarked,
  large,
  onClick,
}: {
  bookmarked: boolean;
  large?: boolean;
  onClick: (e: MouseEvent) => void;
}) {
  const size = large ? 40 : 32;
  const Icon = bookmarked ? IconHeartFilled : IconHeart;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={bookmarked ? 'Remove from favorites' : 'Add to favorites'}
      style={{ width: size, height: size }}
      className={
        'absolute right-3 top-3 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition-transform active:scale-90 ' +
        (bookmarked ? 'text-rose-500' : 'text-zinc-500 hover:text-rose-500')
      }
    >
      <Icon width={large ? 20 : 16} height={large ? 20 : 16} />
    </button>
  );
}
