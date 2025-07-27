/// <reference types="vite/client" />

declare module "matter-js" {
  interface IBodyDefinition {
    customLength?: number;
  }
}

// Add this line to turn this file into a module
export {};
