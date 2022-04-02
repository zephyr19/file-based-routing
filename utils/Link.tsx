import React, { useMemo } from "react";
import { useRouter } from "./router";

interface LinkProps {
  href: string;
}

const Link = ({ href, children }: React.PropsWithChildren<LinkProps>) => {
  const { push } = useRouter();
  if (typeof children === "string") {
    children = <a>{children}</a>;
  }

  // https://zh-hans.reactjs.org/docs/react-api.html
  const child: any = React.Children.only(children);
  const childProps = useMemo(() => ({
    onClick() {
      child.props.onClick?.();
      push(href);
    },
  }), [href]);

  return React.cloneElement(child, childProps);
};

export default Link;
