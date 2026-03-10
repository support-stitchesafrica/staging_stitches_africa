# Deployment Guide - Financing Simulator

## Quick Start - Deploy to Vercel (Recommended)

### Option 1: Using Vercel CLI (Fastest)

1. **Install Vercel CLI** (if not already installed):
```bash
npm install -g vercel
```

2. **Navigate to the financing-demo folder**:
```bash
cd financing-demo
```

3. **Deploy**:
```bash
vercel
```

4. **Follow the prompts**:
   - Login to Vercel (if not logged in)
   - Set up project settings
   - Deploy!

Your app will be live at: `https://your-project-name.vercel.app`

### Option 2: Using Vercel Dashboard (No CLI needed)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New" → "Project"
3. Import your Git repository OR upload the `financing-demo` folder
4. Vercel will auto-detect the static site
5. Click "Deploy"

Done! Your app is live.

---

## Deploy to Netlify

### Option 1: Netlify Drop (Easiest)

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag and drop the entire `financing-demo` folder
3. Your site is live instantly!

### Option 2: Using Netlify CLI

1. **Install Netlify CLI**:
```bash
npm install -g netlify-cli
```

2. **Navigate to folder**:
```bash
cd financing-demo
```

3. **Deploy**:
```bash
netlify deploy
```

4. **For production**:
```bash
netlify deploy --prod
```

### Option 3: Using Netlify Dashboard

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click "Add new site" → "Deploy manually"
3. Drag the `financing-demo` folder
4. Site is live!

---

## Deploy to GitHub Pages

1. **Create a new repository** on GitHub (e.g., `financing-demo`)

2. **Initialize git in the financing-demo folder**:
```bash
cd financing-demo
git init
git add .
git commit -m "Initial commit - Financing simulator"
```

3. **Push to GitHub**:
```bash
git remote add origin https://github.com/YOUR_USERNAME/financing-demo.git
git branch -M main
git push -u origin main
```

4. **Enable GitHub Pages**:
   - Go to repository Settings
   - Navigate to "Pages"
   - Select source: "main" branch
   - Click "Save"

Your site will be live at: `https://YOUR_USERNAME.github.io/financing-demo/`

---

## Testing Locally Before Deployment

### Option 1: Python Server
```bash
cd financing-demo
python -m http.server 8000
```
Visit: `http://localhost:8000`

### Option 2: Node.js
```bash
cd financing-demo
npx serve
```

### Option 3: PHP
```bash
cd financing-demo
php -S localhost:8000
```

### Option 4: VS Code Live Server Extension
1. Install "Live Server" extension in VS Code
2. Right-click `index.html`
3. Select "Open with Live Server"

---

## Post-Deployment

### Custom Domain (Optional)

#### Vercel:
1. Go to project settings in Vercel dashboard
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records as instructed

#### Netlify:
1. Go to site settings
2. Navigate to "Domain management"
3. Add custom domain
4. Follow DNS configuration steps

### Environment Configuration

This is a static app with no backend, so no environment variables are needed.

All data is stored in browser LocalStorage and resets when cleared.

---

## Troubleshooting

### Issue: Files not loading
**Solution**: Ensure all file paths are relative (they are by default)

### Issue: LocalStorage not working
**Solution**: Make sure site is served over HTTPS (Vercel/Netlify do this automatically)

### Issue: CORS errors
**Solution**: This app doesn't make external API calls, but if you extend it, ensure proper CORS headers

---

## Performance Optimization

The app is already optimized:
- ✅ Pure vanilla JavaScript (no framework overhead)
- ✅ Minimal CSS (no preprocessors needed)
- ✅ Optimized images via Unsplash CDN
- ✅ No external dependencies
- ✅ Fast page loads (<100KB total)

---

## Monitoring & Analytics (Optional)

### Add Google Analytics:

Add before closing `</head>` in `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR_GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'YOUR_GA_ID');
</script>
```

---

## Support

For issues or questions, contact the development team or refer to:
- Vercel Docs: https://vercel.com/docs
- Netlify Docs: https://docs.netlify.com
- GitHub Pages Docs: https://docs.github.com/pages

---

**Deployment Complete!** 🚀

Your financing simulator is now live and ready to demonstrate the BNPL experience to stakeholders.
