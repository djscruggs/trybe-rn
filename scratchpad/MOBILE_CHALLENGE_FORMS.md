# Mobile Challenge Forms Documentation

This document outlines the form elements, validation rules, and logic found in the web application's challenge creation and editing flows (`challenges.new` and `challenges.v.$id.edit`). This guide is intended to assist in recreating these forms within a mobile application.

## Overview

The form is used for both creating new challenges and editing existing ones. It handles complex logic for different challenge types (`SCHEDULED` vs `SELF_LED`) and includes dynamic validation based on the current state.

### Data Types

The form data primarily maps to the `ChallengeInputs` interface (which extends `ChallengeSummary` and adds `deleteImage`).

**Key Fields:**
- `name`: string (Required)
- `description`: string (Required)
- `icon`: string (Required)
- `category`: string (though code often uses `categories` array)
- `categories`: `Category[]` (Required)
- `startAt`: Date
- `endAt`: Date
- `numDays`: number
- `type`: `SCHEDULED` | `SELF_LED`
- `frequency`: `DAILY` | `WEEKDAYS` | `ALTERNATING` | `WEEKLY` | `CUSTOM`
- `public`: boolean (Anyone vs Invite only)
- `status`: `PUBLISHED` | `DRAFT`

### Defaults
- `deleteImage`: `false`
- `numDays`: `30`
- `type`: `'SCHEDULED'`
- `frequency`: `'DAILY'`
- `categories`: `[]`
- `status`: `'DRAFT'`

---

## Form Fields & Validation

### 1. Challenge Name
- **Label**: Name of Challenge
- **Placeholder**: "Give your challenge a catchy name"
- **Type**: Text Input
- **Required**: Yes
- **Validation Message**: "Name is required"

### 2. Description
- **Label**: Description
- **Placeholder**: "Share a short description of what this challenge is all about"
- **Type**: Textarea (3 rows)
- **Required**: Yes
- **Validation Message**: "Description is required"

### 3. Categories
- **Label**: Categories
- **Type**: Checkbox Group (Dynamic from `/api/categories`)
- **Required**: Yes (at least one must be selected)
- **Validation Message**: "Category is required"
- **Logic**: User can select multiple categories.

### 4. Frequency
- **Label**: Select frequency
- **Type**: Dropdown / Select
- **Options**: `Daily, Weekdays, Weekly` (Note: internal type supports `ALTERNATING` and `CUSTOM`, but UI only shows a subset in `frequencies` array: `['DAILY', 'WEEKDAYS', 'WEEKLY']`)
- **Default**: `DAILY`

### 5. Challenge Type (Scheduled vs Self-Directed)
*Only visible to ADMIN users in the web code context (`currentUser?.role === 'ADMIN'`).*

- **Type**: Radio Buttons
- **Options**:
    - **Scheduled**: Happen on specific dates.
    - **Self-Directed**: Can be started at any time.
- **Logic**:
    - Disables switching if `memberCount > 1`.
    - Warning shown: "Challenges with active members cannot be switched."

#### Conditional Fields based on Type:

**If `SELF_LED`**:
- **Field**: Number of Days
- **Type**: Number Input
- **Min**: 5
- **Max**: 60
- **Validation**:
    - Required.
    - Message: "Number of Days is required".

**If `SCHEDULED`**:
- **Field**: Start Date
- **Type**: Date Picker
- **Required**: Yes
- **Validation**: "Start date is required"
- **Logic**:
    - Cannot change start date if members > 1 AND challenge has started.
    - Default/Min Date: `new Date()` (Cannot start in the past).
    - Auto-calculates End Date when set (default 30 days or end of month).
- **Field**: End Date
- **Type**: Date Picker
- **Required**: Yes
- **Validation**: "End date is required"
- **Min Date**: 7 days after Start Date (or 7 days from now).

### 6. Public / Private
- **Label**: Who can join?
- **Type**: Radio Buttons
- **Options**:
    - `public: true` -> "Anyone"
    - `public: false` -> "Invite only"
- **Default**: `true` (Anyone)

### 7. Publication Status
- **Label**: Publication Status
- **Type**: Radio Buttons
- **Options**:
    - `PUBLISHED`
    - `DRAFT`
- **Logic**:
    - Cannot switch back to `DRAFT` if there are members (`memberCount > 1`).
    - Warning: "Challenges with members cannot be put back in draft mode."

### 8. Color
- **Label**: Color
- **Type**: Color Picker (Preset Selection)
- **Options**: `red`, `orange`, `salmon`, `yellow`, `green`, `blue`, `purple`
- **UI**: Displayed as colored circles.

### 9. Icon
- **Label**: Select Icon
- **Type**: Icon Selection / Dropdown
- **Required**: Yes
- **Validation Message**: "Icon is required"
- **UI**: Clicking opens a grid of available icons.

### 10. Cover Photo
- **Type**: File Upload (Image)
- **Logic**:
    - Displays current image if exists (`secure_url`).
    - Allows removing existing image (sets `deleteImage: true`).
    - Uploads new file as `multipart/form-data`.

---

## Submission Logic

### Create vs Update
- **Create**: POST to `/api/challenges`. No `id` in body.
- **Update**: POST to `/api/challenges`. Includes `id` in body.

### Payload Construction (FormData)
The form submits as `multipart/form-data`.
- **Text Fields**: Appended directly.
- **Booleans/Numbers**: Converted to String.
- **Categories**: JSON stringified array of IDs: `JSON.stringify(categories.map(c => c.id))`
- **Image**: Appended as file object if new image selected.
- **deleteImage**: Sent as `'true'` if image was removed.

### Error Handling
- Validates fields locally before submission.
- Handles server-side errors returned in `response.data.errors`.
- Errors are parsed and mapped back to form fields.

## Validation Function Logic (Recreation)

```typescript
const validation: Errors = {}
if (formData.name?.trim() === '') { validation.name = 'Name is required' }
if (formData.description?.trim() === '') { validation.description = 'Description is required' }

if (formData.type === 'SCHEDULED') {
    if (!formData.startAt) { validation.startAt = 'Start date is required' }
    if (!formData.endAt) { validation.endAt = 'End date is required' }
} else {
    // SELF_LED
    if (!formData.numDays) { validation.numDays = 'Number of Days is required' }
}

if (!formData.icon) { validation.icon = 'Icon is required' }
if (!formData.categories || formData.categories?.length === 0) { validation.categories = 'Category is required' }
```
