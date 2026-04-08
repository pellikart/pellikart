import { create } from "zustand";
import { AppState, SubscriptionTier, OnboardingData, Design } from "./types";
import { mockVendors, mockRitualBoards, generateBoardsFromOnboarding, getVendorPriceScale, mockDesigns } from "./mock-data";

function cloneVendors() {
  const cloned: Record<string, typeof mockVendors[string]> = {};
  for (const [k, v] of Object.entries(mockVendors)) {
    cloned[k] = { ...v, likes: v.likes.map((l) => ({ ...l })) };
  }
  return cloned;
}

function cloneBoards() {
  return mockRitualBoards.map((b) => ({
    ...b,
    categories: b.categories.map((c) => ({
      ...c,
      shortlistedVendorIds: [...c.shortlistedVendorIds],
      suggestedVendors: c.suggestedVendors.map((s) => ({ ...s })),
    })),
  }));
}

function maxTrialsForTier(tier: SubscriptionTier): number {
  if (tier === 'gold') return 3;
  if (tier === 'silver') return 1;
  return 0;
}

export const useStore = create<AppState>((set, get) => ({
  role: 'none',
  onboardingComplete: false,
  onboardingData: null,
  subscription: 'free',
  vendors: cloneVendors(),
  ritualBoards: cloneBoards(),
  milestoneProgress: {},
  trialSessions: {},
  trialsUsed: {},

  setRole: (role) => set({ role }),

  completeOnboarding: (data) => {
    const boards = generateBoardsFromOnboarding(data);
    const scale = getVendorPriceScale(boards, data.budget);

    // Scale all vendor prices so the total of selected vendors ≈ budget
    const scaledVendors = cloneVendors();
    for (const key of Object.keys(scaledVendors)) {
      scaledVendors[key].price = Math.round(scaledVendors[key].price * scale);
    }

    // Register designs as vendor entries so they show on ritual boards
    for (const design of mockDesigns) {
      const parentVendor = scaledVendors[design.vendorId] || mockVendors[design.vendorId];
      scaledVendors[design.id] = {
        id: design.id,
        code: design.name,
        name: `${design.name} by ${parentVendor?.name || 'Vendor'}`,
        photo: design.photo,
        style: design.style,
        area: parentVendor?.area || '',
        capacity: parentVendor?.capacity,
        price: Math.round(design.price * scale),
        rating: design.rating,
        packageTier: design.description,
        likes: [],
        booked: false,
        amountPaid: 0,
      };
    }

    set({
      onboardingComplete: true,
      onboardingData: data,
      ritualBoards: boards,
      vendors: scaledVendors,
    });
  },

  subscribe: (tier) => set({ subscription: tier }),

  getMaxTrials: () => maxTrialsForTier(get().subscription),

  selectVendor: (ritualId, categoryId, vendorId) =>
    set((s) => ({
      ritualBoards: s.ritualBoards.map((b) =>
        b.id === ritualId
          ? { ...b, categories: b.categories.map((c) => c.id === categoryId ? { ...c, selectedVendorId: vendorId } : c) }
          : b
      ),
    })),

  addToShortlist: (ritualId, categoryId, vendorId) =>
    set((s) => ({
      ritualBoards: s.ritualBoards.map((b) =>
        b.id === ritualId
          ? { ...b, categories: b.categories.map((c) =>
              c.id === categoryId && !c.shortlistedVendorIds.includes(vendorId)
                ? { ...c, shortlistedVendorIds: [...c.shortlistedVendorIds, vendorId] }
                : c
            ) }
          : b
      ),
    })),

  removeFromShortlist: (ritualId, categoryId, vendorId) =>
    set((s) => ({
      ritualBoards: s.ritualBoards.map((b) =>
        b.id === ritualId
          ? { ...b, categories: b.categories.map((c) =>
              c.id === categoryId
                ? { ...c, shortlistedVendorIds: c.shortlistedVendorIds.filter((id) => id !== vendorId), selectedVendorId: c.selectedVendorId === vendorId ? null : c.selectedVendorId }
                : c
            ) }
          : b
      ),
    })),

  toggleLike: (vendorId, userName, userId) =>
    set((s) => {
      const vendor = s.vendors[vendorId];
      if (!vendor) return s;
      const alreadyLiked = vendor.likes.some((l) => l.userId === userId);
      return {
        vendors: { ...s.vendors, [vendorId]: { ...vendor, likes: alreadyLiked ? vendor.likes.filter((l) => l.userId !== userId) : [...vendor.likes, { userId, name: userName }] } },
      };
    }),

  removeCategory: (ritualId, categoryId) =>
    set((s) => ({
      ritualBoards: s.ritualBoards.map((b) =>
        b.id === ritualId
          ? { ...b, categories: b.categories.map((c) => c.id === categoryId ? { ...c, removed: true } : c) }
          : b
      ),
    })),

  bookVendor: (vendorId, amount) =>
    set((s) => ({
      vendors: { ...s.vendors, [vendorId]: { ...s.vendors[vendorId], booked: true, amountPaid: amount } },
      milestoneProgress: { ...s.milestoneProgress, [vendorId]: 1 },
    })),

  bookAllVendors: (ritualId) => {
    const state = get();
    const board = state.ritualBoards.find((b) => b.id === ritualId);
    if (!board) return;
    const updatedVendors = { ...state.vendors };
    const updatedProgress = { ...state.milestoneProgress };
    for (const cat of board.categories) {
      if (cat.selectedVendorId && !cat.removed) {
        const v = updatedVendors[cat.selectedVendorId];
        if (v && !v.booked) {
          const amount = Math.round(v.price * 0.04);
          updatedVendors[cat.selectedVendorId] = { ...v, booked: true, amountPaid: amount };
          updatedProgress[cat.selectedVendorId] = 1;
        }
      }
    }
    set({ vendors: updatedVendors, milestoneProgress: updatedProgress });
  },

  swapVendor: (ritualId, categoryId, newVendorId) =>
    set((s) => ({
      ritualBoards: s.ritualBoards.map((b) =>
        b.id === ritualId
          ? { ...b, categories: b.categories.map((c) =>
              c.id === categoryId
                ? { ...c, selectedVendorId: newVendorId, shortlistedVendorIds: c.shortlistedVendorIds.includes(newVendorId) ? c.shortlistedVendorIds : [...c.shortlistedVendorIds, newVendorId] }
                : c
            ) }
          : b
      ),
    })),

  completeMilestone: (vendorId, totalMilestones) =>
    set((s) => {
      const current = s.milestoneProgress[vendorId] || 0;
      if (current >= totalMilestones) return s;
      return { milestoneProgress: { ...s.milestoneProgress, [vendorId]: current + 1 } };
    }),

  updateBoardDates: (ritualId, dateStart, dateEnd, removeVendorIds) =>
    set((s) => ({
      ritualBoards: s.ritualBoards.map((b) =>
        b.id === ritualId
          ? {
              ...b,
              dateStart: dateStart || undefined,
              dateEnd: dateEnd || undefined,
              categories: b.categories.map((c) => {
                if (c.selectedVendorId && removeVendorIds.includes(c.selectedVendorId)) {
                  return { ...c, selectedVendorId: null };
                }
                return c;
              }),
            }
          : b
      ),
    })),

  requestTrial: (ritualId, categoryId, vendorId, date, time) =>
    set((s) => {
      const catKey = `${ritualId}-${categoryId}`;
      const trialKey = `${ritualId}-${categoryId}-${vendorId}`;
      const used = s.trialsUsed[catKey] || 0;
      const max = maxTrialsForTier(s.subscription);
      if (used >= max) return s;
      if (s.trialSessions[trialKey]) return s;

      const board = s.ritualBoards.find((b) => b.id === ritualId);
      const cat = board?.categories.find((c) => c.id === categoryId);

      return {
        trialSessions: {
          ...s.trialSessions,
          [trialKey]: {
            status: 'requested' as const,
            requestedDate: date,
            requestedTime: time,
            scheduledDate: date,
            scheduledTime: time,
            vendorId,
            categoryLabel: cat?.label || '',
            ritualName: board?.name || '',
          },
        },
        trialsUsed: { ...s.trialsUsed, [catKey]: used + 1 },
      };
    }),

  acceptTrial: (ritualId, categoryId, vendorId) =>
    set((s) => {
      const trialKey = `${ritualId}-${categoryId}-${vendorId}`;
      const trial = s.trialSessions[trialKey];
      if (!trial || trial.status !== 'requested') return s;
      return {
        trialSessions: { ...s.trialSessions, [trialKey]: { ...trial, status: 'accepted' as const } },
      };
    }),

  proposeNewTrialTime: (ritualId, categoryId, vendorId, newDate, newTime) =>
    set((s) => {
      const trialKey = `${ritualId}-${categoryId}-${vendorId}`;
      const trial = s.trialSessions[trialKey];
      if (!trial || trial.status !== 'requested') return s;
      return {
        trialSessions: {
          ...s.trialSessions,
          [trialKey]: { ...trial, status: 'rescheduled' as const, vendorProposedDate: newDate, vendorProposedTime: newTime },
        },
      };
    }),

  confirmReschedule: (ritualId, categoryId, vendorId) =>
    set((s) => {
      const trialKey = `${ritualId}-${categoryId}-${vendorId}`;
      const trial = s.trialSessions[trialKey];
      if (!trial || trial.status !== 'rescheduled') return s;
      return {
        trialSessions: {
          ...s.trialSessions,
          [trialKey]: {
            ...trial,
            status: 'confirmed' as const,
            scheduledDate: trial.vendorProposedDate || trial.scheduledDate,
            scheduledTime: trial.vendorProposedTime || trial.scheduledTime,
          },
        },
      };
    }),

  markTrialDone: (ritualId, categoryId, vendorId) =>
    set((s) => {
      const trialKey = `${ritualId}-${categoryId}-${vendorId}`;
      const trial = s.trialSessions[trialKey];
      if (!trial) return s;
      return {
        trialSessions: { ...s.trialSessions, [trialKey]: { ...trial, status: 'done' as const } },
      };
    }),

  addDesignAsVendor: (design) =>
    set((s) => {
      if (s.vendors[design.id]) return s; // already exists
      const parentVendor = s.vendors[design.vendorId] || mockVendors[design.vendorId];
      return {
        vendors: {
          ...s.vendors,
          [design.id]: {
            id: design.id,
            code: design.name,
            name: `${design.name} by ${parentVendor?.name || 'Vendor'}`,
            photo: design.photo,
            style: design.style,
            area: parentVendor?.area || '',
            capacity: parentVendor?.capacity,
            price: design.price,
            rating: design.rating,
            packageTier: design.description,
            likes: [],
            booked: false,
            amountPaid: 0,
          },
        },
      };
    }),

  addRitualBoard: (name, dateStart, dateEnd) =>
    set((s) => {
      const id = `r-${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
      const defaultCats = ["Venue", "Catering", "Decor", "Photography", "Makeup", "DJ / Music"];
      return {
        ritualBoards: [
          ...s.ritualBoards,
          {
            id,
            name,
            dateStart,
            dateEnd: dateEnd !== dateStart ? dateEnd : undefined,
            categories: defaultCats.map((label) => ({
              id: `${id}-c-${label.toLowerCase().replace(/[\s\/]+/g, "-")}`,
              label,
              selectedVendorId: null,
              shortlistedVendorIds: [],
              suggestedVendors: [],
              removed: false,
            })),
          },
        ],
      };
    }),
}));
