import React from "react";
import Link from "@utils/Link";
import { useRouter } from "@utils/router";

const Comments = () => {
  const { query } = useRouter();
  return (
    <>
      <h1>comments Page, Problem id: {query.id}</h1>
      <Link href="/">back to home</Link>
    </>
  );
};

export default Comments;
