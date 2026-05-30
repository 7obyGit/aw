## Typescript

- Avoid "multi-purpose" files (follow a "one thing" - "one file" pattern)
- Use meaningful and descriptive names for variables, functions, and classes
- Make extensive use of the type system to enforce correctness
- Explicitly specify types everywhere to ensure clarity and maintainability
- Naming:
  - Prefix interface files and interfaces with "I"
  - Prefix enum files and enums with "E"
  - Prefix type files and types with "T"
  - Use camelCase for variable and function names
  - Use PascalCase for class names
  - Use ALL_CAPS for constants like `API_URL` but not for complex objects like `integrationManager`
  - Avoid abbreviations in names unless they are widely recognized