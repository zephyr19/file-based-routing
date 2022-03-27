import React, { useContext } from "react";

export interface RouterContextInterface {
  query: Record<string, any>;
}

const defaultRouterContext: RouterContextInterface = { query: {} };
const RouterContext = React.createContext(defaultRouterContext);

export const RouterContextProvider = ({
  value = defaultRouterContext,
  children,
}: React.PropsWithChildren<{ value: RouterContextInterface }>) => {
  return (
    <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
  );
};

export const useRouter = (): RouterContextInterface => {
  const contextValue = useContext(RouterContext);
  if (!contextValue) {
    throw new Error("useRouter must be used inside <RouterContextProvider />");
  }
  return contextValue;
};
