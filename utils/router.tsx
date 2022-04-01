import React, { useContext, useEffect } from "react";

export interface RouterContextInterface {
  query: Record<string, any>;
}

export interface RouterType {
  // pathname: string;
  query: Record<string, any>;
  push(url: string): void;
  replace(url: string): void;
  // beforePopState(): void;
  back(): void;
}

const defaultRouterContext: RouterContextInterface = { query: {} };
const RouterContext = React.createContext(defaultRouterContext);

export function onPopState() {
  location.href = location.href;
}

export const RouterContextProvider = ({
  value = defaultRouterContext,
  children,
}: React.PropsWithChildren<{ value: RouterContextInterface }>) => {
  useEffect(() => {
    window.onpopstate = onPopState;
  });

  return (
    <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
  );
};

export const useRouter = (): RouterType => {
  const contextValue = useContext(RouterContext);
  if (!contextValue) {
    throw new Error("useRouter must be used inside <RouterContextProvider />");
  }
  return {
    ...contextValue,
    push(url) {
      history.pushState(null, "", url);
      onPopState();
    },
    replace(url) {
      history.replaceState(null, "", url);
      onPopState();
    },
    back() {
      history.back();
    },
  };
};
