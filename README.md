# React Flow Automated Layout

A React-based application built with TypeScript and Vite that demonstrates advanced automated layout capabilities using React Flow. The project focuses on implementing intelligent layouts for nested graphs with parent-child relationships.

## Key Features

- **Automated Layout**: Implements Dagre algorithm for automated graph layouts
- **Parent-Child Relationships**: Supports nested nodes with parent-child container relationships
- **Dynamic Resizing**: Automatic parent container resizing based on child nodes
- **Flexible Directions**: Support for both vertical (TB - top to bottom) and horizontal (LR - left to right) layouts
- **Interactive UI**: Real-time layout adjustments with control panel

## Technologies Used

- **React**: For building the user interface
- **TypeScript**: For type-safe development
- **Vite**: For fast development and build processes
- **@xyflow/react**: Core React Flow library for graph visualization
- **@dagrejs/dagre**: For automated layout calculations
- **elkjs**: For advanced layout algorithms
- **zustand**: For state management

## Project Structure

The project is organized into the following main directories:

- `src/Examples`: Contains different example implementations
  - `01-Dagre`: Demonstrates Dagre-based automated layouts
  - `Parent-Node-Resize`: Shows parent container resizing functionality
- `src/Components`: Reusable component library
- `docfiles`: Documentation and planning files

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/Jalez/react-flow-automated-layout.git
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open the application in your browser (it will open automatically)

## Examples

### Dagre Layout

The Dagre example (`DagreFlow.tsx`) demonstrates:
- Automated node positioning
- Parent-child container relationships
- Dynamic container resizing
- Switchable layout directions (vertical/horizontal)

### Parent Node Resize

The Parent Node Resize example (`ParentNodeResizeFlow.tsx`) shows:
- Interactive parent container resizing
- Child node constraints
- Nested layout management

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to improve the project.

## ESLint Configuration

The project uses a modern ESLint configuration with TypeScript support. For development, you can extend the configuration as needed:

```js
export default tseslint.config({
  extends: [
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.strictTypeChecked,
  ],
  // ... rest of the configuration
});
```
