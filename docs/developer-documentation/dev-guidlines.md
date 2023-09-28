# Developer guidelines

Below you can find several actions that should be taken while working on Tracy, as well as general guidelines to help you with your work.

### Before committing changes to the repository
- Check that all commits are necessary. Do not commit superfluous changes.

### Before merging into the main
- Check changes with ESLint and fix all Warnings and Errors.
- Update documentation to reflect your changes.
- Make sure that your branch builds correctly. (i.e., GitHub actions pipeline)

### After merging to the main
- Make sure that the merged branch is deleted.

### Guidelines
#### Best Practices
- **Creating and updating branches:** Create branches from main and fetch/pull regularly. Doing this will prevent huge merge conflicts on your branch in the future.
- **Format document:** Before you submit make sure to format the files you worked on. This makes sure your added code is formatted correctly. This also formats any code that was missed by previous contributors. Tracy utilises Prettier for code formating.
- **React and Typescript versions:** Use the latest versions of React and TypeScript, and keep them updated regularly. This will ensure that you can use the newest features and capabilities of both technologies, such as React hooks and TypeScript generics.
-  **Code style:** Use a consistent code style and follow the naming conventions described below. This will help you maintain a clean and readable codebase, and avoid common errors and bugs.
- **Typescript practices:** 
    - Use type aliases or interfaces to declare the types of your component props and state, and provide descriptive names and comments for them. This will help you document your components and make them easier to use and reuse.
    - Use type inference whenever possible, and avoid using any type or casting types with as. This will help you leverage TypeScript's type system and avoid losing type information or introducing type errors.
- **React practices:**
    - Use functional components over class components where possible. This keeps the code up to date to the latest recommendation and best practises.
    - Use Pure components when possible. This will help you write simpler and more concise components, and avoid unnecessary re-rendering and memory leaks.
    - Use custom hooks to extract reusable logic from your components, and follow the naming convention of using the "use" prefix. This will help you organize your code and avoid duplication.

#### Naming convention
- Branch naming convention: In order to avoid confusion make sure you branch has a meaningful name that immediately informs the reader what the branch contains. In addition to this make sure to prefix your branch name with either of the following names: bug-fix/ or feature/ , followed by a meaningful name.
- Use PascalCase for component names, type names, interface names, enum names, and type parameter names. For example: ComponentName, TypeName, InterfaceName, EnumName, T.
- Use camelCase for variable names, function names, method names, property names, parameter names, and module alias names. For example: variableName, functionName, methodName, propertyName, parameterName, moduleAliasName.
- Use UPPER_CASE for global constant values, including enum values and global constants. For example: CONSTANT_VALUE, ENUM_VALUE. Regular constans use camelCase.
- Use descriptive and meaningful names for your identifiers, and avoid using abbreviations or acronyms that are not widely known or understood. For example: firstName, lastName, userProfile, not fn, ln, up.
- Use consistent naming for component props types, such as <ComponentName>Props. For example: ButtonProps, ModalProps.

### References
- [Typescript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/docs/basic/setup)
- [Google Typescript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [Typescript Deep Dive (book)](https://github.com/basarat/typescript-book/blob/master/docs/styleguide/styleguide.md)