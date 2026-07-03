# BlueWings Connect

## Project Overview

BlueWings Connect is a modern, comprehensive airline booking platform powered by AI. It provides a seamless user experience for searching flights, selecting seats via an interactive dynamic seat map, managing bookings, and getting real-time assistance through an Chat widget and Whatsapp Chat. It also includes a robust Admin Portal for managing flights, dynamic pricing, aircraft cabin configurations, and user feedback. The system is designed with a concurrency-safe backend architecture using optimistic locking to prevent double-bookings during seat selection.

## Technology Stack

- **Frontend**: Next.js 16 (React 19), Tailwind CSS, shadcn/ui, Framer Motion, Zod
- **Backend**: Node.js, Express (v5), TypeScript
- **Database**: Supabase (PostgreSQL)

## Installation Steps

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd "BlueWings Connect"
   ```

2. **Database Setup:**
   - Create a project on [Supabase](https://supabase.com/).
   - Run the provided `schema.sql` file in the Supabase SQL Editor to set up the necessary tables, policies, and row-level security.

3. **Backend Setup:**
   ```bash
   cd backend
   npm install
   ```
   - Create a `.env` file in the `backend` directory and configure your environment variables (e.g., Supabase URL, Service Role Key, API keys).

4. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   ```
   - Create a `.env.local` file in the `frontend` directory and configure your environment variables (e.g., Supabase URL, Anon Key).

## Run Instructions

You will need two terminal windows to run both the frontend and backend servers simultaneously.

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```
*The backend server will start (typically on port 5000 or as defined in your environment).*

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
*The frontend application will start and be accessible at http://localhost:3000*

## Default Credentials

Use the following dummy credentials to explore the different roles within the application:

### Admin Portal
- **Login URL**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- **Email**: `admin@phononsky.com`
- **Password**: `AdminPassword123!`

### User Portal
- **Login URL**: [http://localhost:3000/](http://localhost:3000/)
- **Email**: `aumshahofficial@gmail.com`
- **Password**: `aumshah26`

## Assumptions

- Users have a stable internet connection.
- A functional Supabase project is set up and accessible.
- All necessary environment variables are correctly configured before running the application locally.
- The Node.js environment is v18 or higher.

## Known Limitations

- Real payment processing is currently not integrated (simulated checkout flow).
- The AI chat widget depends on external API limits and might experience latency based on network conditions.
- Email delivery for booking confirmations relies on Supabase Auth/Email configurations, which may have rate limits on the free tier.

## Future Enhancements

- **Payment Gateway Integration**: Integration with Stripe or PayPal for real transactions.
- **Mobile Application**: Developing a cross-platform mobile app using React Native or Flutter.
- **Boarding Passes**: Automated generation of PDF boarding passes and Apple Wallet/Google Wallet integration.
- **Multi-language Support (i18n)**: Expanding accessibility to a global audience.
- **Loyalty Program**: Introducing a miles-based rewards system for frequent flyers.
