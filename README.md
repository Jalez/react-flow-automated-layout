# Mindmap Project

This project is a React-based application built with TypeScript and Vite. It provides a platform for creating and managing mindmaps with a variety of features and tools to enhance user experience. The project is structured to support modular development and includes several components, utilities, and stores for managing the mindmap's state and functionality.

## Key Features

- **Mindmap Creation and Editing**: Tools for creating nodes, edges, and layouts for mindmaps.
- **Customizable Layouts**: Includes algorithms for hierarchical and other layout types.
- **Keyboard Shortcuts**: Support for efficient navigation and editing using keyboard shortcuts.
- **Minimap**: A minimap for quick navigation within large mindmaps.
- **Node and Edge Management**: Utilities for managing nodes and edges, including editing and selection.
- **Extensible Controls**: A registry-based system for adding and managing controls.
- **Testing and Documentation**: Includes test data and documentation for further development.

## Technologies Used

- **React**: For building the user interface.
- **TypeScript**: For type-safe development.
- **Vite**: For fast development and build processes.
- **ELK Layout**: For advanced layout algorithms.
- **Zustand**: For state management.

## Project Structure

The project is organized into the following main directories:

- `src/Mindmap`: Contains the core logic and components for the mindmap.
- `src/Mindmap/Controls`: Includes components and context for managing controls.
- `src/Mindmap/Layout`: Handles layout algorithms and related utilities.
- `src/Mindmap/Node`: Manages node creation, editing, and registry.
- `src/Mindmap/Flow`: Manages the flow and viewport of the mindmap.
- `src/Mindmap/Minimap`: Implements the minimap feature.
- `src/Mindmap/Select`: Handles selection logic and UI.
- `src/Mindmap/Documentation`: Contains documentation and notes for development.
- `src/Mindmap/test`: Includes test data and utilities for testing.

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/Jalez/mindmap.git
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open the application in your browser at `http://localhost:3000`.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to improve the project.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ["./tsconfig.node.json", "./tsconfig.app.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    "react-x": reactX,
    "react-dom": reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs["recommended-typescript"].rules,
    ...reactDom.configs.recommended.rules,
  },
});
```
