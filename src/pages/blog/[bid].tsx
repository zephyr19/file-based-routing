import React from "react";
import { useRouter } from "@utils/router";

export default function Blog() {
  const { query } = useRouter();
  return (
    <>
      <h1>Blog: {query.bid}</h1>
    </>
  );
}
