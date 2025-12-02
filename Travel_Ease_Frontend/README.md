# TravelEase Frontend

React 19 + TypeScript frontend for TravelEase, built with Vite.

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** for bundling and dev server
- **React Router 7** for routing
- **Tailwind CSS 4** for styling
- **TanStack Query (React Query)** for server state management
- **Axios** for HTTP requests
- **Supabase Auth** for authentication

---

## TanStack Query Usage

We use [TanStack Query](https://tanstack.com/query/latest) (formerly React Query) for all server state: fetching, caching, synchronising, and updating remote data.

### File Structure

```
src/
├── lib/
│   ├── queryClient.ts      # QueryClient instance with defaults
│   └── queryKeys.ts        # Centralised query key factories
├── features/
│   ├── blogs/
│   │   └── queries.ts      # useBlogOverview, useBlogDetail, etc.
│   ├── travelPlans/
│   │   └── queries.ts      # useOngoingPlans, usePublicPlans, etc.
│   ├── businesses/
│   │   └── queries.ts      # useBusinessList, useBusinessDetail, etc.
│   └── favorites/
│       ├── queries.ts      # useFavorites
│       └── mutations.ts    # useAddFavorite, useRemoveFavorite
└── services/
    └── api.ts              # Axios instance + domain API helpers
```

### Adding a New Query

1. **Define query keys** in `src/lib/queryKeys.ts`:

```ts
export const exampleKeys = {
  all: ["examples"] as const,
  lists: () => [...exampleKeys.all, "list"] as const,
  list: (params?: ExampleParams) => [...exampleKeys.lists(), params] as const,
  details: () => [...exampleKeys.all, "detail"] as const,
  detail: (id: string | number) => [...exampleKeys.details(), id] as const,
};
```

2. **Create a query hook** in `src/features/<domain>/queries.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { exampleApi } from "../../services/api";
import { exampleKeys } from "../../lib/queryKeys";

export function useExampleDetail(id: string | undefined) {
  return useQuery({
    queryKey: exampleKeys.detail(id ?? ""),
    queryFn: () => exampleApi.getById(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 60, // 60 seconds
  });
}
```

3. **Consume in a component**:

```tsx
const { data, isLoading, isError, error, refetch } = useExampleDetail(id);
```

### Adding a New Mutation

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { exampleApi } from "../../services/api";
import { exampleKeys } from "../../lib/queryKeys";

export function useCreateExample() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateExamplePayload) => exampleApi.create(payload),
    onSuccess: () => {
      // Invalidate list queries so they refetch
      queryClient.invalidateQueries({ queryKey: exampleKeys.lists() });
    },
  });
}
```

### Defaults

Configured in `src/lib/queryClient.ts`:

| Option                 | Value                              |
| ---------------------- | ---------------------------------- |
| `staleTime`            | 30 seconds                         |
| `gcTime`               | 5 minutes                          |
| `retry`                | 2 (queries), 0 (mutations)         |
| `refetchOnWindowFocus` | `true` in production, `false` dev  |

Override per-hook via the options object.

### React Query Devtools

Devtools are included in development builds only. To open:

1. Run the app with `npm run dev`.
2. Look for the floating React Query logo in the bottom-left corner.
3. Click to expand and inspect queries, cache, and invalidations.

---

## Manual Test Checklist

After making changes to query hooks or migrated pages, verify:

- [ ] **Blogs page** (`/blogs`) loads overview data; spinner shows during fetch.
- [ ] **Blog detail** (`/blogs/:slug`) loads correct blog; 404 shown for invalid slug.
- [ ] **Plans dashboard** (`/plans`) shows ongoing, previous, and public plans.
- [ ] **Favorites page** shows user's favorites; remove button triggers optimistic update.
- [ ] Navigating away and back uses cached data (no spinner if still fresh).
- [ ] React Query Devtools show expected query keys and cache entries.
- [ ] After a mutation (e.g., remove favorite), related queries refetch automatically.

---

## Development

```bash
# Install dependencies
npm install

# Start dev server (default port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test
```

---

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
