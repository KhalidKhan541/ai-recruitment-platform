# Contributing to AI Recruitment Platform

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a branch for your feature/fix
4. Make your changes
5. Submit a pull request

## Development Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/your-username/ai-recruitment-platform.git
cd ai-recruitment-platform

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Start services
docker-compose up -d db redis

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

## Branch Naming

Use descriptive branch names with prefixes:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

Example: `feature/add-candidate-search`

## Commit Messages

Follow the Conventional Commits specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

### Examples

```
feat(candidates): add skill-based search filter
fix(auth): handle expired session tokens
docs(readme): update installation instructions
test(api): add job posting endpoint tests
```

## Code Style

### TypeScript

- Use strict TypeScript
- Avoid `any` types when possible
- Use interfaces for object shapes
- Export types that are used externally

### React

- Use functional components with hooks
- Keep components small and focused
- Use proper prop types
- Handle loading and error states

### CSS

- Use Tailwind CSS utility classes
- Follow the design system
- Ensure responsive design
- Maintain accessibility

## Testing

### Writing Tests

- Write tests for new features
- Test edge cases and error scenarios
- Use descriptive test names
- Keep tests independent

### Test Structure

```typescript
describe("Feature", () => {
  it("should do something", () => {
    // Arrange
    // Act
    // Assert
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/api/jobs.test.ts

# Run with coverage
npm test -- --coverage
```

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Ensure all tests pass** before submitting
4. **Update the README** if adding new features
5. **Request review** from maintainers

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings generated
```

## Code Review

All submissions require review before merging. We use GitHub pull requests for this purpose.

### Review Criteria

- Code quality and readability
- Test coverage
- Documentation
- Performance implications
- Security considerations

## Reporting Issues

Use GitHub Issues to report bugs or request features.

### Bug Report Template

```markdown
## Description
Clear description of the issue

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 120]
- Node.js: [e.g., 20.10.0]
```

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to open an issue for any questions about contributing.
