# Quote Calculator

A dynamic quote calculator for event services with real-time distance-based pricing.

## Features

- Sound package options (Standard, Premium, Full Stack Bundle)
- DJ service options
- Visual packages with retro-modern theming
- Power & cooling options
- Real-time distance-based travel cost calculation
- Detailed cost breakdown

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- API Integration: OpenRouteService for distance calculations
- Deployment: Vercel
- Environment: Node.js

## Development Setup

1. Clone the repository:
```bash
git clone [your-repo-url]
cd [your-repo-name]
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
OPENROUTE_API_KEY=your_api_key_here
```

4. Run the development server:
```bash
vercel dev
```

## Deployment

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Link your project to Vercel:
```bash
vercel link
```

3. Add your OpenRouteService API key to Vercel:
```bash
vercel env add OPENROUTE_API_KEY
```

4. Deploy to Vercel:
```bash
vercel --prod
```

## Environment Variables

The following environment variables are required:

- `OPENROUTE_API_KEY`: Your OpenRouteService API key

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 