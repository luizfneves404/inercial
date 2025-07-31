/// <reference types="vite/client" />
import { NOTE_FREQUENCIES } from "./config";

declare module "matter-js" {
  interface IBodyDefinition {
    customLength?: number;
    lineTemplate?: keyof typeof NOTE_FREQUENCIES | "Custom Length";
  }
}

// Add this line to turn this file into a module
export {};
