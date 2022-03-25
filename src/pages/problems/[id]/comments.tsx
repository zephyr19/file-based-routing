import React from "react";
import Link from "../../../../utils/Link";

const Comments = (queries) => {
  return (
    <>
      <h1>comments Page, Problem id: {queries.id}</h1>
      <Link href="/">back to home</Link>
    </>
  );
};

export default Comments;
