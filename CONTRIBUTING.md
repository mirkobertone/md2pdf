# Contributing to MD2PDF

First off, thank you for considering contributing to MD2PDF! 🎉

It's people like you that make MD2PDF such a great tool. We welcome contributions from everyone, whether it's:

- 🐛 Reporting a bug
- 💡 Discussing the current state of the code
- 🔧 Submitting a fix
- 🚀 Proposing new features
- 📖 Improving documentation

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Pull Requests Process

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests (when applicable)
3. Ensure your code follows the existing style
4. Make sure your code lints (`pnpm lint`)
5. Issue that pull request!

## Local Development Setup

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/your-username/md2pdf.git
   cd md2pdf
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start the development server**

   ```bash
   pnpm dev
   ```

4. **Make your changes**

   - Write clean, readable code
   - Follow the existing code style
   - Add comments for complex logic

5. **Test your changes**

   - Test the app thoroughly in your browser
   - Try different markdown inputs
   - Verify PDF generation works correctly

6. **Build to verify**
   ```bash
   pnpm build
   ```

## Code Style Guidelines

- Use TypeScript for type safety
- Follow React best practices and hooks patterns
- Use functional components
- Write clear, descriptive variable names
- Add JSDoc comments for complex functions
- Keep functions small and focused on a single task

### TypeScript

- Properly type all variables and function parameters
- Avoid using `any` type
- Use interfaces for complex object types

### React Components

- Use functional components with hooks
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks
- Properly handle side effects with `useEffect`

### CSS

- Follow the existing naming conventions
- Keep selectors specific but not overly nested
- Use CSS variables for colors and spacing (when applicable)
- Ensure responsive design considerations

## Reporting Bugs

We use GitHub issues to track bugs. Report a bug by [opening a new issue](https://github.com/mirkobertone/md2pdf/issues/new).

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample markdown if possible
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or things you tried that didn't work)

### Bug Report Template

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

1. Go to '...'
2. Type in '....'
3. Click on '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**

- OS: [e.g. Windows 10, macOS 13, Ubuntu 22.04]
- Browser: [e.g. Chrome 120, Firefox 121, Safari 17]
- Version: [e.g. 1.0.0]

**Additional context**
Add any other context about the problem here.
```

## Feature Requests

We love feature requests! Before submitting, please check:

1. Is the feature already requested? Check existing issues
2. Is it aligned with the project's goals?
3. Can you provide a clear use case?

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
```

## Project Structure

```
md2pdf/
├── public/          # Static assets
├── src/
│   ├── App.tsx      # Main application component
│   ├── App.css      # Application styles
│   ├── main.tsx     # Application entry point
│   └── index.css    # Global styles
├── dist/            # Production build output
└── ...config files
```

## Testing

While we don't currently have automated tests, please manually test:

- [ ] Editor input and output
- [ ] Real-time preview updates
- [ ] PDF generation and download
- [ ] Auto-save functionality
- [ ] Clear functionality
- [ ] Different markdown features (tables, code blocks, lists, etc.)
- [ ] Responsive design on different screen sizes

## Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

### Good Commit Messages Examples

```
Add syntax highlighting for Python code blocks
Fix PDF export margin calculation
Update README with installation instructions
Improve auto-save performance
```

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

## Questions?

Don't hesitate to ask questions in the issues or discussions section!

---

Thank you for contributing! 🙏
