# Marketing Dashboard Validation Guide

This guide explains how to use the validation utilities in the Marketing Dashboard.

## Overview

The validation system provides both client-side and server-side validation with clear error messages. It includes:

- **Form Validator**: Core validation logic
- **React Hooks**: Client-side validation hooks
- **Validation Components**: UI components for displaying errors
- **Common Rules**: Pre-defined validation rules for common forms

## Client-Side Validation

### Using the useFormValidation Hook

```typescript
import { useFormValidation } from '@/lib/marketing/useFormValidation';
import { CommonValidationRules, createValidationRule } from '@/lib/marketing/form-validator';

function MyForm() {
  const { validate, errors, getFieldError, validateField } = useFormValidation();
  
  const validationRules = [
    createValidationRule('name', CommonValidationRules.team.name),
    createValidationRule('email', CommonValidationRules.invitation.email)
  ];

  const handleSubmit = (data) => {
    const isValid = validate(data, validationRules);
    if (!isValid) {
      return; // Errors are stored in the errors object
    }
    // Proceed with submission
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" />
      {getFieldError('name') && <span>{getFieldError('name')}</span>}
    </form>
  );
}
```

### Real-Time Field Validation

```typescript
import { useFieldValidation } from '@/lib/marketing/useFormValidation';
import { CommonValidationRules } from '@/lib/marketing/form-validator';

function EmailField() {
  const { error, validate } = useFieldValidation('email', CommonValidationRules.invitation.email);

  return (
    <div>
      <input 
        type="email"
        onChange={(e) => validate(e.target.value)}
      />
      {error && <span className="error">{error}</span>}
    </div>
  );
}
```

### Using Validation Components

```typescript
import { ValidatedInput, FormErrors, FieldError } from '@/components/marketing/ValidationError';

function MyForm() {
  const { errors } = useFormValidation();

  return (
    <form>
      <FormErrors errors={errors} />
      
      <ValidatedInput label="Name" error={errors.name} required>
        <input type="text" name="name" />
      </ValidatedInput>
    </form>
  );
}
```

## Server-Side Validation

### Using ServerSideValidator

```typescript
import { ServerSideValidator, createValidationRule } from '@/lib/marketing/form-validator';
import { CommonValidationRules } from '@/lib/marketing/form-validator';

export async function POST(request: Request) {
  const data = await request.json();

  const rules = [
    createValidationRule('name', CommonValidationRules.team.name),
    createValidationRule('leadUserId', CommonValidationRules.team.leadUserId)
  ];

  // Validate and sanitize
  const { isValid, sanitizedData, errors } = ServerSideValidator.validateAndSanitize(data, rules);

  if (!isValid) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  // Use sanitizedData for processing
  // ...
}
```

### Validate or Throw

```typescript
import { ServerSideValidator } from '@/lib/marketing/form-validator';

try {
  ServerSideValidator.validateOrThrow(data, rules);
  // Proceed with processing
} catch (error) {
  // Error contains formatted validation errors
  return NextResponse.json({ error: error.message }, { status: 400 });
}
```

## Common Validation Rules

### Team Form

```typescript
import { CommonValidationRules } from '@/lib/marketing/form-validator';

const rules = [
  { field: 'name', rules: CommonValidationRules.team.name },
  { field: 'description', rules: CommonValidationRules.team.description },
  { field: 'leadUserId', rules: CommonValidationRules.team.leadUserId }
];
```

### Invitation Form

```typescript
const rules = [
  { field: 'name', rules: CommonValidationRules.invitation.name },
  { field: 'email', rules: CommonValidationRules.invitation.email },
  { field: 'role', rules: CommonValidationRules.invitation.role }
];
```

### Assignment Form

```typescript
const rules = [
  { field: 'vendorId', rules: CommonValidationRules.assignment.vendorId },
  { field: 'userId', rules: CommonValidationRules.assignment.userId },
  { field: 'notes', rules: CommonValidationRules.assignment.notes }
];
```

## Custom Validation Rules

### Creating Custom Rules

```typescript
import { createValidationRule, createCustomValidator } from '@/lib/marketing/form-validator';

const customRule = createValidationRule('customField', [
  { type: 'required', message: 'This field is required' },
  { type: 'minLength', value: 5, message: 'Must be at least 5 characters' },
  createCustomValidator(
    'Must contain at least one number',
    (value) => /\d/.test(value)
  )
]);
```

### Custom Validator Function

```typescript
const passwordMatchRule = createCustomValidator(
  'Passwords must match',
  (value, formData) => value === formData.password
);
```

## Validation Rule Types

### Required

```typescript
{ type: 'required', message: 'This field is required' }
```

### Email

```typescript
{ type: 'email', message: 'Invalid email format' }
```

### Min Length

```typescript
{ type: 'minLength', value: 5, message: 'Must be at least 5 characters' }
```

### Max Length

```typescript
{ type: 'maxLength', value: 100, message: 'Must be less than 100 characters' }
```

### Pattern (Regex)

```typescript
{ type: 'pattern', value: /^[A-Z]/, message: 'Must start with uppercase letter' }
```

### Custom

```typescript
{
  type: 'custom',
  message: 'Custom validation failed',
  validator: (value) => {
    // Return true if valid, false if invalid
    return value.length > 0;
  }
}
```

## Error Display Components

### FormErrors

Displays all form errors at once:

```typescript
<FormErrors 
  errors={errors} 
  title="Please fix the following errors:"
  onDismiss={clearErrors}
/>
```

### FieldError

Displays error for a single field:

```typescript
<FieldError error={getFieldError('name')} />
```

### ValidationError

Displays a single error or list of errors:

```typescript
<ValidationError 
  error="Single error message"
  onDismiss={() => {}}
/>

<ValidationError 
  errors={['Error 1', 'Error 2']}
  onDismiss={() => {}}
/>
```

### ValidatedInput

Wraps an input with label and error display:

```typescript
<ValidatedInput label="Name" error={errors.name} required>
  <input type="text" name="name" />
</ValidatedInput>
```

## Best Practices

1. **Always validate on both client and server**: Client-side for UX, server-side for security
2. **Use real-time validation for better UX**: Validate fields as users type
3. **Provide clear error messages**: Tell users exactly what's wrong and how to fix it
4. **Sanitize input data**: Always trim strings and remove null/undefined values
5. **Use common validation rules**: Reuse pre-defined rules for consistency
6. **Handle validation errors gracefully**: Show errors clearly without blocking the UI

## Example: Complete Form with Validation

See `components/marketing/ValidatedTeamForm.tsx` for a complete example of a form with:
- Real-time field validation
- Form-level validation on submit
- Clear error messages
- Success feedback
- Disabled state during submission

## Service-Level Validation

All service methods include validation:

### Team Service
- Validates team name uniqueness
- Validates team lead exists and has correct role
- Validates member IDs are valid and active

### Assignment Service
- Validates vendor exists
- Validates user exists and is active
- Validates user capacity
- Prevents duplicate assignments

### Invitation Service
- Validates email domain
- Validates role is valid
- Prevents duplicate invitations
- Validates invitation token

## Testing Validation

```typescript
import { FormValidator } from '@/lib/marketing/form-validator';

describe('Form Validation', () => {
  it('should validate required fields', () => {
    const validator = new FormValidator();
    const result = validator.validate(
      { name: '' },
      [{ field: 'name', rules: [{ type: 'required', message: 'Required' }] }]
    );
    
    expect(result.isValid).toBe(false);
    expect(result.errors.name).toBe('Required');
  });
});
```
