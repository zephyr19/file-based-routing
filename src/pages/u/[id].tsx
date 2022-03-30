import React from "react";
import Link from "@utils/Link";
import { useRouter } from "@utils/router";

const User = () => {
  const { query } = useRouter();
  return (
    <>
      <h1>User Page, id: {query.id}</h1>
      <Link href="/">back to home</Link>
    </>
  );
};

export default User;
