/// <reference types="vite/client" />

declare module "matter-js" {
  interface IBodyDefinition {
    customLength?: number;
    disposable?: boolean;
  }
}

// Add this line to turn this file into a module
export {};
