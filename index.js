import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Stripe microserver is running ✅');
});

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { qrId, level } = req.body;
    console.log('📥 Request body:', req.body);

    if (!qrId || !level) {
      console.warn('⚠️ Missing qrId or level');
      return res.status(400).json({ error: 'Missing qrId or level' });
    }

    const amount = level === 'premium' ? 2000 : level === 'platinum' ? 20000 : null;
    if (!amount) {
      console.warn('⚠️ Invalid QR code level:', level);
      return res.status(400).json({ error: 'Invalid QR code level for payment' });
    }

    console.log('💰 Creating session with amount:', amount);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${level.charAt(0).toUpperCase() + level.slice(1)} QR Code Activation`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `https://milanuhrin.github.io/qrifyme-redirect/?qrId=${qrId}`,
      cancel_url: 'https://milanuhrin.github.io/qrifyme-redirect/?cancelled=true',
    });

    console.log('✅ Stripe session created:', session);

    res.json({ url: session.url });
  } catch (error) {
    console.error('❌ Stripe checkout error:', error); // <-- vypíše celé error telo
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
