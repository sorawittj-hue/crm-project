# 🚀 ZENITH CRM - Production-Ready Sales Management System

A modern, enterprise-grade CRM application built with React, Supabase, and AI-powered insights.

## ✨ Features

### 🎯 Core Functionality
- **Pipeline Management**: Kanban-style deal board with drag-and-drop
- **Customer Management**: Complete CRM with lifetime value tracking
- **Command Center**: Real-time dashboard with AI-generated battle plans
- **Analytics**: Comprehensive sales metrics and forecasting
- **AI Tools**: Intelligent deal analysis, email generation, and prioritization

### 🛠️ Technical Features
- **Real-time Database**: Supabase backend with automatic sync
- **Error Handling**: Global error boundary with graceful fallbacks
- **Toast Notifications**: User feedback for all actions
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Keyboard Shortcuts**: Power user features for efficiency
- **Natural Scrolling**: Drag-to-scroll, swipe support, enhanced scrollbars

## 📋 Prerequisites

Before deploying, ensure you have:
- Node.js 18+ and npm installed
- A Supabase account and project created
- Gemini API key for AI features (optional)

## 🚀 Deployment Guide

### Step 1: Database Setup

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Create a new project** or select existing one
3. **Run the SQL Schema**:
   - Navigate to SQL Editor in Supabase
   - Copy the contents of `supabase_schema_complete.sql`
   - Paste and run the entire script
   - Verify all tables are created successfully

### Step 2: Environment Configuration

1. **Copy the example env file**:
   ```bash
   cp .env.example .env
   ```

2. **Update `.env` with your credentials**:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

   **How to get these keys:**
   - **Supabase URL**: Go to Project Settings → API → Project URL
   - **Supabase Anon Key**: Project Settings → API → anon/public key
   - **Gemini API Key**: https://makersuite.google.com/app/apikey (optional, for AI features)

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Development

Run the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Step 5: Production Build

```bash
npm run build
npm run preview
```

Or deploy to Vercel/Netlify:

#### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

#### Deploy to Netlify
```bash
npm run build
# Drag and drop the `dist` folder to Netlify
```

## 📊 Database Schema Overview

### Tables Created:
1. **team_members**: Sales team configuration
2. **app_settings**: Global app configuration (targets, currency)
3. **customers**: Customer/contact database
4. **deals**: Deal/opportunity tracking
5. **activities**: Calls, emails, meetings, notes
6. **email_templates**: Reusable email templates
7. **notifications**: In-app notifications

### Views for Analytics:
- `pipeline_summary`: Deals by stage
- `team_performance`: Sales rep performance
- `customer_lifetime_value`: Customer LTV metrics
- `monthly_revenue`: Revenue trends

## 🎨 Customization

### Branding
Edit `src/index.css` to customize:
- Color scheme (CSS variables in `:root`)
- Typography
- Spacing

### Team Configuration
Update team members in Supabase `team_members` table:
```sql
UPDATE team_members 
SET name = 'Your Name', 
    goal = 5000000,
    color = 'bg-blue-600'
WHERE id = 'leader';
```

### Email Templates
Add custom templates in Supabase `email_templates` table:
```sql
INSERT INTO email_templates (name, subject, body, category)
VALUES ('Custom Template', 'Subject', 'Body text...', 'custom');
```

## 🔧 Troubleshooting

### "Failed to load deals" error
- Check Supabase credentials in `.env`
- Verify `deals` table exists in Supabase
- Check RLS policies allow read access

### AI features not working
- Verify Gemini API key is set in `.env`
- Check API quota in Google Cloud Console
- AI features are optional - app works without them

### Build errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Database connection issues
- Ensure Supabase project is active
- Check firewall/network settings
- Verify API keys have correct permissions

## 📱 Usage Guide

### Adding a Deal
1. Click "New Deal" button in Pipeline
2. Fill in required fields (Title, Company, Value)
3. Select assigned team member
4. Click "Create Deal"

### Moving Deals
- **Drag & Drop**: Drag card to different stage
- **Keyboard**: Select deal + `Shift + ←/→`
- **Quick Actions**: Hover + click arrow buttons

### Customer Management
1. Go to Customers page
2. Search/filter by name, company, tier
3. Click customer to view details
4. View lifetime value and deal history

### AI Features
- **AI Scan**: Extract deal info from PDFs
- **Battle Plan**: Generate daily action plan (Command page)
- **Strategic Mandates**: AI-powered recommendations

## 🎯 Best Practices

### Data Entry
- Always fill `company` and `contact` fields
- Update `last_activity` after each interaction
- Set `probability` for accurate forecasting
- Add `tags` for better filtering

### Pipeline Management
- Review "At Risk" deals daily
- Move stalled deals (>14 days) forward
- Pin high-priority deals
- Use quick filters for efficiency

### Team Collaboration
- Log all activities in the system
- Use email templates for consistency
- Set clear next steps for each deal
- Update deal stage immediately

## 🔐 Security Notes

### Current Setup (Development)
- RLS policies allow all operations (open access)
- Suitable for single-user/small team internal use

### Production Recommendations
1. **Enable Authentication**: Use Supabase Auth
2. **Restrict RLS Policies**: Limit access by user_id
3. **Add Role-based Access**: Different permissions per role
4. **Enable Audit Logging**: Track all data changes
5. **Use Environment Variables**: Never commit `.env` file

## 📈 Performance Optimization

The app includes:
- React Query caching (5-minute stale time)
- Lazy loading for heavy components
- Memoized calculations (useMemo)
- Optimized database queries with indexes
- Debounced search inputs

## 🆘 Support

For issues or questions:
1. Check this README
2. Review error messages in browser console
3. Check Supabase logs in dashboard
4. Verify database schema is complete

## 📝 Changelog

### v2.0 - Current
- ✅ Complete database schema
- ✅ Error boundary and toast notifications
- ✅ Enhanced API services with validation
- ✅ Natural horizontal scrolling
- ✅ Keyboard shortcuts
- ✅ AI-powered deal analysis
- ✅ Improved UX across all pages

### Planned
- [ ] Real-time collaboration
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Email integration
- [ ] Calendar sync

## 📄 License

This is a proprietary application. All rights reserved.

---

**Built with ❤️ using React, Supabase, and AI**

*Zenith CRM - Your Sales, Orchestrated.*
