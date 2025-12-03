# Contributing to Socratic Learning Platform

## Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit with clear messages
6. Push and create a Pull Request

## Code Style

- Use TypeScript for backend and frontend
- Follow ESLint rules
- Format with Prettier
- Write tests for new features

## Project Structure

```
├── backend/          # Node.js/Express API
├── frontend/         # React/TypeScript UI
├── ml-service/       # Python ML service
└── docs/            # Documentation
```

## Testing

- Write unit tests for services
- Write integration tests for APIs
- Test UI components

## Documentation

Update relevant docs when adding features:
- API changes → `docs/API_DESIGN.md`
- Architecture changes → `docs/ARCHITECTURE.md`
- Algorithm changes → `docs/ALGORITHMS.md`
