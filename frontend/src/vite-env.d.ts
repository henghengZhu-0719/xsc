/// <reference types="vite/client" />

declare module "react-markdown" {
  import type { ReactNode } from "react";
  export interface Options {
    children: string;
  }
  export default function Markdown(props: Options): ReactNode;
}
