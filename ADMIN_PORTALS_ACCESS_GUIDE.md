# Stitches Africa — Admin Portals & Access Guide

This document covers every internal admin portal in the platform, the roles that exist within each, and what information each role can access.

---

## Overview of Portals

The platform has four distinct admin portals, each serving a different operational function:

| Portal | URL Prefix | Purpose |
|---|---|---|
| Admin Dashboard | `/admin` | Core operations — orders, vendors, customers, inventory |
| Atlas | `/atlas` | Business intelligence & analytics |
| Back Office | `/backoffice` | Unified multi-department management |
| Newsletter | `/newsletter` | Email campaigns & subscriber management |

---

## 1. Admin Dashboard (`/admin`)

The original operations portal. Access is controlled by a `superadmin` or `admin` role stored in the Firestore `admins` collection (or a hardcoded super admin email).

### Roles

| Role | Description |
|---|---|
| `superadmin` | Full unrestricted access to all admin sections |
| `admin` | Full access to all admin sections (same as superadmin in practice) |

Both roles have identical access to every section below. There is no granular permission splitting at this level.

### Sections & What They See

**Dashboard (Home)**
- Revenue overview, total customers, total orders
- Monthly customer registrations chart
- Most ordered products
- Low stock alerts
- Tailor activity feed

**Analytics**
- Business analytics charts (sales trends, revenue breakdown)
- Key metrics (orders, revenue, customer counts)
- Business insights and performance summaries

**Customers**
- Full list of all registered customers (name, email, join date, tailor ID)
- Individual customer profile view
- Search and filter by name, email, or ID

**Inventory**
- All vendor/tailor product listings
- Stock levels (available units, reserved units)
- Low stock alerts (items with ≤ 5 units flagged)
- Filter by stock status (In Stock / Low Stock)

**Vendors**
- All vendor accounts with profile details
- Individual vendor deep-dive view
- Vendor approval management

**Vendor Approvals**
- Pending vendor KYC/approval requests
- Approve or reject vendor applications

**Orders (User Orders)**
- All customer orders across the platform
- Order status management
- Return order processing

**Return Orders**
- Orders flagged for return
- Process and approve returns

**Consignment Orders**
- Consignment-specific order management

**Manual Order**
- Create orders manually on behalf of customers

**Statement of Account**
- Financial statements per vendor or overall

**BOGO Promotions**
- Buy-one-get-one promotional campaign management

**News**
- Create, edit, and publish news/blog articles
- News analytics (views, engagement)
- News settings

**Feature Flags**
- Toggle platform features on/off

**Settings**
- Platform-wide configuration

---

## 2. Atlas Analytics Portal (`/atlas`)

Atlas is the business intelligence dashboard for the Stitches Africa internal team. Access requires an `@stitchesafrica.com` or `@stitchesafrica.pro` email address. Users are stored in the `atlasUsers` Firestore collection.

### Roles

| Role | Can Manage Team | Description |
|---|---|---|
| `superadmin` | Yes | Full access to all dashboards + team management |
| `founder` | No | Full read access to all dashboards, no team management |
| `sales_lead` (BDM) | No | Sales, vendor, referral, and storefront analytics |
| `brand_lead` | No | Traffic, brand, BOGO, collections, and notification analytics |
| `logistics_lead` | No | Traffic, vendor sales, logistics, and referral admin |

### Dashboard Access by Role

| Dashboard | superadmin | founder | sales_lead | brand_lead | logistics_lead |
|---|---|---|---|---|---|
| Main Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Analytics Overview | ✓ | ✓ | — | — | — |
| Traffic Analytics | ✓ | ✓ | — | ✓ | ✓ |
| Vendor Sales | ✓ | ✓ | ✓ | — | ✓ |
| Logistics | ✓ | ✓ | — | — | ✓ |
| AI Assistant Analytics | ✓ | ✓ | ✓ | ✓ | — |
| Agent Chat | ✓ | ✓ | ✓ | ✓ | — |
| Vendor Analytics | ✓ | ✓ | ✓ | ✓ | ✓ |
| BOGO Analytics | ✓ | ✓ | — | ✓ | — |
| BOGO Promotions | ✓ | ✓ | — | ✓ | — |
| Storefront Analytics | ✓ | ✓ | ✓ | ✓ | — |
| Collections Analytics | ✓ | ✓ | ✓ | ✓ | — |
| Referral Analytics | ✓ | ✓ | ✓ | ✓ | — |
| Hierarchical Referral Admin | ✓ | ✓ | ✓ | ✓ | ✓ |
| Cross Analytics | ✓ | ✓ | ✓ | ✓ | — |
| Notification Analytics | ✓ | ✓ | — | ✓ | — |
| Coupons | ✓ | ✓ | ✓ | ✓ | — |
| Top Viewed Products | ✓ | ✓ | ✓ | ✓ | ✓ |
| Top Searched Products | ✓ | ✓ | ✓ | ✓ | ✓ |
| Popular Cart Items | ✓ | ✓ | ✓ | ✓ | ✓ |
| Free Gifts | ✓ | ✓ | — | — | — |
| Team Management | ✓ | — | — | — | — |

### Traffic Sub-sections
- Downloads, Location, Pages, Social, Trend, Website Hits

### Referral Analytics Sub-sections
- Referral overview, individual referrer profiles, referrers list

---

## 3. Back Office (`/backoffice`)

The Back Office is a unified multi-department portal that consolidates operations across Analytics, Promotions, Collections, Marketing, and Admin. Users are stored in the `backoffice_users` Firestore collection.

### Roles

| Role | Type | Description |
|---|---|---|
| `superadmin` | Top Level | Full access to all departments (read, write, delete) |
| `founder` | Top Level | Read-only access to all departments except Admin |
| `bdm` | Analytics Lead | Sales analytics + vendor management + marketing read/write |
| `brand_lead` | Analytics Lead | Products analytics read/write + promotions read |
| `logistics_lead` | Analytics Lead | Logistics analytics read/write only |
| `marketing_manager` | Marketing | Full marketing access + analytics/promotions read |
| `marketing_member` | Marketing | Own tasks and interactions only (marketing read/write, no delete) |
| `admin` | Content | Promotions full access + collections + admin dashboard |
| `editor` | Content | Edit promotions and collections (no delete) |
| `viewer` | Content | Read-only access to analytics, promotions, and collections |

### Departments

The Back Office is divided into 5 departments. Each role has a specific permission level (read / write / delete) per department.

#### Department Permission Matrix

| Role | Analytics | Promotions | Collections | Marketing | Admin |
|---|---|---|---|---|---|
| `superadmin` | R/W/D | R/W/D | R/W/D | R/W/D | R/W/D |
| `founder` | R | R | R | R | — |
| `bdm` | R/W | R | — | R/W | — |
| `brand_lead` | R/W | R | — | — | — |
| `logistics_lead` | R/W | — | — | — | — |
| `marketing_manager` | R | R | — | R/W/D | — |
| `marketing_member` | R | — | — | R/W | — |
| `admin` | R | R/W/D | R/W | — | R/W |
| `editor` | R | R/W | R/W | — | — |
| `viewer` | R | R | R | — | — |

R = Read, W = Write, D = Delete, — = No access

### What Each Department Contains

**Analytics Department** (`/backoffice/analytics`)
- Traffic analytics (website hits, page views, user sessions)
- Sales analytics (revenue, orders, conversion rates)
- Products analytics (product performance, catalog insights)
- Logistics analytics (delivery performance, shipping costs)

**Promotions Department** (`/backoffice/promotions`)
- Promotional events list (create, view, edit, delete)
- Event detail pages
- Promotions analytics
- Create new promotional events

**Collections Department** (`/backoffice/collections`)
- Product collections list
- Create new collections
- Edit existing collections
- Featured collections management

**Marketing Department** (`/backoffice/marketing`)
- Vendor management (BDM/manager only — not visible to marketing_member)
- Team tasks (managers see all tasks; members see only their own)
- Interactions log (managers see all; members see their own)
- Marketing analytics overview (managers only)

**Admin Department** (`/backoffice/admin`)
- Platform settings
- Tailor/vendor management
- User management
- Team management (superadmin only)

### Team Management (superadmin only)
- View all Back Office team members
- Invite new users via email
- Edit user roles
- Activate / deactivate accounts
- View and manage pending invitations
- Role management and permissions matrix view

---

## 4. Newsletter Portal (`/newsletter`)

A standalone email marketing portal. Access requires the `isNewsuser: true` flag on the user's Firestore document. There is a single access level — all authenticated newsletter users have the same capabilities.

### Access
- Single role: Newsletter User (`isNewsuser: true`)
- No granular role splitting within this portal

### Sections & What They See

**Dashboard (Home)**
- Total campaigns count
- Sent campaigns count
- Total subscribers (active subscribers + waiting list)
- Active subscribers count
- Recent campaigns list with recipient counts
- Quick action shortcuts

**Campaigns**
- Full list of all email campaigns (draft, scheduled, sent)
- Create new campaigns
- Duplicate existing campaigns
- Delete campaigns
- Send campaigns to subscriber lists
- Filter by status (All / Drafts / Scheduled / Sent)

**Campaign Detail**
- Individual campaign view with full stats (opens, clicks, recipients)

**Templates**
- Browse and manage email templates
- Edit existing templates

**Subscribers**
- Users tab: all registered platform users subscribed to newsletter
- Vendors tab: vendor accounts subscribed to newsletter
- Waiting List tab: users on the pre-launch/collection waiting list
- Folders tab: custom subscriber groupings
- Add individual subscribers manually
- Import subscribers via CSV
- Export subscriber lists as PDF
- Delete subscribers
- Search and paginate across all lists

**Newsletter Users**
- Manage newsletter admin user accounts
- Individual user profile view

**Analytics**
- Campaign performance metrics (open rates, click rates, delivery stats)

---

## Summary: Portal vs. Role Quick Reference

| Portal | Who Uses It | Key Distinction |
|---|---|---|
| Admin Dashboard | Operations team | Manages day-to-day orders, vendors, customers, inventory |
| Atlas | Leadership & department leads | Read-only analytics and business intelligence by role |
| Back Office | Cross-functional team | Multi-department with granular read/write/delete per department |
| Newsletter | Email marketing team | Unified access — all users see everything |

---

## Authentication Notes

- **Admin Dashboard**: Firebase Auth + Firestore `admins` collection. Roles: `superadmin`, `admin`.
- **Atlas**: Firebase Auth + Firestore `atlasUsers` collection. Email must be `@stitchesafrica.com` or `@stitchesafrica.pro`.
- **Back Office**: Firebase Auth + Firestore `backoffice_users` collection. Department-level permissions stored per user.
- **Newsletter**: Firebase Auth + Firestore user document with `isNewsuser: true` flag.
