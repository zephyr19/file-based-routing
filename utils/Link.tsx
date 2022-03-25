import React from "react";

interface LinkProps {
  href: string;
}

const Link = ({ href, children }: React.PropsWithChildren<LinkProps>) => {
  if (typeof children === "string") {
    children = <a>{children}</a>;
  }

  // https://zh-hans.reactjs.org/docs/react-api.html
  const child: any = React.Children.only(children);
  const childProps = {
    onClick() {
      child.props.onClick?.();
      history.pushState(null, "", href);
    },
  };

  return React.cloneElement(child, childProps);
};

export default Link;
