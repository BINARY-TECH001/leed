# Architectural Blueprint & Design System Specification

> **Version:** 2.0  
> **Audience:** AI Engineers, Senior Software Engineers, and Technical Leads  
> **Purpose:** Standalone, definitive reference guide for scaffolding and building new applications that replicate the backend architecture, monorepo folder structure, and mobile/web design systems of this ecosystem.

---

## Table of Contents
1. [Core Principles & Architectural Philosophy](#1-core-principles--architectural-philosophy)
2. [Monorepo Structure & Package Management](#2-monorepo-structure--package-management)
3. [Complete Directory Tree & Responsibilities](#3-complete-directory-tree--responsibilities)
4. [Backend Architecture & Engineering Standards](#4-backend-architecture--engineering-standards)
   - [Layered Architecture Pattern](#41-layered-architecture-pattern)
   - [ACID Financial Ledger & Escrow Vault Rules](#42-acid-financial-ledger--escrow-vault-rules)
   - [Event-Driven Search Invalidation](#43-event-driven-search-invalidation)
   - [Authentication & Token Rotation Lifecycle](#44-authentication--token-rotation-lifecycle)
   - [Real-Time WebSocket & Redis Architecture](#45-real-time-websocket--redis-architecture)
5. [Mobile Design System & Architecture (React Native / Expo)](#5-mobile-design-system--architecture-react-native--expo)
   - [File-Based Routing (Expo Router)](#51-file-based-routing-expo-router)
   - [Master Mobile Design Tokens](#52-master-mobile-design-tokens)
   - [Atomic UI Component Conventions](#53-atomic-ui-component-conventions)
   - [Offline-First Data Layer (React Query + AsyncStorage)](#54-offline-first-data-layer-react-query--asyncstorage)
   - [Theme Engine](#55-theme-engine)
6. [Web Design System & Architecture (React 19 / Tailwind / Radix)](#6-web-design-system--architecture-react-19--tailwind--radix)
   - [HSL Token System & Theme Synchronization](#61-hsl-token-system--theme-synchronization)
   - [Radix UI / Shadcn Component Pattern](#62-radix-ui--shadcn-component-pattern)
   - [Client-Side Auto-Refresh Queue](#63-client-side-auto-refresh-queue)
7. [Cross-Platform Token Translation Matrix](#7-cross-platform-token-translation-matrix)
8. [Master Directive Prompt for AI Engineers](#8-master-directive-prompt-for-ai-engineers)

---

## 1. Core Principles & Architectural Philosophy

When implementing systems under this architecture, you must strictly uphold the following rules:

1. **Monorepo Cohesion**: Backend, Web, and Mobile share unified domain models, API schemas, and brand tokens while retaining native platform idioms.
2. **Layered Separation of Concerns**: Routes declare endpoints and guards; Controllers validate input and handle HTTP transport; Services execute domain algorithms; Data Access manages persistence. No business logic in route files.
3. **Financial Invariance & Zero Floating-Point Math**: All currencies are represented in integer minor units (e.g. Kobo / Cents) or database `Decimal(12, 2)`. Financial balance mutations **MUST** execute inside atomic PostgreSQL transactions (`prisma.$transaction`) with strict double-entry ledger auditing.
4. **Offline Resilience on Mobile**: The mobile app must operate reliably on unstable network connections using TanStack Query cache persistence backed by AsyncStorage.
5. **Exact Design Token Parity**: The web CSS HSL tokens and mobile TypeScript constants are 1-to-1 mirrors of each other. The typeface across both platforms is strictly **Outfit**.

---

## 2. Monorepo Structure & Package Management

The workspace is powered by **pnpm workspaces** (`pnpm@9.15+`).

### `pnpm-workspace.yaml`
```yaml
packages:
  - apps/*
  - services/*
  - packages/*

nodeLinker: hoisted
```

### Root `package.json`
```json
{
  "name": "enterprise-monorepo",
  "private": true,
  "packageManager": "pnpm@9.15.0",
  "scripts": {
    "dev:backend": "pnpm --filter @project/backend dev",
    "build:backend": "pnpm --filter @project/backend build",
    "dev:web": "pnpm --filter web dev",
    "build:web": "pnpm --filter web build",
    "dev:mobile": "pnpm --filter mobile start",
    "lint": "pnpm -r run lint"
  }
}
```

---

## 3. Complete Directory Tree & Responsibilities

```
<project-root>/
├── pnpm-workspace.yaml
├── package.json
│
├── apps/
│   ├── backend/                         # Core API Service
│   │   ├── prisma/
│   │   │   └── schema.prisma            # PostgreSQL Schema & Relations
│   │   ├── src/
│   │   │   ├── controllers/             # Request handlers (extracts params, calls services/db)
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── wallet.controller.ts
│   │   │   │   ├── marketplace.controller.ts
│   │   │   │   ├── session.controller.ts
│   │   │   │   └── admin.controller.ts
│   │   │   ├── middleware/              # Guards & Interceptors
│   │   │   │   ├── auth.middleware.ts   # JWT extraction & role validation
│   │   │   │   ├── admin.middleware.ts  # Admin RBAC enforcement
│   │   │   │   └── rateLimiter.middleware.ts
│   │   │   ├── routes/                  # Express route definitions
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── wallet.routes.ts
│   │   │   │   └── marketplace.routes.ts
│   │   │   ├── services/                # Reusable business logic
│   │   │   │   ├── ai.service.ts        # Google Gemini AI integrations
│   │   │   │   ├── notification.service.ts
│   │   │   │   └── search/              # Inverted index & search invalidators
│   │   │   ├── utils/                   # Helpers & shared singletons
│   │   │   │   ├── prisma.ts            # Prisma client instance with query hooks
│   │   │   │   ├── redis.ts             # Redis client and key management
│   │   │   │   ├── paystack.ts          # Payment gateway API wrapper
│   │   │   │   ├── validation.ts        # Zod input schemas
│   │   │   │   └── email.ts             # Transactional email service
│   │   │   ├── types/                   # Express augmentations & DTO interfaces
│   │   │   ├── socket.ts                # Socket.IO room handling & real-time messaging
│   │   │   └── index.ts                 # Express bootstrap & HTTP server entry
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── mobile/                          # iOS & Android React Native App
│   │   ├── app/                         # Expo Router file-based screen tree
│   │   │   ├── (tabs)/                  # Bottom tab layout & persistent screens
│   │   │   │   ├── _layout.tsx
│   │   │   │   ├── index.tsx            # Home Dashboard
│   │   │   │   ├── marketplace.tsx
│   │   │   │   └── wallet.tsx
│   │   │   ├── _layout.tsx              # Root Stack Layout & Global Providers
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   └── [feature]/               # Sub-features & Modal screens
│   │   ├── components/
│   │   │   ├── ui/                      # Atomic Primitives (Button, Card, Badges, Sheets)
│   │   │   └── [domain]/                # Domain components (commerce, requests, wallet)
│   │   ├── constants/
│   │   │   ├── theme.ts                 # Master Tokens: COLORS, FONTS, SPACING, RADII
│   │   │   └── Config.ts                # API URLs and environment configs
│   │   ├── context/                     # React Context State Engines
│   │   │   ├── AuthContext.tsx          # User session, JWT tokens, login/logout
│   │   │   ├── ThemeContext.tsx         # System / Light / Dark switching
│   │   │   ├── RoleContext.tsx          # Persona switching (Buyer vs Seller vs Tutor)
│   │   │   └── CartContext.tsx
│   │   ├── services/
│   │   │   ├── api.ts                   # Axios client with JWT auto-refresh queue
│   │   │   └── queryClient.ts           # React Query client with AsyncStorage persister
│   │   ├── tailwind.config.js           # NativeWind preset & theme mappings
│   │   └── package.json
│   │
│   └── web/                             # React 19 / Next.js Web App
│       ├── src/
│       │   ├── components/
│       │   │   ├── ui/                  # Radix UI + Tailwind Primitives (Shadcn style)
│       │   │   └── [domain]/            # Domain widgets & layouts
│       │   ├── contexts/                # Web contexts (RoleContext, CartContext, Socket)
│       │   ├── lib/
│       │   │   ├── api.ts               # Web Axios client with 401 retry queue
│       │   │   └── utils.ts             # cn() utility (clsx + tailwind-merge)
│       │   ├── index.css                # CSS Variables (HSL) for Light & Dark mode
│       │   ├── tailwind.config.ts       # Design system tokens configured for Tailwind
│       │   └── App.tsx                  # Router root & view providers
│       ├── index.html
│       └── package.json
```

---

## 4. Backend Architecture & Engineering Standards

### 4.1 Layered Architecture Pattern

Every backend feature adheres to strict unidirectional flow:

```
Request ──> Route ──> Middleware (Auth/Role/RateLimit) ──> Controller (Zod Validation)
               │                                                  │
               └─────────────────────── Services <────────────────┘
                                           │
                                           ▼
                                    Prisma Database
```

#### 1. Route Layer (`src/routes/wallet.routes.ts`)
```typescript
import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { getWallet, initializeFunding, verifyFunding } from "../controllers/wallet.controller.js";

const router = Router();

router.get("/", authenticateToken, getWallet);
router.post("/fund", authenticateToken, initializeFunding);
router.post("/verify", authenticateToken, verifyFunding);

export default router;
```

#### 2. Controller Layer (`src/controllers/wallet.controller.ts`)
```typescript
import { Request, Response } from "express";
import prisma from "../utils/prisma.js";
import { fundWalletSchema } from "../utils/validation.js";
import { initializeTransaction } from "../utils/paystack.js";

export const initializeFunding = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!userId || !userEmail) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // 1. Zod Validation
    const { amount } = fundWalletSchema.parse(req.body);

    // 2. Delegate to Gateway/Service
    const paymentData = await initializeTransaction(userEmail, amount);

    // 3. Return Standardized JSON
    res.json({
      message: "Payment initialized",
      authorization_url: paymentData.authorization_url,
      reference: paymentData.reference,
      access_code: paymentData.access_code,
    });
  } catch (error: any) {
    console.error("❌ Initialize funding error:", error);
    res.status(400).json({ error: error.message || "Failed to initialize payment" });
  }
};
```

---

### 4.2 ACID Financial Ledger & Escrow Vault Rules

All financial mutations are governed by three mandatory mathematical and transactional invariants:

1. **Zero Floating-Point Math**:
   - Store monetary values using `Decimal(12, 2)` or integer minor units (Kobo / Cents).
   - Calculate fees and amounts with explicit rounding:
     ```typescript
     const creditedAmount = Math.round(netAmount * 100) / 100;
     ```
2. **Atomic Interactive Transactions (`prisma.$transaction`)**:
   - Both the ledger entry creation and the balance update **MUST** execute in the same atomic transaction.
3. **Strict Double-Entry Audit Invariant**:
   - Every transaction row records `balanceBefore` and `balanceAfter` verifying:
     $$\text{balanceAfter} = \text{balanceBefore} \pm \text{amount}$$

#### Canonical Escrow Settlement Implementation:
```typescript
const result = await prisma.$transaction(async (tx) => {
  const wallet = await tx.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new Error("Wallet not found");

  const balanceBefore = Number(wallet.balance);
  const balanceAfter = balanceBefore + creditedAmount;

  // 1. Immutable Ledger Record
  const transaction = await tx.transaction.create({
    data: {
      walletId: wallet.id,
      type: "CREDIT",
      amount: creditedAmount,
      balanceBefore,
      balanceAfter,
      description: "Escrow Release Settlement",
      status: "COMPLETED",
      reference: verification.reference,
      metadata: { grossAmount, fee: platformFee },
    },
  });

  // 2. Atomic Balance Adjustment
  await tx.wallet.update({
    where: { id: wallet.id },
    data: {
      balance: { increment: creditedAmount },
    },
  });

  return transaction;
});
```

---

### 4.3 Event-Driven Search Invalidation

The backend binds a query lifecycle middleware to Prisma (`prisma.$use`). On any write mutation to core domain entities, it dispatches an asynchronous, non-blocking invalidation job to Redis to ensure search indices stay synchronized without slowing down client write latencies:

```typescript
prisma.$use(async (params, next) => {
  const result = await next(params);
  const { model, action } = params;

  if (model && ["create", "update", "delete", "upsert"].includes(action)) {
    import("../services/search/search-invalidation.service.js")
      .then(({ SearchInvalidationService }) => {
        if (model === "Product") {
          const id = params.args?.where?.id || result?.id;
          if (id) SearchInvalidationService.onProductChange(id).catch(console.error);
        } else if (model === "Session") {
          const id = params.args?.where?.id || result?.id;
          if (id) SearchInvalidationService.onSessionChange(id).catch(console.error);
        }
      })
      .catch((err) => console.error("❌ Search Invalidation Hook Error:", err));
  }

  return result;
});
```

---

### 4.4 Authentication & Token Rotation Lifecycle

- **Access Token**: Short-lived JWT (`15m` – `1h`), signed with `JWT_SECRET`. Contains `{ id, email, role }`. Passed via `Authorization: Bearer <token>`.
- **Refresh Token**: Long-lived token (`30d`), stored hashed in the `RefreshToken` database table. Passed via `x-refresh-token` header or secure cookie.
- **Client Auto-Refresh Queue Pattern**: Both web and mobile Axios instances trap `401 Unauthorized` responses, queue subsequent API calls in a retry list, invoke `/api/auth/refresh-token` once, update the Authorization header with the new token, and replay all queued requests seamlessly.

---

### 4.5 Real-Time WebSocket & Redis Architecture

- **Socket.IO (`src/socket.ts`)**: Manages real-time rooms (`user:<userId>`, `session:<sessionId>`, `workspace:<workspaceId>`).
- **Redis (`src/utils/redis.ts`)**: Used for:
  1. Distributed cache of frequently read lists (categories, featured items).
  2. Transient active user heartbeat tracking.
  3. Search indexing and rate limiting counters.

---

## 5. Mobile Design System & Architecture (React Native / Expo)

### 5.1 File-Based Routing (Expo Router)

The mobile application utilizes **Expo Router** (`expo-router` ~57) for filesystem-based navigation:
- `app/_layout.tsx`: Root providers (`ThemeProvider`, `AuthContext`, `QueryClientProvider`, `SafeAreaProvider`, `GestureHandlerRootView`).
- `app/(tabs)/_layout.tsx`: Bottom tab bar navigation.
- `app/[modal].tsx`: Stack modals with `presentation: "modal"` options.

---

### 5.2 Master Mobile Design Tokens ([`apps/mobile/constants/theme.ts`](file:///Users/mac/Documents/PadeeSpace/apps/mobile/constants/theme.ts))

```typescript
export const LIGHT_COLORS = {
  primary: "#14213D",       // Deep Executive Navy
  secondary: "#0077B6",     // Ocean Blue
  accent: "#FF6600",        // Vibrant Brand Orange
  background: "#F7F8FA",    // Clean Off-White Canvas
  card: "#FFFFFF",          // Pure White Surface
  surface: "#FFFFFF",
  text: "#14213D",          // High-contrast Navy Text
  textMuted: "#6B7280",     // Neutral Slate Muted
  textSecondary: "#4B5563",
  border: "#E5E7EB",        // Neutral Divider Line
  success: "#10B981",       // Escrow Verified Green
  warning: "#F59E0B",       // Action Amber
  error: "#EF4444",         // Crimson Danger
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
  overlay: "rgba(20, 33, 61, 0.5)",
  shadow: "rgba(0, 0, 0, 0.05)",
};

export const DARK_COLORS = {
  primary: "#FFFFFF",
  secondary: "#00B4D8",     // Bright Blue Accent
  accent: "#FF6600",        // Vibrant Brand Orange
  background: "#0F172A",    // Deep Navy Slate Canvas
  card: "#1E293B",          // Surface Card Slate
  surface: "#1E293B",
  text: "#F1F5F9",          // Light Foreground Text
  textMuted: "#94A3B8",     // Slate Secondary Muted
  textSecondary: "#CBD5E1",
  border: "#334155",        // Dark Divider Border
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
  overlay: "rgba(0, 0, 0, 0.7)",
  shadow: "rgba(0, 0, 0, 0.3)",
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const BORDER_RADIUS = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,       // Standard Card and Container Radius
  xl: 16,
  xxl: 24,
  full: 9999,   // Pill Radius
};

export const FONTS = {
  regular: "Outfit_400Regular",
  medium: "Outfit_500Medium",
  semibold: "Outfit_600SemiBold",
  bold: "Outfit_700Bold",
  extrabold: "Outfit_800ExtraBold",
  black: "Outfit_900Black",
};

export const SHADOWS = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
};
```

---

### 5.3 Atomic UI Component Conventions ([`apps/mobile/components/ui/Button.tsx`](file:///Users/mac/Documents/PadeeSpace/apps/mobile/components/ui/Button.tsx))

All mobile primitives follow these strict requirements:
1. Must consume `useTheme()` to dynamically extract `colors`.
2. Must expose standard variants: `primary`, `accent`, `outline`, `ghost`, `danger`.
3. Standard button heights: `sm` (36px), `md` (48px), `lg` (56px).
4. Must render `ActivityIndicator` when `isLoading={true}` and disable touch interaction.

```typescript
export const Button: React.FC<ButtonProps> = ({
  title,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  style,
  ...props
}) => {
  const { colors } = useTheme();

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case "accent": return { backgroundColor: colors.accent };
      case "outline": return { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.accent };
      case "ghost": return { backgroundColor: "transparent" };
      case "danger": return { backgroundColor: colors.error + "15", borderWidth: 1, borderColor: colors.error };
      default: return { backgroundColor: colors.primary };
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case "sm": return { height: 36, paddingHorizontal: SPACING.md };
      case "lg": return { height: 56, paddingHorizontal: SPACING.xl };
      default: return { height: 48, paddingHorizontal: SPACING.lg };
    }
  };

  return (
    <TouchableOpacity
      style={[styles.base, getSizeStyle(), getVariantStyle(), (disabled || isLoading) && styles.disabled, style]}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === "outline" ? colors.accent : colors.white} />
      ) : (
        <Text style={[styles.text, { color: variant === "outline" ? colors.accent : colors.white }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
```

---

### 5.4 Offline-First Data Layer (React Query + AsyncStorage)

The mobile data layer uses TanStack Query v5 with an asynchronous cache persister:

```typescript
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // Keep unused cache for 24 hours
      staleTime: 1000 * 60 * 5,    // Treat data as fresh for 5 minutes
      retry: false,                // Prevent infinite retry loops on bad network responses
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'APP_RQ_CACHE_NAMESPACE',
});
```

---

### 5.5 Theme Engine

The mobile `ThemeContext` persists the user's preference (`"system" | "light" | "dark"`) in `AsyncStorage` and automatically binds to device appearance changes via `useColorScheme()`:

```typescript
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceColorScheme = useDeviceColorScheme();
  const [themePreference, setThemePreference] = useState<"light" | "dark" | "system">("system");

  const theme: "light" | "dark" =
    themePreference === "system"
      ? (deviceColorScheme === "dark" ? "dark" : "light")
      : themePreference;

  const colors = theme === "dark" ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ themePreference, setThemePreference, theme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

---

## 6. Web Design System & Architecture (React 19 / Tailwind / Radix)

### 6.1 HSL Token System & Theme Synchronization ([`apps/web/src/index.css`](file:///Users/mac/Documents/PadeeSpace/apps/web/src/index.css))

The web uses Tailwind CSS configured with CSS variables using the HSL color model. These tokens map directly to the mobile hex values:

```css
@import url("https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap");

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Background Canvas: #F7F8FA */
    --background: 220 20% 97%;
    /* Primary Text: #14213D */
    --foreground: 222 47% 15%;

    /* Card Surface: #FFFFFF */
    --card: 0 0% 100%;
    --card-foreground: 222 47% 15%;

    /* Brand Primary Navy: #14213D */
    --primary: 226 48% 15%;
    --primary-foreground: 0 0% 100%;

    /* Brand Accent Orange: #FF6600 */
    --accent: 24 100% 50%;
    --accent-foreground: 0 0% 100%;

    /* Dividers & Borders: #E5E7EB */
    --border: 220 13% 88%;
    --input: 220 13% 88%;
    --ring: 24 100% 50%;

    /* Radius: 12px (matches mobile BORDER_RADIUS.lg) */
    --radius: 0.75rem;

    /* Semantic States */
    --success: 142 71% 45%;    /* #10B981 */
    --warning: 38 92% 50%;     /* #F59E0B */
    --destructive: 0 84% 60%;  /* #EF4444 */
  }

  .dark {
    /* Dark Canvas: #0F172A */
    --background: 222 47% 8%;
    /* Dark Foreground: #F1F5F9 */
    --foreground: 220 20% 95%;

    /* Dark Card: #1E293B */
    --card: 222 47% 11%;
    --card-foreground: 220 20% 95%;

    /* Primary switches to Orange Accent in dark mode */
    --primary: 24 100% 50%;
    --primary-foreground: 222 47% 8%;

    --accent: 24 100% 50%;
    --accent-foreground: 222 47% 8%;

    /* Dark Border: #334155 */
    --border: 222 40% 20%;
    --input: 222 40% 20%;
    --ring: 24 100% 50%;
  }
}
```

---

### 6.2 Radix UI / Shadcn Component Pattern

All components in `apps/web/src/components/ui/` use `class-variance-authority` (cva) and the `cn()` utility (`clsx` + `tailwind-merge`):

```typescript
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:opacity-90 shadow-md",
        accent: "bg-accent text-accent-foreground hover:opacity-90 shadow-md",
        outline: "border border-input bg-transparent hover:bg-muted hover:text-foreground",
        ghost: "hover:bg-muted hover:text-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        default: "h-11 px-5 text-sm",
        lg: "h-14 px-8 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

---

### 6.3 Client-Side Auto-Refresh Queue

The web Axios client (`apps/web/src/lib/api.ts`) prevents logging out active users on transient token expiration:

```typescript
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string | null) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("auth-refresh-token");
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
        localStorage.setItem("auth-token", data.accessToken);
        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem("auth-token");
        window.location.href = "/login";
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

---

## 7. Cross-Platform Token Translation Matrix

When implementing any UI feature, map your visual tokens using this translation table:

| Token Intent | Mobile (`theme.ts`) | Web Tailwind Class | Raw Value | Visual Outcome |
|---|---|---|---|---|
| **Primary Brand** | `colors.primary` | `bg-primary`, `text-primary` | `#14213D` (Navy) | Header bars, primary brand actions |
| **Accent Action** | `colors.accent` | `bg-accent`, `text-accent` | `#FF6600` (Orange) | CTAs, active indicators, highlights |
| **Secondary Brand** | `colors.secondary` | `bg-secondary`, `text-secondary` | `#0077B6` (Blue) | Badges, commerce links |
| **Canvas Background** | `colors.background` | `bg-background` | `#F7F8FA` (L) / `#0F172A` (D) | Page background canvas |
| **Card Surface** | `colors.card` | `bg-card` | `#FFFFFF` (L) / `#1E293B` (D) | Cards, sheets, dialog surfaces |
| **Dividers & Borders** | `colors.border` | `border-border` | `#E5E7EB` (L) / `#334155` (D) | Borders, list separators |
| **Escrow Verified** | `colors.success` | `text-success`, `bg-success` | `#10B981` (Green) | Verified transactions, completed |
| **Warning / Escrow Hold**| `colors.warning` | `text-warning`, `bg-warning` | `#F59E0B` (Amber) | Escrow hold, dispute countdowns |
| **Error / Alert** | `colors.error` | `text-destructive`, `bg-destructive`| `#EF4444` (Red) | Validation errors, payment failures |
| **Typography Family** | `FONTS.regular` / `bold` | `font-sans`, `font-display` | **Outfit** | Unified cross-platform typography |
| **Standard Radius** | `BORDER_RADIUS.lg` | `rounded-xl` (`--radius`) | `12px` / `0.75rem` | Cards, buttons, input fields |
| **Pill Radius** | `BORDER_RADIUS.full` | `rounded-full` | `9999px` | Badges, tags, avatar rings |

---

## 8. Master Directive Prompt for AI Engineers

Copy and paste the prompt below into your AI coding assistant (Cursor, Claude, Copilot, ChatGPT) at the start of any conversation when building a new application in this ecosystem:

````markdown
# Role & Architecture Directives

You are a Senior Principal Software Engineer tasked with developing features inside our enterprise monorepo. You must strictly conform to our established production architecture and design systems.

### 1. Monorepo & File Structure
- We use a pnpm workspace structure:
  - `apps/backend/`: Node.js 20+, Express 4, TypeScript ESM (use `.js` extension in local imports), Prisma ORM, Redis, Socket.IO.
  - `apps/mobile/`: React Native 0.86, Expo ~57, Expo Router (file-based navigation in `app/`), NativeWind v4, Outfit font.
  - `apps/web/`: React 19, Vite, Tailwind CSS (HSL variables), Radix UI primitives (`@/components/ui`), Outfit font.
- Follow the backend layered pattern: `routes/` ➔ `middleware/` ➔ `controllers/` ➔ `services/` ➔ `prisma/`. Never place business logic directly in route definitions.

### 2. Backend Financial & Ledger Directives
- **Zero Floating-Point Math**: Currency amounts must use database `Decimal(12, 2)` or integer minor units (Kobo/Cents). Never perform direct addition/subtraction on raw JS floats.
- **Atomic Transactions**: All balance changes and ledger entries must be executed within `prisma.$transaction(async (tx) => ...)`.
- **Double-Entry Invariant**: Every transaction ledger record must populate `balanceBefore`, `balanceAfter`, and `amount`, ensuring: `balanceAfter = balanceBefore ± amount`.
- Validate all incoming request payloads with Zod before processing inside controllers.

### 3. Design System & Styling Rules
- **Typography**: The primary typeface is **Outfit** across both web and mobile (`@expo-google-fonts/outfit` on mobile, `@import url(...)` on web).
- **Color Palette**:
  - Primary Navy: `#14213D` (Light) / `#FFFFFF` (Dark)
  - Accent Orange: `#FF6600`
  - Secondary Blue: `#0077B6`
  - Background Canvas: `#F7F8FA` (Light) / `#0F172A` (Dark)
  - Card Surface: `#FFFFFF` (Light) / `#1E293B` (Dark)
  - Border / Dividers: `#E5E7EB` (Light) / `#334155` (Dark)
  - Semantic: Success `#10B981` | Warning `#F59E0B` | Danger `#EF4444`
- **Border Radius**: Use `12px` (`rounded-xl` on web, `BORDER_RADIUS.lg` on mobile) for all cards, containers, and inputs. Use `rounded-full` (`BORDER_RADIUS.full`) for badges and pills.

### 4. Client State & Networking
- Use `@tanstack/react-query` v5 for server state.
- On mobile, configure `@tanstack/query-async-storage-persister` with `@react-native-async-storage/async-storage` for offline cache resilience.
- Provide a `ThemeContext` supporting `"system" | "light" | "dark"`.
- Use Axios interceptors with a retry queue to automatically refresh expired access tokens on 401 responses.
````
