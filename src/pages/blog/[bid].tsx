import React from "react";
import { useRouter } from "@utils/router";

export default function Blog() {
  const { query, back } = useRouter();
  return (
    <>
      <h1>Blog: {query.bid}</h1>
      <p onClick={back}>Back</p>
    </>
  );
}
