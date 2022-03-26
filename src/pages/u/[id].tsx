import React from "react";
import Link from "../../../utils/Link";

const User = (queries) => {
  return (
    <>
      <h1>User Page, id: {queries.id}</h1>
      <Link href="/">back to home</Link>
    </>
  );
};

export default User;
