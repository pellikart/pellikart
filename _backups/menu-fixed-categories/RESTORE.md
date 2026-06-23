# Backup — fixed-category catering menu (pre custom-categories change)

Snapshot taken 2026-06-23, before switching the menu builder from **fixed
categories + a curated dish bank** to **vendor-created categories + their own
dishes**.

## Why this exists
The user was undecided about whether every caterer follows the same menu
sections (Welcome Drinks, Desserts, etc.). We moved to free-form
categories/dishes but kept this snapshot so the decision is reversible.

## What changed in the live code
- `src/components/MenuBuilder.tsx` — **rewritten** to free-form (vendor types
  their own category names and dish names; no dish bank, no fixed sections).
- `src/components/MenuPicker.tsx` — **unchanged** (already rendered
  `customDishes`; still resolves legacy `dishIds` via the dish bank).
- `src/lib/dish-bank.ts` — **unchanged / still present** (used only by
  MenuPicker for backward-compat rendering of any legacy bank-based data).
- `src/lib/vendor-types.ts` `MenuSection` — **unchanged**. New menus store
  category name in `section` and dishes in `customDishes`; `dishIds` stays `[]`.

## How to restore the old fixed-category builder
1. Copy `MenuBuilder.tsx` from this folder back over
   `src/components/MenuBuilder.tsx`.
2. That's it — `MenuPicker.tsx` and `dish-bank.ts` were never removed, so the
   old builder will work against them again immediately.

`MenuPicker.tsx` and `dish-bank.ts` are copied here too purely as a
point-in-time reference.
