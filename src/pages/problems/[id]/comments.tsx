import React from "react";
import Link from "@utils/Link";
import { useRouter } from "@utils/router";

const Comments = () => {
  const { query, replace } = useRouter();
  return (
    <>
      <h1>comments Page, Problem id: {query.id}</h1>
      <Link href={`/blog/${query.id}`}>
        <p onClick={() => console.log("I won't disappear")}>Go to Blog</p>
      </Link>
      <h3 onClick={() => replace(`/blog/${query.id}`)}>
        Go to Blog, but replace
      </h3>
    </>
  );
};

export default Comments;
