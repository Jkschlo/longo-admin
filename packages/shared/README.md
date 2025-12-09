# @longo/shared

Shared utilities, types, and configurations for the Longo Training Platform.

## Overview

This package provides common functionality used by both the mobile app (`Longo_App`) and admin dashboard (`longo-admin`). It ensures consistency across projects and reduces code duplication.

## Installation

This package is automatically linked via npm workspaces. No manual installation needed.

## Usage

### Types

Import database types:

```typescript
import { 
  Profile, 
  Module, 
  Category, 
  QuizAttempt,
  ModuleProgress 
} from "@longo/shared";
```

### Configuration

Get Supabase configuration:

```typescript
import { getSupabaseConfig, validateEnv } from "@longo/shared";

// Validate environment variables are set
validateEnv();

// Get configuration
const config = getSupabaseConfig();
// Returns: { url: string, anonKey: string, serviceRoleKey?: string }
```

### Security Utilities

```typescript
import { 
  sanitizeEmail,
  isValidEmail,
  validatePasswordStrength,
  SESSION_TIMEOUT,
  SESSION_CHECK_INTERVAL,
  isSessionExpired
} from "@longo/shared";

// Sanitize user input
const cleanEmail = sanitizeEmail("  USER@EXAMPLE.COM  "); // "user@example.com"

// Validate email
if (isValidEmail(email)) {
  // ...
}

// Validate password
const result = validatePasswordStrength(password);
if (!result.valid) {
  console.log(result.errors);
}

// Check session expiry
if (isSessionExpired(lastActivityTimestamp)) {
  // Session expired
}
```

### Constants

```typescript
import { 
  STORAGE_BUCKETS,
  PROGRESS_STATUS,
  QUIZ_CONFIG,
  CONTENT_TYPES
} from "@longo/shared";

// Storage buckets
const imageUrl = `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKETS.MODULE_IMAGES}/image.jpg`;

// Progress status
if (progress.status === PROGRESS_STATUS.COMPLETE) {
  // ...
}

// Quiz configuration
const passingScore = QUIZ_CONFIG.PASSING_SCORE; // 80
```

## Development

### Building

```bash
npm run build
```

### Watch Mode

```bash
npm run dev
```

### Type Checking

```bash
npm run type-check
```

## Structure

```
src/
├── types/
│   └── database.ts      # Database schema types
├── config/
│   └── env.ts          # Environment configuration
├── utils/
│   ├── security.ts     # Security utilities
│   └── constants.ts    # Shared constants
└── index.ts            # Main export file
```

## Adding New Shared Code

1. Add your code to the appropriate directory in `src/`
2. Export it from `src/index.ts`
3. Run `npm run build`
4. The changes will be available in both projects

## Best Practices

- Keep types in sync with your Supabase database schema
- Use TypeScript for type safety
- Document exported functions and types
- Keep utilities framework-agnostic when possible
- Test shared utilities independently when possible

